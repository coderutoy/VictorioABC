import { supabaseAdmin } from '../../config/supabase.js';
import { AppError } from '../../middleware/error.middleware.js';
import { ROLES } from '../../middleware/rbac.middleware.js';
import { decryptPatientPII } from '../../utils/crypto.js';
import { deriveVisitStatus } from '../triage/triage.service.js';

/**
 * Computes the scheduled date offset in YYYY-MM-DD from a Day 0 date string.
 */
function addDaysToDateString(baseDateStr, daysOffset) {
  const [y, m, d] = baseDateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + daysOffset));
  return dt.toISOString().slice(0, 10);
}

/**
 * Returns the WHO PEP dose offsets for a given regimen type ('ID', 'IM', 'booster').
 */
export function buildPepDosePlan(day0DateStr, regimenType) {
  const base = day0DateStr || new Date().toISOString().slice(0, 10);
  if (regimenType === 'booster') {
    return [
      { dose_number: 'Day 0', scheduled_date: addDaysToDateString(base, 0) },
      { dose_number: 'Day 3', scheduled_date: addDaysToDateString(base, 3) },
    ];
  }
  if (regimenType === 'ID') {
    return [
      { dose_number: 'Day 0', scheduled_date: addDaysToDateString(base, 0) },
      { dose_number: 'Day 3', scheduled_date: addDaysToDateString(base, 3) },
      { dose_number: 'Day 7', scheduled_date: addDaysToDateString(base, 7) },
      { dose_number: 'Day 28', scheduled_date: addDaysToDateString(base, 28) },
    ];
  }
  // Default 'IM' (Essen 5-dose: Day 0, Day 3, Day 7, Day 14, Day 28)
  return [
    { dose_number: 'Day 0', scheduled_date: addDaysToDateString(base, 0) },
    { dose_number: 'Day 3', scheduled_date: addDaysToDateString(base, 3) },
    { dose_number: 'Day 7', scheduled_date: addDaysToDateString(base, 7) },
    { dose_number: 'Day 14', scheduled_date: addDaysToDateString(base, 14) },
    { dose_number: 'Day 28', scheduled_date: addDaysToDateString(base, 28) },
  ];
}

export class ClinicalOrdersService {
  static async getModuleStatus(tenant) {
    return {
      module: 'clinical-orders',
      tenant,
      ready: true,
    };
  }

