import crypto from 'node:crypto';
import { supabaseAdmin } from '../../config/supabase.js';
import { AppError, asyncHandler } from '../../middleware/error.middleware.js';
import { encryptPatientRecord, decryptPatientRecord } from '../../../utils/encryption.js';
import { normalizeBranchId } from '../auth/auth.controller.js';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(baseDateStr, offsetDays) {
  const base = baseDateStr || todayIso();
  const [y, m, d] = base.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + offsetDays));
  return dt.toISOString().slice(0, 10);
}

function generateCode(prefix = 'ABC') {
  const year = new Date().getFullYear();
  const rand = crypto.randomInt(1000, 9999);
  return `${prefix}-${year}-${rand}`;
}

function resolveEffectiveBranchId(req, { allowAllForAdmin = false } = {}) {
  const rawQueryBranch = req.query?.branch_id || req.body?.branch_id;
  if (
    allowAllForAdmin &&
    req.user?.role === 'admin' &&
    (!rawQueryBranch || String(rawQueryBranch).toLowerCase() === 'all')
  ) {
    const headerBranch = normalizeBranchId(
      req.headers['x-branch-id'] || req.headers['x-branch-slug']
    );
    if (String(rawQueryBranch).toLowerCase() === 'all') return null;
    return normalizeBranchId(rawQueryBranch) || headerBranch || 'santa-maria';
  }

  if (req.user?.role === 'doctor' || req.user?.role === 'nurse') {
    return req.user.branch_id;
  }

  return (
    normalizeBranchId(rawQueryBranch) ||
    req.branchId ||
    normalizeBranchId(req.headers['x-branch-id'] || req.headers['x-branch-slug']) ||
    'santa-maria'
  );
}

function formatCaseRow(c) {
  if (!c) return null;
  const rawPatient = Array.isArray(c.patients) ? c.patients[0] : c.patients;
  const rawDoses = Array.isArray(c.pep_doses) ? c.pep_doses : [];
  const sortedDoses = [...rawDoses].sort((a, b) => Number(a.dose_day) - Number(b.dose_day));
  return {
    ...c,
    patient: decryptPatientRecord(rawPatient),
    pep_doses: sortedDoses,
  };
}

/**
 * GET /api/v1/health
 */
export const getHealth = asyncHandler(async (_req, res) => {
  const { count, error } = await supabaseAdmin
    .from('branches')
    .select('*', { count: 'exact', head: true });

  if (error) {
    throw new AppError(`Database health check failed: ${error.message}`, 500);
  }

  res.status(200).json({
    ok: true,
    success: true,
    service: 'victorio-abc-backend',
    branchesCount: count ?? 0,
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /api/v1/auth/me
 */
export const getAuthMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    ok: true,
    success: true,
    profile: req.user,
    data: req.user,
  });
});

/**
 * GET /api/v1/dashboard/summary?branch_id=...
 */
