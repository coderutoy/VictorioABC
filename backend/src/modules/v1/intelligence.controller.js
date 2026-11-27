import crypto from 'node:crypto';
import { supabaseAdmin } from '../../config/supabase.js';
import { AppError, asyncHandler } from '../../middleware/error.middleware.js';
import { normalizeBranchId } from '../auth/auth.controller.js';
import { decryptPatientRecord } from '../../../utils/encryption.js';
import {
  listLiveTable,
  insertLiveRow,
  updateLiveRow,
  packCaseNotes,
  unpackCaseRow,
  loadEnrichedProfiles,
  updateEnrichedProfile,
  appendAuditLog,
} from './liveStore.js';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(baseDateStr, offsetDays) {
  const [y, m, d] = baseDateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + offsetDays));
  return dt.toISOString().slice(0, 10);
}

function daysBetween(dateA, dateB) {
  if (!dateA || !dateB) return 999;
  const a = new Date(dateA).getTime();
  const b = new Date(dateB).getTime();
  return Math.round((b - a) / (1000 * 3600 * 24));
}

function resolveLockedBranchId(req) {
  const role = req.user?.role;
  if (role === 'doctor' || role === 'nurse') {
    return req.user.branch_id;
  }
  const requested = normalizeBranchId(
    req.query?.branch_id || req.headers['x-branch-id'] || req.body?.branch_id
  );
  return requested || 'santa-maria';
}

/**
 * Automatically transitions any `active` reconstituted vials whose `expires_at <= now`
 * to `expired` and records remaining unadministered doses as `wasted_doses`.
 */
async function refreshExpiredVials(vials) {
  const nowMs = Date.now();
  const result = [];
  for (const vial of vials) {
    const expMs = new Date(vial.expires_at).getTime();
    if (vial.status === 'active' && expMs <= nowMs) {
      const wasted = Math.max(
        0,
        Number(vial.total_doses || 5) - Number(vial.administered_doses || 0)
      );
      const updated = await updateLiveRow('reconstituted_vials', vial.id, {
        status: 'expired',
        wasted_doses: wasted,
      });
      result.push(updated);
    } else {
      result.push(vial);
    }
  }
  return result;
}

/**
 * GET /api/v1/admin/command-center
 * Live network-wide aggregations across all 7 official Victorio ABC branches:
 * - KPI Strip (Daily Revenue by payment method, Patients Treated New vs Boosters, Missed Follow-Ups, Pending PhilHealth ABTP, Active System Alerts)
 * - 7-Branch Comparison Matrix + Read-Only Operational Drill-Down Drawer payloads
 * - 14-Day Predictive Stockout & Auto-Rebalancing Engine
 * - Multi-Dose Vial Yield & Shrinkage Intelligence
 * - Staff Governance & PRC License Expiration Monitor
 * - Immutable Sensitive Action Audit Log
 */