  /**
   * Lists clinical encounters & orders for the active branch (or all branches for HQ Admin).
   */
  static async listClinicalOrders({ user, tenant, query = {} }) {
    const branchId =
      user.role === ROLES.ADMIN
        ? query.branch_id || tenant?.branchId || null
        : user.branch_id || tenant?.branchId;

    let casesQuery = supabaseAdmin
      .from('bite_cases')
      .select(
        `
        *,
        branch:branches!bite_cases_branch_id_fkey(id, name, barangay, municipality),
        patient:patients!bite_cases_patient_id_fkey(*),
        doctor:profiles!bite_cases_doctor_id_fkey(id, full_name, license_number),
        clinical_orders(
          *,
          doctor:profiles!clinical_orders_doctor_id_fkey(id, full_name, license_number)
        ),
        pep_schedules(
          *,
          nurse:profiles!pep_schedules_nurse_id_fkey(id, full_name),
          inventory:vaccine_inventory!pep_schedules_inventory_batch_id_fkey(id, vaccine_name, batch_number, lot_number)
        )
      `
      )
      .order('created_at', { ascending: false });

    if (branchId) {
      casesQuery = casesQuery.eq('branch_id', branchId);
    }

    const { data, error } = await casesQuery.limit(Number(query.limit) || 150);
    if (error) {
      throw new AppError(`Failed to load clinical encounters: ${error.message}`, 500);
    }

    const mapped = (data || []).map((c) => ({
      ...c,
      patient: c.patient ? decryptPatientPII(c.patient) : null,
      visit_status: deriveVisitStatus(c),
      pep_schedules: (c.pep_schedules || []).sort(
        (a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime()
      ),
    }));

    if (query.visit_status && query.visit_status !== 'ALL') {
      return mapped.filter((c) => c.visit_status === query.visit_status);
    }

    return mapped;
  }

  /**
   * Doctor Clinical Encounter submission:
   * - Validates WHO Rabies Exposure Category (Category I, II, III) + wound assessment
   * - Creates/updates the clinical_orders record (Regimen ID/IM/booster, ERIG/HRIG, Tetanus Toxoid)
   * - Generates the automated PEP vaccination schedule (Day 0, Day 3, Day 7, Day 14/28)
   * - Advances visit status to `For Vaccination` (or `Completed` if Category I with no injection orders)
   */
  static async createClinicalOrder({ user, tenant, payload }) {
    if (user.role !== ROLES.DOCTOR && user.role !== ROLES.ADMIN) {
      throw new AppError('Only licensed Doctors or Central Admin can issue clinical orders.', 403);
    }

    const { data: biteCase, error: caseErr } = await supabaseAdmin
      .from('bite_cases')
      .select('*, patient:patients!bite_cases_patient_id_fkey(*)')
      .eq('id', payload.case_id)
      .maybeSingle();

    if (caseErr || !biteCase) {
      throw new AppError('Bite case not found.', 404);
    }

    if (
      user.role === ROLES.DOCTOR &&
      biteCase.branch_id !== (user.branch_id || tenant?.branchId)
    ) {
      throw new AppError('Tenant violation: cannot issue orders for another branch.', 403);
    }

    const validatedCategory = payload.doctor_validated_category;
    if (
      biteCase.ai_suggested_category &&
      biteCase.ai_suggested_category !== validatedCategory &&
      !payload.ai_override_reason?.trim()
    ) {
      throw new AppError(
        `AI suggested Category ${biteCase.ai_suggested_category}. Please provide a clinical override reason for Category ${validatedCategory}.`,
        400
      );
    }

    const shouldGeneratePep =
      payload.generate_pep_schedule !== undefined
        ? payload.generate_pep_schedule
        : validatedCategory !== 'I';

    const requiresVaccinationVisit =
      shouldGeneratePep || Boolean(payload.erig_required) || Boolean(payload.tetanus_required);

    const nextVisitStatus = requiresVaccinationVisit ? 'For Vaccination' : 'Completed';
    const nextDbCaseStatus = requiresVaccinationVisit ? 'validated' : 'completed';

    const prevCtx = biteCase.clinical_context || {};
    const weightKg = payload.weight_kg ?? prevCtx.weight_kg ?? null;
    const igType =
      payload.immunoglobulin_type || (payload.erig_required ? 'ERIG' : 'none');
    const calculatedIgIu =
      payload.erig_required && weightKg
        ? Math.round(weightKg * (igType === 'HRIG' ? 20 : 40))
        : null;

    const nextCtx = {
      ...prevCtx,
      visit_status: nextVisitStatus,
      triage_completed: true,
      weight_kg: weightKg,
      wound_type: payload.wound_type ?? prevCtx.wound_type ?? 'bite',
      wound_depth: payload.wound_depth ?? prevCtx.wound_depth ?? 'superficial',
      bleeding: payload.bleeding ?? prevCtx.bleeding ?? false,
      multiple_wounds: payload.multiple_wounds ?? prevCtx.multiple_wounds ?? false,
      wound_washed: payload.wound_washed ?? prevCtx.wound_washed ?? true,
      order_details: {
        ordered_at: new Date().toISOString(),
        doctor_id: user.id,
        doctor_name: user.full_name,
        doctor_license: user.license_number || null,
        who_category: validatedCategory,
        regimen_type: payload.regimen_type,
        day0_date: payload.day0_date || new Date().toISOString().slice(0, 10),
        generate_pep_schedule: shouldGeneratePep,
        erig_required: Boolean(payload.erig_required),
        immunoglobulin_type: igType,
        calculated_ig_iu: calculatedIgIu,
        erig_skin_test_result: payload.erig_skin_test_result || 'pending',
        tetanus_required: Boolean(payload.tetanus_required),
        tetanus_preparation:
          payload.tetanus_preparation ||
          (payload.tetanus_required ? 'Tetanus Toxoid (TT) 0.5 mL IM' : 'none'),
        wound_care_instructions: payload.instructions || '',
      },
    };

    // 1. Update bite_cases with doctor's WHO validation & wound assessment
    const { error: updateCaseErr } = await supabaseAdmin
      .from('bite_cases')
      .update({
        ...(payload.exposure_date ? { exposure_date: payload.exposure_date } : {}),
        ...(payload.animal_type ? { animal_type: payload.animal_type } : {}),
        ...(payload.animal_status ? { animal_status: payload.animal_status } : {}),
        ...(payload.bite_site ? { bite_site: payload.bite_site } : {}),
        ...(payload.animal_observation_status
          ? { animal_observation_status: payload.animal_observation_status }
          : {}),
        doctor_validated_category: validatedCategory,
        ai_override_reason: payload.ai_override_reason || null,
        doctor_id: user.id,
        validated_at: new Date().toISOString(),
        clinical_notes:
          payload.clinical_notes !== undefined ? payload.clinical_notes : biteCase.clinical_notes,
        adverse_reactions:
          payload.adverse_reactions !== undefined
            ? payload.adverse_reactions
            : biteCase.adverse_reactions,
        clinical_context: nextCtx,
        status: nextDbCaseStatus,
      })
      .eq('id', biteCase.id);

    if (updateCaseErr) {
      throw new AppError(`Failed to update bite case validation: ${updateCaseErr.message}`, 400);
    }

    // 2. Insert clinical order record
    const { data: clinicalOrder, error: orderErr } = await supabaseAdmin
      .from('clinical_orders')
      .insert({
        case_id: biteCase.id,
        branch_id: biteCase.branch_id,
        doctor_id: user.id,
        regimen_type: payload.regimen_type,
        erig_required: Boolean(payload.erig_required),
        tetanus_required: Boolean(payload.tetanus_required),
        instructions: payload.instructions || null,
      })
      .select('*')
      .single();

    if (orderErr) {
      throw new AppError(`Failed to create clinical order: ${orderErr.message}`, 400);
    }

    // 3. Generate PEP vaccination schedule (Day 0, Day 3, Day 7, Day 14/28)
    let generatedSchedules = [];
    if (shouldGeneratePep) {
      const day0Date = payload.day0_date || new Date().toISOString().slice(0, 10);
      const dosePlan = buildPepDosePlan(day0Date, payload.regimen_type);

      // Remove any unadministered scheduled doses if regimen was re-ordered
      await supabaseAdmin
        .from('pep_schedules')
        .delete()
        .eq('case_id', biteCase.id)
        .eq('status', 'scheduled');

      const scheduleRows = dosePlan.map((d) => ({
        case_id: biteCase.id,
        branch_id: biteCase.branch_id,
        dose_number: d.dose_number,
        scheduled_date: d.scheduled_date,
        status: 'scheduled',
      }));

      const { data: schedData, error: schedErr } = await supabaseAdmin
        .from('pep_schedules')
        .upsert(scheduleRows, { onConflict: 'case_id,dose_number', ignoreDuplicates: true })
        .select('*');

      if (schedErr) {
        throw new AppError(`Failed to generate PEP schedule: ${schedErr.message}`, 400);
      }
      generatedSchedules = schedData || [];
    }

    await supabaseAdmin.from('audit_logs').insert({
      branch_id: biteCase.branch_id,
      actor_id: user.id,
      action: 'CLINICAL_ORDER_ISSUED',
      entity_type: 'clinical_orders',
      entity_id: clinicalOrder.id,
      metadata: {
        case_id: biteCase.id,
        who_category: validatedCategory,
        regimen_type: payload.regimen_type,
        erig_required: Boolean(payload.erig_required),
        tetanus_required: Boolean(payload.tetanus_required),
        doses_scheduled: generatedSchedules.length,
      },
    });

    // Fetch complete updated encounter
    const { data: fullCase } = await supabaseAdmin
      .from('bite_cases')
      .select(
        `
        *,
        branch:branches!bite_cases_branch_id_fkey(id, name, barangay),
        patient:patients!bite_cases_patient_id_fkey(*),
        doctor:profiles!bite_cases_doctor_id_fkey(id, full_name, license_number),
        clinical_orders(*),
        pep_schedules(*)
      `
      )
      .eq('id', biteCase.id)
      .single();

    return {
      ...fullCase,
      patient: fullCase?.patient ? decryptPatientPII(fullCase.patient) : null,
      visit_status: deriveVisitStatus(fullCase),
      pep_schedules: (fullCase?.pep_schedules || []).sort(
        (a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime()
      ),
    };
  }
}