export const getDashboardSummary = asyncHandler(async (req, res) => {
  const branchId = resolveEffectiveBranchId(req);
  const today = todayIso();

  const [patientsRes, casesRes, dosesRes, invRes, staffRes] = await Promise.all([
    supabaseAdmin
      .from('patients')
      .select('id', { count: 'exact', head: true })
      .eq('branch_id', branchId),
    supabaseAdmin
      .from('clinical_cases')
      .select('id, status, exposure_category')
      .eq('branch_id', branchId),
    supabaseAdmin
      .from('pep_doses')
      .select('id, scheduled_date, status')
      .eq('branch_id', branchId),
    supabaseAdmin
      .from('vaccine_inventory')
      .select('id, stock_vials, reorder_level')
      .eq('branch_id', branchId),
    supabaseAdmin
      .from('profiles')
      .select('id, role, branch_id, is_active')
      .in('role', ['admin', 'doctor', 'nurse']),
  ]);

  const casesList = casesRes.data || [];
  const dosesList = dosesRes.data || [];
  const invList = invRes.data || [];
  const staffList = (staffRes.data || []).filter(
    (s) => s.is_active !== false && (s.branch_id === branchId || s.role === 'admin')
  );

  const summary = {
    branch_id: branchId,
    totalPatients: patientsRes.count ?? 0,
    totalCases: casesList.length,
    activeCases: casesList.filter((c) => c.status === 'active_pep').length,
    nurseQueue: casesList.filter((c) => c.status === 'queued_nurse').length,
    doctorQueue: casesList.filter((c) => c.status === 'pending_doctor').length,
    completedCases: casesList.filter((c) => c.status === 'completed').length,
    todayDueDoses: dosesList.filter(
      (d) => d.scheduled_date === today && d.status === 'scheduled'
    ).length,
    todayCompletedDoses: dosesList.filter(
      (d) => d.scheduled_date === today && d.status === 'completed'
    ).length,
    missedDoses: dosesList.filter(
      (d) =>
        d.status === 'missed' ||
        (d.scheduled_date < today && d.status === 'scheduled')
    ).length,
    lowStockCount: invList.filter(
      (i) => Number(i.stock_vials) <= Number(i.reorder_level)
    ).length,
    activeStaffCount: staffList.length,
  };

  res.status(200).json({
    ok: true,
    success: true,
    summary,
    data: summary,
  });
});

/**
 * GET /api/v1/patients?branch_id=...&search=...
 */
export const listPatients = asyncHandler(async (req, res) => {
  const branchId = resolveEffectiveBranchId(req);
  const search = String(req.query?.search || '').trim().toLowerCase();

  const { data, error } = await supabaseAdmin
    .from('patients')
    .select(
      '*, clinical_cases(id, case_number, animal_type, exposure_category, wound_site, exposure_date, status, created_at)'
    )
    .eq('branch_id', branchId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new AppError(`Failed to load patients: ${error.message}`, 500);
  }

  let decrypted = (data || []).map((row) => {
    const p = decryptPatientRecord(row);
    const cases = Array.isArray(row.clinical_cases) ? row.clinical_cases : [];
    return {
      ...p,
      cases,
      cases_count: cases.length,
    };
  });

  if (search) {
    decrypted = decrypted.filter(
      (p) =>
        (p.full_name || '').toLowerCase().includes(search) ||
        (p.patient_code || '').toLowerCase().includes(search) ||
        (p.phone || '').toLowerCase().includes(search) ||
        (p.address || '').toLowerCase().includes(search)
    );
  }

  res.status(200).json({
    ok: true,
    success: true,
    patients: decrypted,
    data: decrypted,
  });
});

/**
 * POST /api/v1/patients
 * Creates an AES-256-GCM encrypted `patients` row + optional walk-in `clinical_cases` row.
 */