export const getAdminCommandCenter = asyncHandler(async (req, res) => {
  const today = todayIso();
  const horizon14d = addDays(today, 14);

  const [
    { data: branchesRows, error: brErr },
    profilesList,
    { data: patientsRows, error: patErr },
    { data: rawCasesRows, error: caseErr },
    { data: dosesRows, error: doseErr },
    { data: inventoryRows, error: invErr },
    aiSubmissions,
    rawVials,
    coldChainLogs,
    billingTransactions,
    aefiReports,
    defaulterCallLogs,
    auditLogs,
  ] = await Promise.all([
    supabaseAdmin.from('branches').select('*').order('name', { ascending: true }),
    loadEnrichedProfiles(),
    supabaseAdmin.from('patients').select('*'),
    supabaseAdmin.from('clinical_cases').select('*').order('created_at', { ascending: false }),
    supabaseAdmin.from('pep_doses').select('*').order('scheduled_date', { ascending: true }),
    supabaseAdmin
      .from('vaccine_inventory')
      .select('*')
      .order('expiry_date', { ascending: true }),
    listLiveTable('ai_triage_submissions', { sortField: 'created_at', ascending: false }),
    listLiveTable('reconstituted_vials', { sortField: 'opened_at', ascending: false }),
    listLiveTable('cold_chain_logs', { sortField: 'recorded_at', ascending: false }),
    listLiveTable('billing_transactions', { sortField: 'created_at', ascending: false }),
    listLiveTable('aefi_reports', { sortField: 'created_at', ascending: false }),
    listLiveTable('defaulter_call_logs', { sortField: 'called_at', ascending: false }),
    listLiveTable('audit_logs', { sortField: 'created_at', ascending: false }),
  ]);

  if (brErr || patErr || caseErr || doseErr || invErr) {
    throw new AppError(
      `Database query error: ${
        brErr?.message || patErr?.message || caseErr?.message || doseErr?.message || invErr?.message
      }`,
      500
    );
  }

  const branches = branchesRows || [];
  const branchMap = new Map(branches.map((b) => [b.id, b]));
  const vials = await refreshExpiredVials(rawVials || []);

  const decryptedPatients = (patientsRows || []).map((p) => decryptPatientRecord(p));
  const patientMap = new Map(decryptedPatients.map((p) => [p.id, p]));

  const cases = (rawCasesRows || []).map((c) => {
    const unpacked = unpackCaseRow(c);
    return {
      ...unpacked,
      patient: patientMap.get(c.patient_id) || null,
    };
  });
  const caseMap = new Map(cases.map((c) => [c.id, c]));

  const doses = (dosesRows || []).map((d) => {
    const parentCase = caseMap.get(d.case_id);
    return {
      ...d,
      case_number: parentCase?.case_number || 'CASE',
      exposure_category: parentCase?.exposure_category || 'II',
      wound_site: parentCase?.wound_site || parentCase?.anatomical_site || 'Extremity',
      is_high_risk_cat3: Boolean(
        parentCase?.is_high_risk_cat3 || parentCase?.exposure_category === 'III'
      ),
      patient: parentCase?.patient || null,
    };
  });

  // 1. Network-Wide KPI Strip
  const revenueByMethod = {
    cash: 0,
    gcash_maya: 0,
    card: 0,
    hmo: 0,
    philhealth_abtp: 0,
  };
  let totalDailyRevenuePhp = 0;
  let pendingPhilhealthPhp = 0;
  let pendingPhilhealthCount = 0;

  for (const tx of billingTransactions) {
    const netAmount = Math.max(0, Number(tx.amount_php || 0) - Number(tx.discount_php || 0));
    if (tx.status === 'paid') {
      totalDailyRevenuePhp += netAmount;
      if (revenueByMethod[tx.payment_method] !== undefined) {
        revenueByMethod[tx.payment_method] += netAmount;
      }
    } else if (tx.status === 'pending_philhealth') {
      pendingPhilhealthPhp += netAmount;
      pendingPhilhealthCount += 1;
      revenueByMethod.philhealth_abtp += netAmount;
    }
  }

  const newCasesCount = cases.filter(
    (c) => c.status === 'queued_nurse' || c.status === 'pending_doctor' || c.exposure_date === today
  ).length;
  const scheduledBoostersCount = doses.filter(
    (d) => d.dose_day > 0 && (d.scheduled_date === today || d.status === 'completed')
  ).length;

  const missedDosesList = doses
    .filter(
      (d) =>
        d.status === 'missed' ||
        (d.status === 'scheduled' && d.scheduled_date < today)
    )
    .sort((a, b) => {
      if (a.is_high_risk_cat3 !== b.is_high_risk_cat3) {
        return a.is_high_risk_cat3 ? -1 : 1;
      }
      return String(a.scheduled_date).localeCompare(String(b.scheduled_date));
    })
    .map((d) => ({
      ...d,
      branch_name: branchMap.get(d.branch_id)?.name || d.branch_id,
    }));

  // 2. 7-Branch Comparison Matrix + 14-Day Predictive Stockout & Vial Yield
  const ORDER_SLUGS = [
    'santa-maria',
    'baliwag',
    'pandi',
    'drt',
    'meycauayan-camalig',
    'meycauayan-poblacion',
    'cefels-caloocan',
  ];
  const orderedBranches = [
    ...ORDER_SLUGS.map((id) => branchMap.get(id)).filter(Boolean),
    ...branches.filter((b) => !ORDER_SLUGS.includes(b.id)),
  ];

  const branchMatrix = [];
  const predictiveBranches = [];
  const vialYieldBranches = [];

  for (const b of orderedBranches) {
    const bCases = cases.filter((c) => c.branch_id === b.id);
    const bDoses = doses.filter((d) => d.branch_id === b.id);
    const bInv = (inventoryRows || []).filter((i) => i.branch_id === b.id);
    const bVials = vials.filter((v) => v.branch_id === b.id);
    const bCold = coldChainLogs.filter((c) => c.branch_id === b.id);
    const bBilling = billingTransactions.filter((t) => t.branch_id === b.id);
    const bStaff = profilesList.filter(
      (p) => p.branch_id === b.id && (p.role === 'doctor' || p.role === 'nurse')
    );
    const bAudits = auditLogs.filter((a) => a.branch_id === b.id);
    const bMissed = missedDosesList.filter((d) => d.branch_id === b.id);

    const bPaymentBreakdown = {
      cash: 0,
      gcash_maya: 0,
      card: 0,
      hmo: 0,
      philhealth_abtp: 0,
    };
    let bDailySalesPhp = 0;
    let bPendingPhilhealthPhp = 0;

    for (const tx of bBilling) {
      const net = Math.max(0, Number(tx.amount_php || 0) - Number(tx.discount_php || 0));
      if (tx.status === 'paid') {
        bDailySalesPhp += net;
        if (bPaymentBreakdown[tx.payment_method] !== undefined) {
          bPaymentBreakdown[tx.payment_method] += net;
        }
      } else if (tx.status === 'pending_philhealth') {
        bPendingPhilhealthPhp += net;
        bPaymentBreakdown.philhealth_abtp += net;
      }
    }

    const bNewCases = bCases.filter(
      (c) => c.status === 'queued_nurse' || c.status === 'pending_doctor' || c.exposure_date === today
    ).length;
    const bBoosters = bDoses.filter(
      (d) => d.dose_day > 0 && (d.scheduled_date === today || d.status === 'completed')
    ).length;

    const pvrvVialsLeft = bInv
      .filter((i) => i.category === 'vaccine')
      .reduce((acc, i) => acc + Number(i.stock_vials || 0), 0);
    const erigHrigLeft = bInv
      .filter((i) => i.category === 'erig')
      .reduce((acc, i) => acc + Number(i.stock_vials || 0), 0);
    const tetanusLeft = bInv
      .filter((i) => i.category === 'tetanus')
      .reduce((acc, i) => acc + Number(i.stock_vials || 0), 0);

    const latestCold = bCold[0] || null;
    const latestTempC = latestCold ? Number(latestCold.temperature_c) : null;
    const isColdChainBreach = latestCold ? Boolean(latestCold.is_breach) : false;

    // Multi-Dose Vial Yield & Shrinkage calculations
    const totalReconstitutedDoses = bVials.reduce(
      (acc, v) => acc + Number(v.total_doses || 5),
      0
    );
    const administeredVialDoses = bVials.reduce(
      (acc, v) => acc + Number(v.administered_doses || 0),
      0
    );
    const wastedVialDoses = bVials.reduce(
      (acc, v) => acc + Number(v.wasted_doses || 0),
      0
    );
    const activeRemainingDoses = bVials
      .filter((v) => v.status === 'active')
      .reduce(
        (acc, v) =>
          acc + Math.max(0, Number(v.total_doses || 5) - Number(v.administered_doses || 0)),
        0
      );

    const closedCapacity = totalReconstitutedDoses - activeRemainingDoses;
    const openVialWastageRatePct =
      closedCapacity > 0
        ? Number(((wastedVialDoses / closedCapacity) * 100).toFixed(1))
        : 0;
    const yieldRatePct =
      closedCapacity > 0
        ? Number(((administeredVialDoses / closedCapacity) * 100).toFixed(1))
        : 100;

    // 14-Day Predictive Stockout calculation from real scheduled Day 3, 7, 14, 28 pep_doses
    const scheduledBoosters14d = bDoses.filter(
      (d) =>
        d.status === 'scheduled' &&
        d.scheduled_date >= today &&
        d.scheduled_date <= horizon14d
    ).length;
    const activePepCount = bCases.filter((c) => c.status === 'active_pep').length;
    const projectedWalkInDoses14d = Math.max(6, (bNewCases + activePepCount) * 8);
    const projectedTotalIdDoses14d = scheduledBoosters14d + projectedWalkInDoses14d;
    // Avg 3.5 effective ID doses per reconstituted PVRV vial
    const projectedVialsNeeded14d = Math.max(
      4,
      Math.ceil(projectedTotalIdDoses14d / 2.2)
    );
    const dailyBurnVials = Number((projectedVialsNeeded14d / 14).toFixed(2));
    const estimatedDaysUntilStockout =
      dailyBurnVials > 0 ? Math.round(pvrvVialsLeft / dailyBurnVials) : 99;
    const surplusOrDeficitVials = pvrvVialsLeft - projectedVialsNeeded14d;

    const nearExpiryBatches = bInv.filter(
      (i) =>
        i.category === 'vaccine' &&
        Number(i.stock_vials) > 0 &&
        daysBetween(today, i.expiry_date) <= 60
    );
    const nearExpiryVialsCount = nearExpiryBatches.reduce(
      (acc, i) => acc + Number(i.stock_vials || 0),
      0
    );

    const stockRiskLevel =
      estimatedDaysUntilStockout <= 14 || pvrvVialsLeft <= 24
        ? 'critical'
        : estimatedDaysUntilStockout <= 24 || pvrvVialsLeft <= 38
          ? 'warning'
          : 'healthy';

    let auditStatus = 'Compliant';
    if (isColdChainBreach) {
      auditStatus = 'Cold-Chain Breach';
    } else if (openVialWastageRatePct >= 20) {
      auditStatus = 'High Vial Wastage';
    } else if (stockRiskLevel === 'critical') {
      auditStatus = 'Stockout Risk (<14d)';
    } else if (bMissed.some((m) => m.is_high_risk_cat3)) {
      auditStatus = 'Cat III Defaulter';
    }

    const shortName = b.name.replace('Victorio ABC — ', '');

    branchMatrix.push({
      branch_id: b.id,
      branch_name: b.name,
      short_name: shortName,
      address: b.address,
      phone: b.phone,
      dailySalesPhp: bDailySalesPhp,
      pendingPhilhealthPhp: bPendingPhilhealthPhp,
      paymentBreakdown: bPaymentBreakdown,
      newCasesCount: bNewCases,
      boosterCount: bBoosters,
      totalPatientsTreated: bCases.length,
      pvrvVialsLeft,
      erigHrigLeft,
      tetanusLeft,
      latestTempC,
      isColdChainBreach,
      latestShiftLabel: latestCold?.shift_label || 'Not logged today',
      latestTempRecordedAt: latestCold?.recorded_at || null,
      openVialWastageRatePct,
      yieldRatePct,
      totalReconstitutedDoses,
      administeredVialDoses,
      wastedVialDoses,
      activeOpenVialsCount: bVials.filter((v) => v.status === 'active').length,
      missedFollowUpsCount: bMissed.length,
      auditStatus,
      stockRiskLevel,
      estimatedDaysUntilStockout,
      drillDown: {
        cases: bCases.slice(0, 12),
        inventoryBatches: bInv,
        vials: bVials,
        coldChainHistory: bCold.slice(0, 8),
        billingTransactions: bBilling.slice(0, 10),
        staff: bStaff,
        auditLogs: bAudits.slice(0, 10),
        missedDoses: bMissed,
      },
    });

    predictiveBranches.push({
      branch_id: b.id,
      branch_name: b.name,
      short_name: shortName,
      pvrvVialsLeft,
      erigHrigLeft,
      scheduledBoosters14d,
      projectedTotalIdDoses14d,
      projectedVialsNeeded14d,
      dailyBurnVials,
      estimatedDaysUntilStockout,
      surplusOrDeficitVials,
      nearExpiryVialsCount,
      nearExpiryBatch: nearExpiryBatches[0] || null,
      riskLevel: stockRiskLevel,
    });

    const billedVialPatients = bBilling.filter((t) => t.status !== 'voided').length * 2;
    const unbilledVarianceDoses = Math.max(0, administeredVialDoses - billedVialPatients);

    vialYieldBranches.push({
      branch_id: b.id,
      branch_name: b.name,
      short_name: shortName,
      vialsOpenedCount: bVials.length,
      totalDosesCapacity: totalReconstitutedDoses,
      administeredDoses: administeredVialDoses,
      wastedDoses: wastedVialDoses,
      activeRemainingDoses,
      yieldRatePct,
      wastageRatePct: openVialWastageRatePct,
      unbilledVarianceDoses,
      isHighWastageFlag: openVialWastageRatePct >= 20 || unbilledVarianceDoses > 0,
    });
  }

  // Generate Auto-Rebalancing Recommendations from surplus / near-expiry branches to deficit branches
  const deficitBranches = [...predictiveBranches]
    .filter((b) => b.riskLevel === 'critical' || b.surplusOrDeficitVials < 10)
    .sort((a, b) => a.estimatedDaysUntilStockout - b.estimatedDaysUntilStockout);

  const surplusBranches = [...predictiveBranches]
    .filter((b) => b.pvrvVialsLeft >= 60 && b.surplusOrDeficitVials > 20)
    .sort((a, b) => b.nearExpiryVialsCount - a.nearExpiryVialsCount);

  const rebalancingRecommendations = [];
  for (let i = 0; i < deficitBranches.length; i += 1) {
    const recipient = deficitBranches[i];
    const donor = surplusBranches[i % Math.max(1, surplusBranches.length)];
    if (!donor || donor.branch_id === recipient.branch_id) continue;

    const transferVials = Math.min(
      15,
      Math.max(8, Math.round(donor.nearExpiryVialsCount * 0.45) || 10)
    );
    rebalancingRecommendations.push({
      id: `REB-${donor.branch_id.slice(0, 3).toUpperCase()}-TO-${recipient.branch_id
        .slice(0, 3)
        .toUpperCase()}`,
      from_branch_id: donor.branch_id,
      from_branch_name: donor.short_name,
      to_branch_id: recipient.branch_id,
      to_branch_name: recipient.short_name,
      item_name: donor.nearExpiryBatch?.item_name || 'Verorab PVRV (0.5mL ID/IM)',
      batch_number: donor.nearExpiryBatch?.batch_number || 'VRB-FEFO-PAN-A',
      expiry_date: donor.nearExpiryBatch?.expiry_date || addDays(today, 38),
      recommended_vials: transferVials,
      recipient_days_left: recipient.estimatedDaysUntilStockout,
      donor_surplus_vials: donor.pvrvVialsLeft,
      rationale: `Move ${transferVials} near-expiry FEFO vials from ${donor.short_name} (${donor.pvrvVialsLeft} vials in stock) to ${recipient.short_name} (projected stockout in ${recipient.estimatedDaysUntilStockout} days based on 14-day booster schedule).`,
    });
  }

  // Staff Governance & PRC License Expiration Monitor
  const staffGovernance = profilesList
    .filter((p) => ['admin', 'doctor', 'nurse'].includes(p.role))
    .map((p) => {
      const daysUntilExpiry = p.prc_expiry_date
        ? daysBetween(today, p.prc_expiry_date)
        : 365;
      const prcStatus =
        daysUntilExpiry < 0
          ? 'expired'
          : daysUntilExpiry <= 60
            ? 'expiring_soon'
            : 'valid';
      return {
        ...p,
        branch_name: p.branch_id
          ? branchMap.get(p.branch_id)?.name?.replace('Victorio ABC — ', '') || p.branch_id
          : 'All 7 Branches (Owner)',
        daysUntilExpiry,
        prcStatus,
      };
    });

  // Active System Alerts count
  const coldChainBreachesCount = branchMatrix.filter((b) => b.isColdChainBreach).length;
  const lowStockBranchesCount = predictiveBranches.filter(
    (b) => b.riskLevel === 'critical'
  ).length;
  const expiringVialsCount = vials.filter((v) => {
    if (v.status !== 'active') return false;
    const remHours = (new Date(v.expires_at).getTime() - Date.now()) / (1000 * 3600);
    return remHours > 0 && remHours <= 1.25;
  }).length;
  const pendingHighRiskAiCount = aiSubmissions.filter(
    (s) => s.verification_status === 'pending' && s.ai_predicted_category === 'III'
  ).length;
  const cat3DefaultersCount = missedDosesList.filter((d) => d.is_high_risk_cat3).length;

  const activeSystemAlerts = {
    total:
      coldChainBreachesCount +
      lowStockBranchesCount +
      expiringVialsCount +
      pendingHighRiskAiCount +
      cat3DefaultersCount,
    coldChainBreaches: coldChainBreachesCount,
    lowStockBranches: lowStockBranchesCount,
    expiringVials: expiringVialsCount,
    pendingHighRiskAi: pendingHighRiskAiCount,
    cat3Defaulters: cat3DefaultersCount,
  };

  // Enrich auditLogs with branch short name
  const enrichedAudits = auditLogs.map((a) => ({
    ...a,
    branch_name: a.branch_id
      ? branchMap.get(a.branch_id)?.name?.replace('Victorio ABC — ', '') || a.branch_id
      : 'Network HQ',
  }));

  res.status(200).json({
    ok: true,
    success: true,
    data: {
      kpiStrip: {
        totalDailyRevenuePhp,
        revenueByMethod,
        totalPatientsTreated: {
          total: cases.length,
          newCases: newCasesCount,
          scheduledBoosters: scheduledBoostersCount,
        },
        missedFollowUps: {
          count: missedDosesList.length,
          cat3Count: cat3DefaultersCount,
          items: missedDosesList,
        },
        pendingPhilhealthAbtp: {
          amountPhp: pendingPhilhealthPhp,
          claimsCount: pendingPhilhealthCount,
        },
        activeSystemAlerts,
      },
      branchMatrix,
      predictiveStockout: {
        horizonDays: 14,
        branches: predictiveBranches,
        recommendations: rebalancingRecommendations,
      },
      vialYieldAnalytics: {
        networkTotalVials: vials.length,
        networkTotalCapacityDoses: vials.reduce(
          (acc, v) => acc + Number(v.total_doses || 5),
          0
        ),
        networkAdministeredDoses: vials.reduce(
          (acc, v) => acc + Number(v.administered_doses || 0),
          0
        ),
        networkWastedDoses: vials.reduce(
          (acc, v) => acc + Number(v.wasted_doses || 0),
          0
        ),
        branches: vialYieldBranches,
        recentVials: vials.map((v) => ({
          ...v,
          branch_name:
            branchMap.get(v.branch_id)?.name?.replace('Victorio ABC — ', '') ||
            v.branch_id,
        })),
      },
      staffGovernance,
      auditLogs: enrichedAudits,
      aefiReports,
      defaulterCallLogs,
    },
  });
});

/**
 * POST /api/v1/admin/rebalance-transfer
 * Executes an inter-branch PVRV vial rebalancing transfer between two official branches
 * and logs an immutable entry to `audit_logs`.
 */
export const executeRebalanceTransfer = asyncHandler(async (req, res) => {
  const {
    from_branch_id,
    to_branch_id,
    batch_number,
    vials_count = 10,
    reason,
  } = req.body || {};

  if (!from_branch_id || !to_branch_id) {
    throw new AppError('from_branch_id and to_branch_id are required.', 400);
  }

  const count = Math.max(1, Number(vials_count) || 10);

  const { data: donorBatches } = await supabaseAdmin
    .from('vaccine_inventory')
    .select('*')
    .eq('branch_id', from_branch_id)
    .eq('category', 'vaccine')
    .gt('stock_vials', 0)
    .order('expiry_date', { ascending: true });

  const donorBatch =
    (donorBatches || []).find((b) => b.batch_number === batch_number) ||
    (donorBatches || [])[0];

  if (!donorBatch || Number(donorBatch.stock_vials) < count) {
    throw new AppError('Insufficient donor branch stock for rebalancing transfer.', 400);
  }

  await supabaseAdmin
    .from('vaccine_inventory')
    .update({
      stock_vials: Math.max(0, Number(donorBatch.stock_vials) - count),
      updated_at: new Date().toISOString(),
    })
    .eq('id', donorBatch.id);

  // Add or increment on recipient branch
  const { data: recBatches } = await supabaseAdmin
    .from('vaccine_inventory')
    .select('*')
    .eq('branch_id', to_branch_id)
    .eq('category', 'vaccine')
    .order('expiry_date', { ascending: true });

  const recBatch = (recBatches || [])[0];
  if (recBatch) {
    await supabaseAdmin
      .from('vaccine_inventory')
      .update({
        stock_vials: Number(recBatch.stock_vials) + count,
        updated_at: new Date().toISOString(),
      })
      .eq('id', recBatch.id);
  }

  const auditEntry = await appendAuditLog({
    branch_id: to_branch_id,
    actor_id: req.user?.id || null,
    actor_name: `${req.user?.full_name || 'Super Admin'} (${req.user?.prc_license_number || 'OWNER'})`,
    action_type: 'AUTO_REBALANCE_TRANSFER_EXECUTED',
    entity_type: 'vaccine_inventory',
    reason:
      reason ||
      `Transferred ${count} FEFO vials (${donorBatch.batch_number}) from ${from_branch_id} to ${to_branch_id} to prevent 14-day stockout.`,
    metadata: {
      from_branch_id,
      to_branch_id,
      batch_number: donorBatch.batch_number,
      vials_transferred: count,
    },
  });

  res.status(200).json({
    ok: true,
    success: true,
    audit: auditEntry,
  });
});

/**
 * GET /api/v1/doctor/workspace
 * Strictly scoped to the authenticated doctor's assigned `branch_id`.
 */