export const createPatient = asyncHandler(async (req, res) => {
  const branchId = resolveEffectiveBranchId(req);
  const {
    full_name,
    phone = '',
    address = '',
    age = null,
    sex = 'male',
    patient_code,
    create_case = true,
    animal_type = 'dog',
    wound_site = 'Right hand',
    exposure_date = todayIso(),
    notes = '',
    status,
    forward_to_doctor = false,
  } = req.body || {};

  if (!full_name || !String(full_name).trim()) {
    throw new AppError('Patient full name is required.', 400);
  }

  const enc = encryptPatientRecord({ full_name, phone, address });
  const codePrefix = `PT-${branchId.slice(0, 3).toUpperCase()}`;
  const resolvedPatientCode = patient_code || generateCode(codePrefix);

  const { data: patientRow, error: patErr } = await supabaseAdmin
    .from('patients')
    .insert({
      branch_id: branchId,
      patient_code: resolvedPatientCode,
      full_name_enc: enc.full_name_enc,
      phone_enc: enc.phone_enc,
      address_enc: enc.address_enc,
      age: age !== null && age !== '' ? Number(age) : null,
      sex: sex || 'male',
    })
    .select('*')
    .single();

  if (patErr) {
    throw new AppError(`Failed to create patient: ${patErr.message}`, 500);
  }

  const decryptedPatient = decryptPatientRecord(patientRow);
  let createdCase = null;

  if (create_case !== false) {
    const normalizedAnimal = ['dog', 'cat', 'other'].includes(
      String(animal_type).toLowerCase()
    )
      ? String(animal_type).toLowerCase()
      : 'other';

    const resolvedStatus =
      status && ['queued_nurse', 'pending_doctor', 'active_pep', 'completed'].includes(status)
        ? status
        : forward_to_doctor
          ? 'pending_doctor'
          : 'queued_nurse';

    const { data: caseRow, error: caseErr } = await supabaseAdmin
      .from('clinical_cases')
      .insert({
        case_number: generateCode('ABC'),
        patient_id: patientRow.id,
        branch_id: branchId,
        animal_type: normalizedAnimal,
        wound_site: wound_site || 'Right hand',
        exposure_date: exposure_date || todayIso(),
        status: resolvedStatus,
        notes: notes || null,
      })
      .select('*')
      .single();

    if (caseErr) {
      throw new AppError(`Failed to create clinical case: ${caseErr.message}`, 500);
    }

    createdCase = {
      ...caseRow,
      patient: decryptedPatient,
      pep_doses: [],
    };
  }

  res.status(201).json({
    ok: true,
    success: true,
    patient: decryptedPatient,
    case: createdCase,
    data: {
      patient: decryptedPatient,
      case: createdCase,
    },
  });
});

/**
 * PATCH /api/v1/patients/:id
 */
export const updatePatient = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { full_name, phone, address, age, sex } = req.body || {};

  const updates = {};
  if (full_name !== undefined) {
    updates.full_name_enc = encryptPatientRecord({ full_name }).full_name_enc;
  }
  if (phone !== undefined) {
    updates.phone_enc = encryptPatientRecord({ full_name: 'x', phone }).phone_enc;
  }
  if (address !== undefined) {
    updates.address_enc = encryptPatientRecord({ full_name: 'x', address }).address_enc;
  }
  if (age !== undefined) updates.age = age !== '' && age !== null ? Number(age) : null;
  if (sex !== undefined) updates.sex = sex;

  const { data, error } = await supabaseAdmin
    .from('patients')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    throw new AppError(`Failed to update patient: ${error.message}`, 500);
  }

  const decrypted = decryptPatientRecord(data);
  res.status(200).json({
    ok: true,
    success: true,
    patient: decrypted,
    data: decrypted,
  });
});

/**
 * GET /api/v1/cases?branch_id=...&status=...
 */
export const listCases = asyncHandler(async (req, res) => {
  const branchId = resolveEffectiveBranchId(req);
  const statusFilter = String(req.query?.status || '').trim();

  let query = supabaseAdmin
    .from('clinical_cases')
    .select('*, patients(*), pep_doses(*)')
    .eq('branch_id', branchId)
    .order('created_at', { ascending: false });

  if (
    statusFilter &&
    statusFilter.toLowerCase() !== 'all' &&
    ['queued_nurse', 'pending_doctor', 'active_pep', 'completed'].includes(statusFilter)
  ) {
    query = query.eq('status', statusFilter);
  }

  const { data, error } = await query;
  if (error) {
    throw new AppError(`Failed to load clinical cases: ${error.message}`, 500);
  }

  const formatted = (data || []).map(formatCaseRow);
  res.status(200).json({
    ok: true,
    success: true,
    cases: formatted,
    data: formatted,
  });
});

/**
 * POST /api/v1/cases
 */