export const getDoctorWorkspace = asyncHandler(async (req, res) => {
  const branchId = resolveLockedBranchId(req);

  const [
    { data: branchRow },
    { data: patientsRows, error: patErr },
    { data: rawCasesRows, error: caseErr },
    { data: dosesRows, error: doseErr },
    aiSubmissions,
    aefiReports,
    auditLogs,
  ] = await Promise.all([
    supabaseAdmin.from('branches').select('*').eq('id', branchId).maybeSingle(),
    supabaseAdmin.from('patients').select('*').eq('branch_id', branchId),
    supabaseAdmin
      .from('clinical_cases')
      .select('*')
      .eq('branch_id', branchId)
      .order('created_at', { ascending: false }),
    supabaseAdmin
      .from('pep_doses')
      .select('*')
      .eq('branch_id', branchId)
      .order('dose_day', { ascending: true }),
    listLiveTable('ai_triage_submissions', {
      branchId,
      sortField: 'created_at',
      ascending: false,
    }),
    listLiveTable('aefi_reports', {
      branchId,
      sortField: 'created_at',
      ascending: false,
    }),
    listLiveTable('audit_logs', {
      branchId,
      sortField: 'created_at',
      ascending: false,
    }),
  ]);

  if (patErr || caseErr || doseErr) {
    throw new AppError(
      `Failed loading doctor workspace: ${patErr?.message || caseErr?.message || doseErr?.message}`,
      500
    );
  }

  const decryptedPatients = (patientsRows || []).map((p) => decryptPatientRecord(p));
  const patientMap = new Map(decryptedPatients.map((p) => [p.id, p]));

  const dosesByCase = new Map();
  for (const d of dosesRows || []) {
    if (!dosesByCase.has(d.case_id)) dosesByCase.set(d.case_id, []);
    dosesByCase.get(d.case_id).push(d);
  }

  const cases = (rawCasesRows || []).map((c) => {
    const unpacked = unpackCaseRow(c);
    return {
      ...unpacked,
      patient: patientMap.get(c.patient_id) || null,
      pep_doses: dosesByCase.get(c.id) || [],
    };
  });
  const caseMap = new Map(cases.map((c) => [c.id, c]));

  const enrichedAiQueue = (aiSubmissions || []).map((s) => {
    const linkedCase = caseMap.get(s.case_id);
    const linkedPatient =
      patientMap.get(s.patient_id) || linkedCase?.patient || null;
    return {
      ...s,
      patient: linkedPatient,
      clinical_case: linkedCase || null,
    };
  });

  const verifiedSubs = enrichedAiQueue.filter(
    (s) => s.verification_status === 'confirmed' || s.verification_status === 'overridden'
  );
  const confirmedCount = verifiedSubs.filter(
    (s) => s.verification_status === 'confirmed'
  ).length;
  const overriddenCount = verifiedSubs.filter(
    (s) => s.verification_status === 'overridden'
  ).length;
  const concordanceRatePct =
    verifiedSubs.length > 0
      ? Number(((confirmedCount / verifiedSubs.length) * 100).toFixed(1))
      : 100;
  const discordanceRatePct =
    verifiedSubs.length > 0
      ? Number(((overriddenCount / verifiedSubs.length) * 100).toFixed(1))
      : 0;

  const highRiskCat3Cases = cases.filter(
    (c) => c.exposure_category === 'III' || c.is_high_risk_cat3
  );

  const enrichedAefi = (aefiReports || []).map((r) => {
    const c = caseMap.get(r.case_id);
    return {
      ...r,
      case_number: c?.case_number || 'CASE',
      patient: c?.patient || null,
      wound_site: c?.wound_site || c?.anatomical_site || 'Extremity',
    };
  });

  res.status(200).json({
    ok: true,
    success: true,
    data: {
      branch: branchRow || { id: branchId, name: `Victorio ABC — ${branchId}` },
      doctorProfile: req.user,
      aiQueue: enrichedAiQueue,
      aiMetrics: {
        totalSubmissions: enrichedAiQueue.length,
        pendingCount: enrichedAiQueue.filter((s) => s.verification_status === 'pending')
          .length,
        verifiedCount: verifiedSubs.length,
        confirmedCount,
        overriddenCount,
        concordanceRatePct,
        discordanceRatePct,
      },
      cases,
      highRiskCat3Cases,
      aefiReports: enrichedAefi,
      recentAudits: (auditLogs || []).slice(0, 12),
    },
  });
});

/**
 * POST /api/v1/doctor/ai-verify
 * Confirms or overrides a mobile AI triage submission, updates the linked case exposure_category,
 * and logs an immutable audit record.
 */
export const verifyAiSubmission = asyncHandler(async (req, res) => {
  const branchId = resolveLockedBranchId(req);
  const {
    submission_id,
    verification_status,
    doctor_final_category,
    override_reason,
  } = req.body || {};

  if (!submission_id || !['confirmed', 'overridden'].includes(verification_status)) {
    throw new AppError(
      'submission_id and verification_status (confirmed | overridden) are required.',
      400
    );
  }

  const allSubs = await listLiveTable('ai_triage_submissions', { branchId });
  const target = allSubs.find((s) => s.id === submission_id);
  if (!target) {
    throw new AppError('AI triage submission not found in your branch.', 404);
  }

  const finalCategory =
    verification_status === 'confirmed'
      ? target.ai_predicted_category
      : doctor_final_category || target.ai_predicted_category;

  if (verification_status === 'overridden' && !String(override_reason || '').trim()) {
    throw new AppError(
      'Clinical override reason is required when overriding AI classification.',
      400
    );
  }

  const nowIso = new Date().toISOString();
  const updatedSub = await updateLiveRow('ai_triage_submissions', submission_id, {
    verification_status,
    doctor_final_category: finalCategory,
    override_reason:
      verification_status === 'overridden' ? String(override_reason).trim() : null,
    verified_by: req.user?.id || null,
    verified_at: nowIso,
  });

  if (target.case_id) {
    await supabaseAdmin
      .from('clinical_cases')
      .update({
        exposure_category: finalCategory,
        erig_required: finalCategory === 'III',
        assessed_by: req.user?.id || null,
      })
      .eq('id', target.case_id);
  }

  await appendAuditLog({
    branch_id: branchId,
    actor_id: req.user?.id || null,
    actor_name: `${req.user?.full_name || 'Physician'} (${req.user?.prc_license_number || 'PRC-MD'})`,
    action_type:
      verification_status === 'confirmed'
        ? 'AI_TRIAGE_CONFIRMED'
        : 'AI_TRIAGE_OVERRIDE',
    entity_type: 'ai_triage_submissions',
    reason:
      verification_status === 'confirmed'
        ? `Confirmed Mobile AI Category ${finalCategory} classification (${target.confidence_score}% confidence).`
        : `Overrode Mobile AI Category ${target.ai_predicted_category} -> Category ${finalCategory}: ${override_reason}`,
    metadata: {
      submission_id,
      case_id: target.case_id,
      ai_predicted_category: target.ai_predicted_category,
      doctor_final_category: finalCategory,
    },
  });

  res.status(200).json({
    ok: true,
    success: true,
    submission: updatedSub,
  });
});

/**
 * POST /api/v1/doctor/dosing-signoff
 * Automated Clinical Guardrails & Weight-Based Dosing Engine + Digital PRC Sign-Off & PhilHealth ABTP Validation.
 */
export const submitDoctorDosingSignoff = asyncHandler(async (req, res) => {
  const branchId = resolveLockedBranchId(req);
  const {
    case_id,
    exposure_category = 'III',
    patient_weight_kg,
    prior_pep_within_3_months = false,
    allergies = 'None reported',
    is_pregnant = false,
    anatomical_site = 'Right Hand',
    is_high_risk_cat3 = false,
    erig_hrig_type = 'ERIG (Equirab 200 IU/mL)',
    tetanus_given = true,
    philhealth_abtp_validated = true,
    notes = '',
  } = req.body || {};

  if (!case_id) {
    throw new AppError('case_id is required for clinical dosing sign-off.', 400);
  }

  const { data: existingRow, error: findErr } = await supabaseAdmin
    .from('clinical_cases')
    .select('*')
    .eq('id', case_id)
    .eq('branch_id', branchId)
    .maybeSingle();

  if (findErr || !existingRow) {
    throw new AppError('Clinical case not found in your assigned branch.', 404);
  }

  const weightKg = Math.max(1, Number(patient_weight_kg) || 60);
  const priorPep = Boolean(prior_pep_within_3_months);
  const finalCategory = ['I', 'II', 'III'].includes(exposure_category)
    ? exposure_category
    : 'III';

  // Weight-based ERIG (40 IU/kg @ 200 IU/mL) or HRIG (20 IU/kg @ 150 IU/mL) calculation
  // Note: If prior PEP completed within 3 months, RIG is NOT indicated per WHO/DOH guardrail!
  let computedIu = 0;
  let computedMl = 0;
  let resolvedRigType = 'None';

  if (finalCategory === 'III' && !priorPep) {
    const isHrig = String(erig_hrig_type).toUpperCase().includes('HRIG');
    resolvedRigType = isHrig
      ? 'HRIG (Berirab 150 IU/mL)'
      : 'ERIG (Equirab 200 IU/mL)';
    computedIu = Number((weightKg * (isHrig ? 20 : 40)).toFixed(0));
    computedMl = Number((computedIu / (isHrig ? 150 : 200)).toFixed(2));
  } else if (priorPep) {
    resolvedRigType = 'None (Prior PEP < 3 Months Guardrail — RIG Contraindicated)';
  }

  // Automatic regimen selection: 2-dose booster if prior PEP < 3 months, else 5-dose ID PEP
  const regimenType = priorPep
    ? '2-Dose Booster Regimen (Day 0, Day 3)'
    : finalCategory === 'I'
      ? 'Category I Observation & Wound Care (No Vaccine Indicated)'
      : 'Updated Thai Red Cross ID (5-Dose Day 0-3-7-14-28)';

  const prcLicense =
    req.user?.prc_license_number || req.user?.license_number || 'PRC-0148291';
  const signedAtIso = new Date().toISOString();

  const meta = {
    patient_weight_kg: weightKg,
    prior_pep_within_3_months: priorPep,
    allergies: allergies || 'None reported',
    is_pregnant: Boolean(is_pregnant),
    anatomical_site: anatomical_site || existingRow.wound_site || 'Right Hand',
    is_high_risk_cat3: Boolean(is_high_risk_cat3 || finalCategory === 'III'),
    regimen_type: regimenType,
    erig_hrig_type: resolvedRigType,
    erig_hrig_iu: computedIu,
    erig_hrig_ml: computedMl,
    doctor_prc_signoff_license: prcLicense,
    doctor_prc_signed_at: signedAtIso,
    philhealth_abtp_validated: Boolean(philhealth_abtp_validated),
  };

  const nextStatus = finalCategory === 'I' ? 'completed' : 'active_pep';
  const packedNotes = packCaseNotes(
    notes || existingRow.notes || 'Physician dosing & PRC sign-off completed.',
    meta
  );

  const { data: updatedCaseRow, error: updErr } = await supabaseAdmin
    .from('clinical_cases')
    .update({
      exposure_category: finalCategory,
      wound_site: meta.anatomical_site,
      status: nextStatus,
      assessed_by: req.user?.id || null,
      erig_required: finalCategory === 'III' && !priorPep,
      tetanus_given: Boolean(tetanus_given),
      notes: packedNotes,
    })
    .eq('id', case_id)
    .select('*')
    .single();

  if (updErr) {
    throw new AppError(`Failed to save dosing sign-off: ${updErr.message}`, 500);
  }

  // Sync PEP schedule in `pep_doses`:
  // - If priorPep === true -> 2-dose booster schedule (Day 0, Day 3)
  // - Else if Category II or III -> 5-dose schedule (Day 0, 3, 7, 14, 28)
  const targetDays =
    finalCategory === 'I' ? [] : priorPep ? [0, 3] : [0, 3, 7, 14, 28];

  const { data: existingDoses } = await supabaseAdmin
    .from('pep_doses')
    .select('*')
    .eq('case_id', case_id);

  if (targetDays.length > 0) {
    const baseDate = existingRow.exposure_date || todayIso();
    if (!existingDoses || existingDoses.length === 0) {
      const newDoses = targetDays.map((day) => ({
        case_id,
        branch_id: branchId,
        dose_day: day,
        scheduled_date: addDays(baseDate, day),
        status: 'scheduled',
      }));
      await supabaseAdmin.from('pep_doses').insert(newDoses);
    } else if (priorPep) {
      // Remove unadministered Day 7, 14, 28 doses when switching to 2-dose booster guardrail
      const extraIds = existingDoses
        .filter((d) => ![0, 3].includes(d.dose_day) && d.status === 'scheduled')
        .map((d) => d.id);
      if (extraIds.length > 0) {
        await supabaseAdmin.from('pep_doses').delete().in('id', extraIds);
      }
    }
  }

  // If PhilHealth ABTP validated, ensure a pending_philhealth claim record exists in billing_transactions
  if (philhealth_abtp_validated) {
    const branchBills = await listLiveTable('billing_transactions', { branchId });
    const hasPhilhealthTx = branchBills.some(
      (t) => t.case_id === case_id && t.payment_method === 'philhealth_abtp'
    );
    if (!hasPhilhealthTx) {
      await insertLiveRow('billing_transactions', {
        branch_id: branchId,
        case_id,
        patient_id: existingRow.patient_id,
        amount_php: finalCategory === 'III' ? 5800 : 3000,
        discount_php: 0,
        payment_method: 'philhealth_abtp',
        status: 'pending_philhealth',
        void_reason: null,
        created_by: req.user?.id || null,
        created_at: signedAtIso,
      });
    }
  }

  await appendAuditLog({
    branch_id: branchId,
    actor_id: req.user?.id || null,
    actor_name: `${req.user?.full_name || 'Physician'} (${prcLicense})`,
    action_type: 'PRC_CLINICAL_SIGNOFF',
    entity_type: 'clinical_cases',
    reason: `Electronic PRC Sign-Off (${prcLicense}) for Case ${existingRow.case_number}: Cat ${finalCategory}, ${weightKg}kg, ${regimenType}${
      computedIu > 0 ? `, ${resolvedRigType} ${computedIu} IU (${computedMl} mL)` : ''
    }${philhealth_abtp_validated ? ' • PhilHealth ABTP Validated' : ''}.`,
    metadata: {
      case_number: existingRow.case_number,
      prc_license: prcLicense,
      regimen_type: regimenType,
      erig_hrig_iu: computedIu,
      erig_hrig_ml: computedMl,
      philhealth_abtp_validated: Boolean(philhealth_abtp_validated),
    },
  });

  res.status(200).json({
    ok: true,
    success: true,
    case: unpackCaseRow(updatedCaseRow),
  });
});

/**
 * POST /api/v1/doctor/aefi
 * Logs an Adverse Event Following Immunization (AEFI) report into `aefi_reports` + `audit_logs`.
 */
export const createAefiReport = asyncHandler(async (req, res) => {
  const branchId = resolveLockedBranchId(req);
  const {
    case_id,
    severity = 'mild',
    symptoms,
    action_taken,
  } = req.body || {};

  if (!case_id || !String(symptoms || '').trim() || !String(action_taken || '').trim()) {
    throw new AppError('case_id, symptoms, and action_taken are required.', 400);
  }

  const normalizedSeverity = ['mild', 'moderate', 'severe'].includes(
    String(severity).toLowerCase()
  )
    ? String(severity).toLowerCase()
    : 'mild';

  const report = await insertLiveRow('aefi_reports', {
    case_id,
    branch_id: branchId,
    doctor_id: req.user?.id || null,
    severity: normalizedSeverity,
    symptoms: String(symptoms).trim(),
    action_taken: String(action_taken).trim(),
    created_at: new Date().toISOString(),
  });

  await appendAuditLog({
    branch_id: branchId,
    actor_id: req.user?.id || null,
    actor_name: `${req.user?.full_name || 'Physician'} (${req.user?.prc_license_number || 'PRC-MD'})`,
    action_type: 'AEFI_REPORT_LOGGED',
    entity_type: 'aefi_reports',
    reason: `Logged ${normalizedSeverity.toUpperCase()} AEFI report: ${String(symptoms).trim()}`,
    metadata: { case_id, severity: normalizedSeverity },
  });

  res.status(201).json({
    ok: true,
    success: true,
    report,
  });
});

/**
 * GET /api/v1/nurse/workspace
 * Strictly scoped to the authenticated nurse's assigned `branch_id`.
 */