export const createCase = asyncHandler(async (req, res) => {
  const branchId = resolveEffectiveBranchId(req);
  let {
    patient_id,
    full_name,
    phone,
    address,
    age,
    sex,
    animal_type = 'dog',
    wound_site = 'Right hand',
    exposure_date = todayIso(),
    status = 'queued_nurse',
    notes = '',
  } = req.body || {};

  if (!patient_id && full_name) {
    const enc = encryptPatientRecord({ full_name, phone, address });
    const { data: newPat, error: patErr } = await supabaseAdmin
      .from('patients')
      .insert({
        branch_id: branchId,
        patient_code: generateCode(`PT-${branchId.slice(0, 3).toUpperCase()}`),
        full_name_enc: enc.full_name_enc,
        phone_enc: enc.phone_enc,
        address_enc: enc.address_enc,
        age: age ? Number(age) : null,
        sex: sex || 'male',
      })
      .select('*')
      .single();
    if (patErr) throw new AppError(`Failed to create patient for case: ${patErr.message}`, 500);
    patient_id = newPat.id;
  }

  if (!patient_id) {
    throw new AppError('patient_id (or patient full_name) is required to create a case.', 400);
  }

  const normalizedAnimal = ['dog', 'cat', 'other'].includes(String(animal_type).toLowerCase())
    ? String(animal_type).toLowerCase()
    : 'other';

  const { data: created, error } = await supabaseAdmin
    .from('clinical_cases')
    .insert({
      case_number: generateCode('ABC'),
      patient_id,
      branch_id: branchId,
      animal_type: normalizedAnimal,
      wound_site,
      exposure_date,
      status: ['queued_nurse', 'pending_doctor', 'active_pep', 'completed'].includes(status)
        ? status
        : 'queued_nurse',
      notes: notes || null,
    })
    .select('*, patients(*), pep_doses(*)')
    .single();

  if (error) {
    throw new AppError(`Failed to create clinical case: ${error.message}`, 500);
  }

  const formatted = formatCaseRow(created);
  res.status(201).json({
    ok: true,
    success: true,
    case: formatted,
    data: formatted,
  });
});

/**
 * PATCH /api/v1/cases/:id
 * Updates triage notes, status, WHO exposure_category (I/II/III), erig_required, tetanus_given, assessed_by.
 * When moving to `active_pep` (or when doctor approves Category II/III), auto-generates Day 0, 3, 7, 14, 28 in `pep_doses`.
 */
export const updateCase = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    status,
    exposure_category,
    erig_required,
    tetanus_given,
    notes,
    wound_site,
    animal_type,
    exposure_date,
    day0_date,
    vaccine_brand = 'Speeda PVRV',
  } = req.body || {};

  const updates = {};
  if (notes !== undefined) updates.notes = notes;
  if (wound_site !== undefined) updates.wound_site = wound_site;
  if (animal_type !== undefined && ['dog', 'cat', 'other'].includes(String(animal_type).toLowerCase())) {
    updates.animal_type = String(animal_type).toLowerCase();
  }
  if (exposure_date !== undefined) updates.exposure_date = exposure_date;
  if (erig_required !== undefined) updates.erig_required = Boolean(erig_required);
  if (tetanus_given !== undefined) updates.tetanus_given = Boolean(tetanus_given);

  if (exposure_category !== undefined) {
    if (exposure_category !== null && !['I', 'II', 'III'].includes(exposure_category)) {
      throw new AppError('exposure_category must be I, II, or III.', 400);
    }
    updates.exposure_category = exposure_category;
    updates.assessed_by = req.user?.id || null;
    if (exposure_category === 'III' && erig_required === undefined) {
      updates.erig_required = true;
    }
  }

  if (status !== undefined) {
    if (!['queued_nurse', 'pending_doctor', 'active_pep', 'completed'].includes(status)) {
      throw new AppError('Invalid case status.', 400);
    }
    updates.status = status;
  } else if (exposure_category && req.user?.role === 'doctor') {
    updates.status = exposure_category === 'I' ? 'completed' : 'active_pep';
  }

  const { data: updatedCase, error } = await supabaseAdmin
    .from('clinical_cases')
    .update(updates)
    .eq('id', id)
    .select('*, patients(*), pep_doses(*)')
    .single();

  if (error) {
    throw new AppError(`Failed to update clinical case: ${error.message}`, 500);
  }

  // Automatically generate Day 0, 3, 7, 14, 28 rows in pep_doses when status moves to active_pep
  let existingDoses = Array.isArray(updatedCase.pep_doses) ? updatedCase.pep_doses : [];
  if (updatedCase.status === 'active_pep' && existingDoses.length === 0) {
    const startDate = day0_date || todayIso();
    const dosePayloads = [0, 3, 7, 14, 28].map((dayOffset) => ({
      case_id: updatedCase.id,
      branch_id: updatedCase.branch_id,
      dose_day: dayOffset,
      scheduled_date: addDays(startDate, dayOffset),
      vaccine_brand,
      status: 'scheduled',
    }));

    const { data: insertedDoses, error: doseErr } = await supabaseAdmin
      .from('pep_doses')
      .insert(dosePayloads)
      .select('*');

    if (doseErr) {
      throw new AppError(`Failed to generate PEP doses: ${doseErr.message}`, 500);
    }
    existingDoses = insertedDoses || [];
  }

  const formatted = formatCaseRow({
    ...updatedCase,
    pep_doses: existingDoses,
  });

  res.status(200).json({
    ok: true,
    success: true,
    case: formatted,
    pep_doses: formatted.pep_doses,
    data: formatted,
  });
});