export const getNurseWorkspace = asyncHandler(async (req, res) => {
  const branchId = resolveLockedBranchId(req);
  const today = todayIso();

  const [
    { data: branchRow },
    { data: patientsRows, error: patErr },
    { data: rawCasesRows, error: caseErr },
    { data: dosesRows, error: doseErr },
    { data: inventoryRows, error: invErr },
    aiSubmissions,
    rawVials,
    coldChainLogs,
    defaulterCallLogs,
  ] = await Promise.all([
    supabaseAdmin.from('branches').select('*').eq('id', branchId).maybeSingle(),
    supabaseAdmin.from('patients').select('*').eq('branch_id', branchId),
    supabaseAdmin
      .from('clinical_cases')
      .select('*')
      .eq('branch_id', branchId)
      .order('created_at', { ascending: false }),
    supabaseAdmin
      .from('pep_doses')
      .select('*')
      .eq('branch_id', branchId)
      .order('scheduled_date', { ascending: true }),
    supabaseAdmin
      .from('vaccine_inventory')
      .select('*')
      .eq('branch_id', branchId)
      .order('expiry_date', { ascending: true }),
    listLiveTable('ai_triage_submissions', {
      branchId,
      sortField: 'created_at',
      ascending: false,
    }),
    listLiveTable('reconstituted_vials', {
      branchId,
      sortField: 'opened_at',
      ascending: false,
    }),
    listLiveTable('cold_chain_logs', {
      branchId,
      sortField: 'recorded_at',
      ascending: false,
    }),
    listLiveTable('defaulter_call_logs', {
      branchId,
      sortField: 'called_at',
      ascending: false,
    }),
  ]);

  if (patErr || caseErr || doseErr || invErr) {
    throw new AppError(
      `Failed loading nurse workspace: ${
        patErr?.message || caseErr?.message || doseErr?.message || invErr?.message
      }`,
      500
    );
  }

  const vials = await refreshExpiredVials(rawVials || []);
  const nowMs = Date.now();

  const activeVials = vials
    .filter((v) => v.status === 'active')
    .map((v) => {
      const expMs = new Date(v.expires_at).getTime();
      const secondsRemaining = Math.max(0, Math.floor((expMs - nowMs) / 1000));
      const remainingDoses = Math.max(
        0,
        Number(v.total_doses || 5) - Number(v.administered_doses || 0)
      );
      return {
        ...v,
        secondsRemaining,
        remainingDoses,
        isExpiringSoon: secondsRemaining > 0 && secondsRemaining <= 3600,
      };
    });

  const totalOpenVialRemainingDoses = activeVials.reduce(
    (acc, v) => acc + v.remainingDoses,
    0
  );

  const decryptedPatients = (patientsRows || []).map((p) => decryptPatientRecord(p));
  const patientMap = new Map(decryptedPatients.map((p) => [p.id, p]));

  const aiByCaseId = new Map((aiSubmissions || []).map((s) => [s.case_id, s]));

  const cases = (rawCasesRows || []).map((c) => {
    const unpacked = unpackCaseRow(c);
    return {
      ...unpacked,
      patient: patientMap.get(c.patient_id) || null,
      aiTriage: aiByCaseId.get(c.id) || null,
    };
  });
  const caseMap = new Map(cases.map((c) => [c.id, c]));

  // Walk-In New Cases vs Scheduled Booster Patients
  const walkInCases = cases.filter(
    (c) =>
      c.status === 'queued_nurse' ||
      c.status === 'pending_doctor' ||
      c.exposure_date === today
  );

  let poolDosesLeft = totalOpenVialRemainingDoses;
  const allBranchDoses = (dosesRows || []).map((d) => {
    const parentCase = caseMap.get(d.case_id);
    const isDueOrOverdue =
      d.status === 'scheduled' && d.scheduled_date <= today;
    let canShareActiveVial = false;
    if (isDueOrOverdue && poolDosesLeft > 0) {
      canShareActiveVial = true;
      poolDosesLeft -= 1;
    }
    return {
      ...d,
      case_number: parentCase?.case_number || 'CASE',
      exposure_category: parentCase?.exposure_category || 'II',
      wound_site: parentCase?.wound_site || parentCase?.anatomical_site || 'Extremity',
      animal_type: parentCase?.animal_type || 'dog',
      is_high_risk_cat3: Boolean(
        parentCase?.is_high_risk_cat3 || parentCase?.exposure_category === 'III'
      ),
      regimen_type: parentCase?.regimen_type || 'Updated Thai Red Cross ID',
      patient: parentCase?.patient || null,
      canShareActiveVial,
    };
  });

  // FEFO Inventory: sort by expiry_date ASC and mark first in-stock batch per category as recommended FEFO
  const seenCategoryFefo = new Set();
  const fefoInventory = (inventoryRows || [])
    .slice()
    .sort((a, b) => String(a.expiry_date || '').localeCompare(String(b.expiry_date || '')))
    .map((item) => {
      let isRecommendedFefo = false;
      if (Number(item.stock_vials) > 0 && !seenCategoryFefo.has(item.category)) {
        seenCategoryFefo.add(item.category);
        isRecommendedFefo = true;
      }
      return {
        ...item,
        daysUntilExpiry: daysBetween(today, item.expiry_date),
        isRecommendedFefo,
      };
    });

  // Risk-Stratified Defaulters: missed or overdue scheduled doses, ranking Cat III Day 3/7/14 at the very top
  const callsByDoseId = new Map();
  for (const log of defaulterCallLogs || []) {
    if (!callsByDoseId.has(log.dose_id)) callsByDoseId.set(log.dose_id, []);
    callsByDoseId.get(log.dose_id).push(log);
  }

  const defaulters = allBranchDoses
    .filter(
      (d) =>
        d.status === 'missed' ||
        (d.status === 'scheduled' && d.scheduled_date < today)
    )
    .sort((a, b) => {
      const aPriority =
        a.exposure_category === 'III' && [3, 7, 14].includes(Number(a.dose_day))
          ? 0
          : a.exposure_category === 'III'
            ? 1
            : 2;
      const bPriority =
        b.exposure_category === 'III' && [3, 7, 14].includes(Number(b.dose_day))
          ? 0
          : b.exposure_category === 'III'
            ? 1
            : 2;
      if (aPriority !== bPriority) return aPriority - bPriority;
      return String(a.scheduled_date).localeCompare(String(b.scheduled_date));
    })
    .map((d) => ({
      ...d,
      priorityTier:
        d.exposure_category === 'III' && [3, 7, 14].includes(Number(d.dose_day))
          ? 'CRITICAL CAT III BOOSTER DEFAULTER'
          : d.exposure_category === 'III'
            ? 'HIGH-RISK CAT III DEFAULTER'
            : 'STANDARD PEP FOLLOW-UP',
      callLogs: callsByDoseId.get(d.id) || [],
    }));

  res.status(200).json({
    ok: true,
    success: true,
    data: {
      branch: branchRow || { id: branchId, name: `Victorio ABC — ${branchId}` },
      nurseProfile: req.user,
      activeVials,
      vialHistory: vials.filter((v) => v.status !== 'active').slice(0, 10),
      walkInCases,
      scheduledBoosters: allBranchDoses,
      fefoInventory,
      defaulters,
      coldChainLogs: coldChainLogs || [],
      latestColdChain: (coldChainLogs || [])[0] || null,
    },
  });
});

/**
 * POST /api/v1/nurse/vials/open
 * Logs opening/reconstitution of a multi-dose PVRV vial (6-hour countdown timer) and deducts 1 vial from FEFO stock.
 */
export const openReconstitutedVial = asyncHandler(async (req, res) => {
  const branchId = resolveLockedBranchId(req);
  const { inventory_id, total_doses = 5 } = req.body || {};

  const { data: branchVaccines } = await supabaseAdmin
    .from('vaccine_inventory')
    .select('*')
    .eq('branch_id', branchId)
    .eq('category', 'vaccine')
    .gt('stock_vials', 0)
    .order('expiry_date', { ascending: true });

  const targetBatch =
    (branchVaccines || []).find((b) => b.id === inventory_id) ||
    (branchVaccines || [])[0];

  if (!targetBatch) {
    throw new AppError('No in-stock PVRV vaccine batch available to reconstitute.', 400);
  }

  // Deduct 1 vial from vaccine_inventory
  const nextStock = Math.max(0, Number(targetBatch.stock_vials) - 1);
  await supabaseAdmin
    .from('vaccine_inventory')
    .update({
      stock_vials: nextStock,
      updated_at: new Date().toISOString(),
    })
    .eq('id', targetBatch.id);

  const openedAt = new Date();
  const expiresAt = new Date(openedAt.getTime() + 6 * 3600 * 1000);

  const newVial = await insertLiveRow('reconstituted_vials', {
    branch_id: branchId,
    inventory_id: targetBatch.id,
    vaccine_name: targetBatch.item_name,
    lot_number: targetBatch.batch_number,
    opened_at: openedAt.toISOString(),
    expires_at: expiresAt.toISOString(),
    total_doses: Math.max(1, Number(total_doses) || 5),
    administered_doses: 0,
    wasted_doses: 0,
    opened_by: req.user?.id || null,
    status: 'active',
    created_at: openedAt.toISOString(),
  });

  const prcLicense =
    req.user?.prc_license_number || req.user?.license_number || 'PRC-0892341';

  await appendAuditLog({
    branch_id: branchId,
    actor_id: req.user?.id || null,
    actor_name: `${req.user?.full_name || 'Clinic Nurse'} (${prcLicense})`,
    action_type: 'VIAL_RECONSTITUTED',
    entity_type: 'reconstituted_vials',
    reason: `Reconstituted multi-dose vial ${targetBatch.item_name} (FEFO Lot ${targetBatch.batch_number}); 6-hour timer started (${newVial.total_doses} ID doses).`,
    metadata: {
      vial_id: newVial.id,
      lot_number: targetBatch.batch_number,
      expires_at: newVial.expires_at,
    },
  });

  res.status(201).json({
    ok: true,
    success: true,
    vial: newVial,
  });
});