/**
 * GET /api/v1/doses?branch_id=...&date=...&status=...
 */
export const listDoses = asyncHandler(async (req, res) => {
  const branchId = resolveEffectiveBranchId(req);
  const dateFilter = String(req.query?.date || '').trim().toLowerCase();
  const statusFilter = String(req.query?.status || '').trim().toLowerCase();
  const today = todayIso();

  let query = supabaseAdmin
    .from('pep_doses')
    .select(
      '*, clinical_cases(id, case_number, exposure_category, animal_type, wound_site, status, patients(*))'
    )
    .eq('branch_id', branchId)
    .order('scheduled_date', { ascending: true })
    .order('dose_day', { ascending: true });

  if (statusFilter && statusFilter !== 'all' && ['scheduled', 'completed', 'missed'].includes(statusFilter)) {
    query = query.eq('status', statusFilter);
  }

  if (dateFilter === 'today') {
    query = query.eq('scheduled_date', today);
  } else if (dateFilter === 'upcoming') {
    query = query.gte('scheduled_date', today);
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(dateFilter)) {
    query = query.eq('scheduled_date', dateFilter);
  }

  const { data, error } = await query;
  if (error) {
    throw new AppError(`Failed to load PEP doses: ${error.message}`, 500);
  }

  const formatted = (data || []).map((d) => {
    const c = Array.isArray(d.clinical_cases) ? d.clinical_cases[0] : d.clinical_cases;
    const rawPatient = c?.patients
      ? Array.isArray(c.patients)
        ? c.patients[0]
        : c.patients
      : null;
    return {
      ...d,
      case_number: c?.case_number || 'CASE',
      exposure_category: c?.exposure_category || null,
      animal_type: c?.animal_type || null,
      wound_site: c?.wound_site || null,
      patient: decryptPatientRecord(rawPatient),
    };
  });

  res.status(200).json({
    ok: true,
    success: true,
    doses: formatted,
    data: formatted,
  });
});

/**
 * PATCH /api/v1/doses/:id/administer
 * Marks dose `completed`, records `administered_at = now()`, `administered_by`, `vaccine_brand`, `lot_number`,
 * decrements matching `vaccine_inventory.stock_vials` by 1, and auto-completes parent `clinical_cases` when all doses are completed.
 */
export const administerDose = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    inventory_id,
    vaccine_brand,
    lot_number,
  } = req.body || {};

  const nowIso = new Date().toISOString();

  // If inventory_id is passed, look up that batch first to auto-fill brand & batch_number
  let selectedBatch = null;
  if (inventory_id) {
    const { data: batchRow } = await supabaseAdmin
      .from('vaccine_inventory')
      .select('*')
      .eq('id', inventory_id)
      .maybeSingle();
    selectedBatch = batchRow;
  }

  const resolvedBrand = vaccine_brand || selectedBatch?.item_name || 'Speeda PVRV';
  const resolvedLot = lot_number || selectedBatch?.batch_number || 'SPD-2026-LOT';

  const { data: updatedDose, error: doseErr } = await supabaseAdmin
    .from('pep_doses')
    .update({
      status: 'completed',
      administered_at: nowIso,
      administered_by: req.user?.id || null,
      vaccine_brand: resolvedBrand,
      lot_number: resolvedLot,
    })
    .eq('id', id)
    .select('*')
    .single();

  if (doseErr) {
    throw new AppError(`Failed to administer PEP dose: ${doseErr.message}`, 500);
  }

  // Decrement vaccine_inventory.stock_vials by 1
  if (!selectedBatch) {
    const { data: fallbackBatch } = await supabaseAdmin
      .from('vaccine_inventory')
      .select('*')
      .eq('branch_id', updatedDose.branch_id)
      .eq('category', 'vaccine')
      .gt('stock_vials', 0)
      .order('expiry_date', { ascending: true })
      .limit(1)
      .maybeSingle();
    selectedBatch = fallbackBatch;
  }

  let updatedInventory = null;
  if (selectedBatch) {
    const nextVials = Math.max(0, Number(selectedBatch.stock_vials) - 1);
    const { data: invUpdated } = await supabaseAdmin
      .from('vaccine_inventory')
      .update({
        stock_vials: nextVials,
        updated_at: nowIso,
      })
      .eq('id', selectedBatch.id)
      .select('*')
      .maybeSingle();
    updatedInventory = invUpdated;
  }

  // Check if all scheduled doses for this case are now completed
  const { data: siblingDoses } = await supabaseAdmin
    .from('pep_doses')
    .select('id, status')
    .eq('case_id', updatedDose.case_id);

  const allCompleted =
    Array.isArray(siblingDoses) &&
    siblingDoses.length > 0 &&
    siblingDoses.every((d) => d.status === 'completed');

  if (allCompleted) {
    await supabaseAdmin
      .from('clinical_cases')
      .update({ status: 'completed' })
      .eq('id', updatedDose.case_id);
  }

  res.status(200).json({
    ok: true,
    success: true,
    dose: updatedDose,
    inventory: updatedInventory,
    caseCompleted: allCompleted,
    data: updatedDose,
  });
});

/**
 * PATCH /api/v1/doses/:id/miss
 * Marks dose `missed` or reschedules `scheduled_date`.
 */
export const missOrRescheduleDose = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { scheduled_date, status } = req.body || {};

  const updates = {};
  if (scheduled_date) {
    updates.scheduled_date = scheduled_date;
    updates.status = status || 'scheduled';
  } else {
    updates.status = status || 'missed';
  }

  const { data, error } = await supabaseAdmin
    .from('pep_doses')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    throw new AppError(`Failed to update PEP dose: ${error.message}`, 500);
  }

  res.status(200).json({
    ok: true,
    success: true,
    dose: data,
    data,
  });
});

/**
 * GET /api/v1/inventory?branch_id=...
 */
export const listInventory = asyncHandler(async (req, res) => {
  const branchId = resolveEffectiveBranchId(req);

  const { data, error } = await supabaseAdmin
    .from('vaccine_inventory')
    .select('*')
    .eq('branch_id', branchId)
    .order('category', { ascending: true })
    .order('expiry_date', { ascending: true });

  if (error) {
    throw new AppError(`Failed to load vaccine inventory: ${error.message}`, 500);
  }

  res.status(200).json({
    ok: true,
    success: true,
    inventory: data || [],
    data: data || [],
  });
});

/**
 * POST /api/v1/inventory
 */