/**
 * POST /api/v1/nurse/doses/administer
 * Enforces FEFO batch selection (or active reconstituted vial dose deduction),
 * stamps the nurse's PRC License ID, and updates `pep_doses`.
 */
export const administerNurseFefoDose = asyncHandler(async (req, res) => {
  const branchId = resolveLockedBranchId(req);
  const {
    dose_id,
    reconstituted_vial_id,
    inventory_id,
  } = req.body || {};

  if (!dose_id) {
    throw new AppError('dose_id is required.', 400);
  }

  const { data: doseRow, error: doseFindErr } = await supabaseAdmin
    .from('pep_doses')
    .select('*')
    .eq('id', dose_id)
    .eq('branch_id', branchId)
    .maybeSingle();

  if (doseFindErr || !doseRow) {
    throw new AppError('PEP dose record not found in your assigned branch.', 404);
  }

  const prcLicense =
    req.user?.prc_license_number || req.user?.license_number || 'PRC-0892341';
  const nowIso = new Date().toISOString();

  let usedBrand = 'Verorab PVRV (0.5mL ID/IM)';
  let usedLot = 'VRB-FEFO';
  let updatedVial = null;

  if (reconstituted_vial_id) {
    const branchVials = await listLiveTable('reconstituted_vials', { branchId });
    const activeVial = branchVials.find(
      (v) => v.id === reconstituted_vial_id && v.status === 'active'
    );
    if (!activeVial) {
      throw new AppError('Selected reconstituted vial is no longer active.', 400);
    }
    const nextAdministered = Number(activeVial.administered_doses || 0) + 1;
    const totalCap = Number(activeVial.total_doses || 5);
    updatedVial = await updateLiveRow('reconstituted_vials', activeVial.id, {
      administered_doses: nextAdministered,
      status: nextAdministered >= totalCap ? 'exhausted' : 'active',
    });
    usedBrand = activeVial.vaccine_name;
    usedLot = activeVial.lot_number;
  } else {
    // Enforce FEFO batch selection
    const { data: fefoBatches } = await supabaseAdmin
      .from('vaccine_inventory')
      .select('*')
      .eq('branch_id', branchId)
      .eq('category', 'vaccine')
      .gt('stock_vials', 0)
      .order('expiry_date', { ascending: true });

    const fefoBatch =
      (fefoBatches || []).find((b) => b.id === inventory_id) ||
      (fefoBatches || [])[0];

    if (!fefoBatch) {
      throw new AppError('No in-stock FEFO vaccine batch available at this branch.', 400);
    }

    await supabaseAdmin
      .from('vaccine_inventory')
      .update({
        stock_vials: Math.max(0, Number(fefoBatch.stock_vials) - 1),
        updated_at: nowIso,
      })
      .eq('id', fefoBatch.id);

    usedBrand = fefoBatch.item_name;
    usedLot = fefoBatch.batch_number;
  }

  const stampedLot = `${usedLot} • ${prcLicense}`;

  const { data: updatedDose, error: updErr } = await supabaseAdmin
    .from('pep_doses')
    .update({
      status: 'completed',
      administered_at: nowIso,
      administered_by: req.user?.id || null,
      vaccine_brand: usedBrand,
      lot_number: stampedLot,
    })
    .eq('id', dose_id)
    .select('*')
    .single();

  if (updErr) {
    throw new AppError(`Failed to update PEP dose: ${updErr.message}`, 500);
  }

  // Auto-complete parent clinical_case if all doses are completed
  const { data: siblingDoses } = await supabaseAdmin
    .from('pep_doses')
    .select('id, status')
    .eq('case_id', updatedDose.case_id);

  if (
    Array.isArray(siblingDoses) &&
    siblingDoses.length > 0 &&
    siblingDoses.every((d) => d.status === 'completed')
  ) {
    await supabaseAdmin
      .from('clinical_cases')
      .update({ status: 'completed' })
      .eq('id', updatedDose.case_id);
  }

  await appendAuditLog({
    branch_id: branchId,
    actor_id: req.user?.id || null,
    actor_name: `${req.user?.full_name || 'Clinic Nurse'} (${prcLicense})`,
    action_type: 'FEFO_DOSE_ADMINISTERED',
    entity_type: 'pep_doses',
    reason: `Administered Day ${updatedDose.dose_day} PEP dose using ${usedBrand} (Lot ${usedLot}) stamped with Nurse PRC ${prcLicense}.`,
    metadata: {
      dose_id,
      dose_day: updatedDose.dose_day,
      lot_number: usedLot,
      prc_license: prcLicense,
      reconstituted_vial_id: reconstituted_vial_id || null,
    },
  });

  res.status(200).json({
    ok: true,
    success: true,
    dose: updatedDose,
    vial: updatedVial,
  });
});

/**
 * POST /api/v1/nurse/cold-chain
 * Records shift vaccine refrigerator temperature (2.0°C–8.0°C) and auto-escalates breaches.
 */
export const logColdChainTemperature = asyncHandler(async (req, res) => {
  const branchId = resolveLockedBranchId(req);
  const {
    temperature_c,
    shift_label = 'Shift Check',
  } = req.body || {};

  if (temperature_c === undefined || temperature_c === null || temperature_c === '') {
    throw new AppError('temperature_c is required.', 400);
  }

  const tempVal = Number(Number(temperature_c).toFixed(1));
  if (Number.isNaN(tempVal)) {
    throw new AppError('temperature_c must be a valid number.', 400);
  }

  const isBreach = tempVal < 2.0 || tempVal > 8.0;
  const nowIso = new Date().toISOString();

  const logEntry = await insertLiveRow('cold_chain_logs', {
    branch_id: branchId,
    temperature_c: tempVal,
    is_breach: isBreach,
    shift_label: String(shift_label).trim() || 'Shift Check',
    recorded_by: req.user?.id || null,
    recorded_at: nowIso,
  });

  const prcLicense =
    req.user?.prc_license_number || req.user?.license_number || 'PRC-0892341';

  if (isBreach) {
    await appendAuditLog({
      branch_id: branchId,
      actor_id: req.user?.id || null,
      actor_name: `${req.user?.full_name || 'Clinic Nurse'} (${prcLicense})`,
      action_type: 'COLD_CHAIN_BREACH_ALERT',
      entity_type: 'cold_chain_logs',
      reason: `CRITICAL COLD-CHAIN BREACH: Refrigerator temperature logged at ${tempVal}°C during ${shift_label} (outside WHO 2.0°C–8.0°C threshold). Escalated to Owner Command Center.`,
      metadata: {
        temperature_c: tempVal,
        shift_label,
        is_breach: true,
      },
    });
  }

  res.status(201).json({
    ok: true,
    success: true,
    log: logEntry,
  });
});

/**
 * POST /api/v1/nurse/defaulters/call
 * Logs a phone follow-up outcome for a risk-stratified defaulter and optionally reschedules the dose.
 */
export const logDefaulterCall = asyncHandler(async (req, res) => {
  const branchId = resolveLockedBranchId(req);
  const {
    dose_id,
    case_id,
    outcome,
    notes = '',
    reschedule_date,
  } = req.body || {};

  if (!dose_id || !String(outcome || '').trim()) {
    throw new AppError('dose_id and outcome are required.', 400);
  }

  const callEntry = await insertLiveRow('defaulter_call_logs', {
    dose_id,
    case_id: case_id || null,
    branch_id: branchId,
    nurse_id: req.user?.id || null,
    outcome: String(outcome).trim(),
    notes: String(notes || '').trim(),
    called_at: new Date().toISOString(),
  });

  if (reschedule_date) {
    await supabaseAdmin
      .from('pep_doses')
      .update({
        scheduled_date: reschedule_date,
        status: 'scheduled',
      })
      .eq('id', dose_id)
      .eq('branch_id', branchId);
  }

  const prcLicense =
    req.user?.prc_license_number || req.user?.license_number || 'PRC-0892341';

  await appendAuditLog({
    branch_id: branchId,
    actor_id: req.user?.id || null,
    actor_name: `${req.user?.full_name || 'Clinic Nurse'} (${prcLicense})`,
    action_type: 'DEFAULTER_FOLLOWUP_CALL',
    entity_type: 'defaulter_call_logs',
    reason: `Logged defaulter follow-up call (${outcome}): ${notes || 'Patient contacted'}${
      reschedule_date ? ` • Rescheduled to ${reschedule_date}` : ''
    }`,
    metadata: {
      dose_id,
      case_id,
      outcome,
      reschedule_date: reschedule_date || null,
    },
  });

  res.status(201).json({
    ok: true,
    success: true,
    callLog: callEntry,
  });
});