export const createInventoryBatch = asyncHandler(async (req, res) => {
  const branchId = resolveEffectiveBranchId(req);
  const {
    item_name,
    category = 'vaccine',
    batch_number,
    stock_vials = 0,
    reorder_level = 10,
    expiry_date = '2027-12-31',
  } = req.body || {};

  if (!item_name || !String(item_name).trim()) {
    throw new AppError('item_name is required.', 400);
  }

  const normalizedCategory = ['vaccine', 'erig', 'tetanus'].includes(
    String(category).toLowerCase()
  )
    ? String(category).toLowerCase()
    : 'vaccine';

  const resolvedBatch =
    batch_number && String(batch_number).trim()
      ? String(batch_number).trim()
      : `BATCH-${Date.now().toString().slice(-5)}`;

  const { data, error } = await supabaseAdmin
    .from('vaccine_inventory')
    .insert({
      branch_id: branchId,
      item_name: String(item_name).trim(),
      category: normalizedCategory,
      batch_number: resolvedBatch,
      stock_vials: Math.max(0, Number(stock_vials) || 0),
      reorder_level: Math.max(0, Number(reorder_level) || 10),
      expiry_date: expiry_date || null,
      updated_at: new Date().toISOString(),
    })
    .select('*')
    .single();

  if (error) {
    throw new AppError(`Failed to add inventory batch: ${error.message}`, 500);
  }

  res.status(201).json({
    ok: true,
    success: true,
    item: data,
    data,
  });
});

/**
 * PATCH /api/v1/inventory/:id
 */
export const updateInventoryBatch = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    item_name,
    category,
    batch_number,
    stock_vials,
    delta,
    reorder_level,
    expiry_date,
  } = req.body || {};

  const { data: current, error: findErr } = await supabaseAdmin
    .from('vaccine_inventory')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (findErr || !current) {
    throw new AppError('Inventory batch not found.', 404);
  }

  const updates = { updated_at: new Date().toISOString() };
  if (item_name !== undefined) updates.item_name = String(item_name).trim();
  if (category !== undefined && ['vaccine', 'erig', 'tetanus'].includes(category)) {
    updates.category = category;
  }
  if (batch_number !== undefined) updates.batch_number = batch_number;
  if (reorder_level !== undefined) {
    updates.reorder_level = Math.max(0, Number(reorder_level) || 0);
  }
  if (expiry_date !== undefined) updates.expiry_date = expiry_date;

  if (delta !== undefined) {
    updates.stock_vials = Math.max(0, Number(current.stock_vials) + Number(delta));
  } else if (stock_vials !== undefined) {
    updates.stock_vials = Math.max(0, Number(stock_vials) || 0);
  }

  const { data, error } = await supabaseAdmin
    .from('vaccine_inventory')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    throw new AppError(`Failed to update inventory batch: ${error.message}`, 500);
  }

  res.status(200).json({
    ok: true,
    success: true,
    item: data,
    data,
  });
});

/**
 * DELETE /api/v1/inventory/:id (Admin only)
 */
export const deleteInventoryBatch = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { error } = await supabaseAdmin.from('vaccine_inventory').delete().eq('id', id);
  if (error) {
    throw new AppError(`Failed to delete inventory batch: ${error.message}`, 500);
  }

  res.status(200).json({
    ok: true,
    success: true,
    deletedId: id,
  });
});

/**
 * GET /api/v1/admin/staff?branch_id=...
 */
export const listAdminStaff = asyncHandler(async (req, res) => {
  const rawBranch = String(req.query?.branch_id || '').trim().toLowerCase();

  let query = supabaseAdmin
    .from('profiles')
    .select('id, email, full_name, role, branch_id, license_number, is_active, created_at')
    .in('role', ['admin', 'doctor', 'nurse'])
    .order('role', { ascending: true })
    .order('full_name', { ascending: true });

  const { data, error } = await query;
  if (error) {
    throw new AppError(`Failed to load staff profiles: ${error.message}`, 500);
  }

  let list = data || [];
  if (rawBranch && rawBranch !== 'all') {
    const targetBranch = normalizeBranchId(rawBranch);
    list = list.filter((s) => s.branch_id === targetBranch || s.role === 'admin');
  }

  res.status(200).json({
    ok: true,
    success: true,
    staff: list,
    data: list,
  });
});