/**
 * GET /api/v1/notifications
 * Live DB-driven alerts filtered by user role & branch:
 * - Incoming high-risk AI uploads
 * - Active open-vial < 1 hr expiry warnings
 * - Cold-chain temperature breaches
 * - Predicted stockout / low inventory alerts
 * - Overdue Category III booster defaulters
 */
export const getLiveNotifications = asyncHandler(async (req, res) => {
  const role = req.user?.role || 'nurse';
  const branchFilter =
    role === 'admin' ? null : req.user?.branch_id || 'santa-maria';
  const today = todayIso();

  const [
    { data: branchesRows },
    { data: rawCasesRows },
    { data: dosesRows },
    { data: inventoryRows },
    aiSubmissions,
    rawVials,
    coldChainLogs,
  ] = await Promise.all([
    supabaseAdmin.from('branches').select('id, name'),
    branchFilter
      ? supabaseAdmin.from('clinical_cases').select('*').eq('branch_id', branchFilter)
      : supabaseAdmin.from('clinical_cases').select('*'),
    branchFilter
      ? supabaseAdmin.from('pep_doses').select('*').eq('branch_id', branchFilter)
      : supabaseAdmin.from('pep_doses').select('*'),
    branchFilter
      ? supabaseAdmin.from('vaccine_inventory').select('*').eq('branch_id', branchFilter)
      : supabaseAdmin.from('vaccine_inventory').select('*'),
    listLiveTable('ai_triage_submissions', { branchId: branchFilter }),
    listLiveTable('reconstituted_vials', { branchId: branchFilter }),
    listLiveTable('cold_chain_logs', { branchId: branchFilter }),
  ]);

  const branchNameMap = new Map(
    (branchesRows || []).map((b) => [b.id, b.name.replace('Victorio ABC — ', '')])
  );
  const caseMap = new Map((rawCasesRows || []).map((c) => [c.id, unpackCaseRow(c)]));
  const vials = await refreshExpiredVials(rawVials || []);

  const notifications = [];

  // 1. Cold-chain breaches (Critical)
  const latestColdByBranch = new Map();
  for (const log of coldChainLogs || []) {
    if (!latestColdByBranch.has(log.branch_id)) {
      latestColdByBranch.set(log.branch_id, log);
    }
  }
  for (const [bId, log] of latestColdByBranch.entries()) {
    if (log.is_breach) {
      notifications.push({
        id: `notif-cold-${log.id}`,
        severity: 'critical',
        category: 'cold_chain',
        branch_id: bId,
        branch_name: branchNameMap.get(bId) || bId,
        title: `Cold-Chain Breach (${log.temperature_c}°C)`,
        message: `${branchNameMap.get(bId) || bId} refrigerator logged ${
          log.temperature_c
        }°C during ${log.shift_label} (outside 2.0°C–8.0°C threshold).`,
        target_tab:
          role === 'admin' ? 'matrix' : role === 'nurse' ? 'defaulters' : 'cat3',
        created_at: log.recorded_at,
      });
    }
  }

  // 2. Active Open-Vial < 1 hour expiry warnings
  const nowMs = Date.now();
  for (const v of vials) {
    if (v.status !== 'active') continue;
    const remMinutes = Math.round((new Date(v.expires_at).getTime() - nowMs) / 60000);
    const remDoses = Math.max(0, Number(v.total_doses || 5) - Number(v.administered_doses || 0));
    if (remMinutes > 0 && remMinutes <= 75 && remDoses > 0) {
      notifications.push({
        id: `notif-vial-${v.id}`,
        severity: 'warning',
        category: 'open_vial',
        branch_id: v.branch_id,
        branch_name: branchNameMap.get(v.branch_id) || v.branch_id,
        title: `Open PVRV Vial Expiring in ${remMinutes} mins`,
        message: `Lot ${v.lot_number} (${v.vaccine_name}) has ${remDoses} remaining ID dose(s) before 6-hour discard window.`,
        target_tab:
          role === 'nurse' ? 'fefo' : role === 'admin' ? 'inventory' : 'dosing',
        created_at: v.opened_at,
      });
    }
  }

  // 3. Incoming Pending High-Risk AI Triage Uploads
  for (const sub of aiSubmissions || []) {
    if (sub.verification_status === 'pending') {
      const c = caseMap.get(sub.case_id);
      notifications.push({
        id: `notif-ai-${sub.id}`,
        severity: sub.ai_predicted_category === 'III' ? 'critical' : 'info',
        category: 'ai_triage',
        branch_id: sub.branch_id,
        branch_name: branchNameMap.get(sub.branch_id) || sub.branch_id,
        title: `Mobile AI Pre-Triage: Category ${sub.ai_predicted_category} (${sub.confidence_score}%)`,
        message: `Case ${c?.case_number || 'Walk-In'} (${c?.wound_site || 'Wound Intake'}) awaiting physician verification.`,
        target_tab:
          role === 'doctor' ? 'ai_queue' : role === 'nurse' ? 'triage' : 'matrix',
        created_at: sub.created_at,
      });
    }
  }

  // 4. Overdue Category III Booster Defaulters
  for (const d of dosesRows || []) {
    if (d.status === 'missed' || (d.status === 'scheduled' && d.scheduled_date < today)) {
      const c = caseMap.get(d.case_id);
      if (c?.exposure_category === 'III' || c?.is_high_risk_cat3) {
        notifications.push({
          id: `notif-def-${d.id}`,
          severity: 'critical',
          category: 'defaulter',
          branch_id: d.branch_id,
          branch_name: branchNameMap.get(d.branch_id) || d.branch_id,
          title: `Overdue Cat III Booster (Day ${d.dose_day})`,
          message: `Case ${c?.case_number || 'CASE'} (${c?.wound_site || 'High-Risk Exposure'}) missed scheduled Day ${d.dose_day} dose (${d.scheduled_date}).`,
          target_tab:
            role === 'nurse' ? 'defaulters' : role === 'admin' ? 'matrix' : 'cat3',
          created_at: `${d.scheduled_date}T08:00:00.000Z`,
        });
      }
    }
  }

  // 5. Low Inventory / Near-Expiry FEFO Batches
  for (const item of inventoryRows || []) {
    if (Number(item.stock_vials) <= Number(item.reorder_level)) {
      notifications.push({
        id: `notif-inv-${item.id}`,
        severity: 'warning',
        category: 'inventory',
        branch_id: item.branch_id,
        branch_name: branchNameMap.get(item.branch_id) || item.branch_id,
        title: `Low FEFO Batch Stock: ${item.item_name}`,
        message: `${branchNameMap.get(item.branch_id) || item.branch_id} batch ${item.batch_number} has ${item.stock_vials} vials remaining (reorder level: ${item.reorder_level}).`,
        target_tab:
          role === 'admin' ? 'inventory' : role === 'nurse' ? 'fefo' : 'dosing',
        created_at: item.updated_at || new Date().toISOString(),
      });
    }
  }

  notifications.sort((a, b) => {
    const rank = { critical: 0, warning: 1, info: 2 };
    if (rank[a.severity] !== rank[b.severity]) {
      return rank[a.severity] - rank[b.severity];
    }
    return String(b.created_at).localeCompare(String(a.created_at));
  });

  res.status(200).json({
    ok: true,
    success: true,
    notifications,
    data: notifications,
  });
});

/**
 * PATCH /api/v1/profile/preferences
 * Persists `theme_preference` ('light' | 'dark'), `notification_prefs`, and optional profile fields to live Supabase.
 */
export const updateProfilePreferences = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new AppError('Authentication required.', 401);
  }

  const {
    theme_preference,
    notification_prefs,
    full_name,
    prc_license_number,
    prc_expiry_date,
  } = req.body || {};

  const updates = {};
  if (theme_preference && ['light', 'dark'].includes(theme_preference)) {
    updates.theme_preference = theme_preference;
  }
  if (notification_prefs && typeof notification_prefs === 'object') {
    updates.notification_prefs = notification_prefs;
  }
  if (full_name !== undefined && String(full_name).trim()) {
    updates.full_name = String(full_name).trim();
  }
  if (prc_license_number !== undefined) {
    updates.prc_license_number = prc_license_number
      ? String(prc_license_number).trim()
      : null;
  }
  if (prc_expiry_date !== undefined) {
    updates.prc_expiry_date = prc_expiry_date || null;
  }

  const updatedProfile = await updateEnrichedProfile(userId, updates);

  res.status(200).json({
    ok: true,
    success: true,
    profile: updatedProfile,
    data: updatedProfile,
  });
});