/**
 * POST /api/v1/admin/staff
 * Creates a real Supabase Auth user + inserts into `public.profiles`.
 */
export const createAdminStaff = asyncHandler(async (req, res) => {
  const {
    email,
    password = 'VictorioABC@2026',
    full_name,
    role = 'nurse',
    branch_id,
    license_number = null,
  } = req.body || {};

  if (!email || !full_name) {
    throw new AppError('email and full_name are required.', 400);
  }

  const normalizedRole = ['admin', 'doctor', 'nurse'].includes(String(role).toLowerCase())
    ? String(role).toLowerCase()
    : 'nurse';

  const resolvedBranchId =
    normalizedRole === 'admin'
      ? normalizeBranchId(branch_id) || null
      : normalizeBranchId(branch_id) || 'santa-maria';

  const userMetadata = {
    role: normalizedRole,
    full_name: String(full_name).trim(),
    branch_id: resolvedBranchId,
    license_number: license_number || null,
    is_active: true,
  };

  const { data: createdAuth, error: authErr } = await supabaseAdmin.auth.admin.createUser({
    email: String(email).trim().toLowerCase(),
    password: String(password || 'VictorioABC@2026'),
    email_confirm: true,
    user_metadata: userMetadata,
  });

  if (authErr) {
    throw new AppError(`Failed to create staff auth account: ${authErr.message}`, 400);
  }

  const { data: profileRow, error: profErr } = await supabaseAdmin
    .from('profiles')
    .upsert(
      {
        id: createdAuth.user.id,
        email: String(email).trim().toLowerCase(),
        full_name: String(full_name).trim(),
        role: normalizedRole,
        branch_id: resolvedBranchId,
        license_number: license_number || null,
        is_active: true,
      },
      { onConflict: 'id' }
    )
    .select('*')
    .single();

  if (profErr) {
    throw new AppError(`Failed to save staff profile: ${profErr.message}`, 500);
  }

  res.status(201).json({
    ok: true,
    success: true,
    staff: profileRow,
    data: profileRow,
  });
});

/**
 * PATCH /api/v1/admin/staff/:id
 */
export const updateAdminStaff = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { full_name, role, branch_id, license_number, is_active } = req.body || {};

  const { data: existing, error: findErr } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (findErr || !existing) {
    throw new AppError('Staff profile not found.', 404);
  }

  const nextRole =
    role && ['admin', 'doctor', 'nurse'].includes(String(role).toLowerCase())
      ? String(role).toLowerCase()
      : existing.role;

  let nextBranchId = existing.branch_id;
  if (branch_id !== undefined) {
    nextBranchId =
      nextRole === 'admin' && !branch_id
        ? null
        : normalizeBranchId(branch_id);
  } else if (nextRole === 'admin') {
    nextBranchId = null;
  }

  const updates = {
    full_name: full_name !== undefined ? String(full_name).trim() : existing.full_name,
    role: nextRole,
    branch_id: nextBranchId,
    license_number:
      license_number !== undefined ? license_number || null : existing.license_number,
    is_active: is_active !== undefined ? Boolean(is_active) : existing.is_active,
  };

  const { data: updatedProfile, error: updErr } = await supabaseAdmin
    .from('profiles')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();

  if (updErr) {
    throw new AppError(`Failed to update staff profile: ${updErr.message}`, 500);
  }

  await supabaseAdmin.auth.admin.updateUserById(id, {
    user_metadata: {
      role: updatedProfile.role,
      full_name: updatedProfile.full_name,
      branch_id: updatedProfile.branch_id,
      license_number: updatedProfile.license_number,
      is_active: updatedProfile.is_active,
    },
  });

  res.status(200).json({
    ok: true,
    success: true,
    staff: updatedProfile,
    data: updatedProfile,
  });
});
