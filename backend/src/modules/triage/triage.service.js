import { supabaseAdmin } from '../../config/supabase.js';
import { AppError } from '../../middleware/error.middleware.js';
import { ROLES } from '../../middleware/rbac.middleware.js';
import { decryptPatientPII } from '../../utils/crypto.js';

export const VISIT_STATUSES = Object.freeze([
  'Waiting',
  'Triage',
  'For Doctor Order',
  'For Vaccination',
  'Completed',
]);

/**
 * Maps a bite_case row to one of the 5 live clinical visit statuses:
 * Waiting -> Triage -> For Doctor Order -> For Vaccination -> Completed
 */
export function deriveVisitStatus(biteCase) {
  if (!biteCase) return 'Waiting';
  const ctx = biteCase.clinical_context || {};
  if (biteCase.status === 'completed') return 'Completed';
  if (VISIT_STATUSES.includes(ctx.visit_status)) {
    return ctx.visit_status;
  }
  if (biteCase.status === 'validated') return 'For Vaccination';
  if (ctx.triage_completed) return 'For Doctor Order';
  return 'Waiting';
}

/**
 * Maps a live visit_status to the underlying PostgreSQL public.case_status enum.
 */
export function mapVisitStatusToDbCaseStatus(visitStatus, currentDbStatus = 'pending_triage') {
  switch (visitStatus) {
    case 'Completed':
      return 'completed';
    case 'For Vaccination':
      return 'validated';
    case 'Waiting':
    case 'Triage':
    case 'For Doctor Order':
    default:
      return currentDbStatus === 'referred' ? 'referred' : 'pending_triage';
  }
}

/**
 * WHO Rabies Exposure Category guideline helper based on wound assessment.
 */
export function suggestWhoCategoryFromAssessment(assessment = {}) {
  const { animal_type, wound_type, wound_depth, bleeding, multiple_wounds } = assessment;
  const isBat = typeof animal_type === 'string' && animal_type.toLowerCase().includes('bat');
  if (
    isBat ||
    wound_depth === 'deep_transdermal' ||
    wound_type === 'lick_broken_skin' ||
    bleeding === true ||
    multiple_wounds === true
  ) {
    return { category: 'III', confidence: 0.92 };
  }
  if (
    wound_type === 'intact_skin_contact' ||
    wound_depth === 'intact'
  ) {
    return { category: 'I', confidence: 0.95 };
  }
  return { category: 'II', confidence: 0.88 };
}

export class TriageService {
  static async getModuleStatus(tenant) {
    return {
      module: 'triage',
      tenant,
      ready: true,
    };
  }

  static async resolveBranchId(user, tenant, requestedBranchId) {
    if (user.role === ROLES.NURSE || user.role === ROLES.DOCTOR) {
      return user.branch_id || tenant?.branchId;
    }
    if (requestedBranchId) return requestedBranchId;
    if (tenant?.branchId) return tenant.branchId;

    const { data: firstBranch } = await supabaseAdmin
      .from('branches')
      .select('id')
      .eq('status', 'active')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    return firstBranch?.id || null;
  }

  /**
   * Lists the live patient visit & triage queue with status counts.
   */
  static async listQueue({ user, tenant, query = {} }) {
    let dbQuery = supabaseAdmin
      .from('bite_cases')
      .select(
        `
        *,
        branch:branches!bite_cases_branch_id_fkey(id, name, barangay, municipality),
        patient:patients!bite_cases_patient_id_fkey(
          id,
          qr_code_hash,
          full_name,
          phone,
          birthdate,
          gender,
          address,
          barangay,
          municipality
        ),
        doctor:profiles!bite_cases_doctor_id_fkey(id, full_name, license_number),
        clinical_orders(*),
        pep_schedules(*)
      `
      )
      .order('created_at', { ascending: false });

    const branchId =
      user.role === ROLES.ADMIN
        ? query.branch_id || tenant?.branchId || null
        : user.branch_id || tenant?.branchId;

    if (branchId) {
      dbQuery = dbQuery.eq('branch_id', branchId);
    }

    const { data, error } = await dbQuery.limit(Number(query.limit) || 150);
    if (error) {
      throw new AppError(`Failed to fetch triage queue: ${error.message}`, 500);
    }

    const items = (data || []).map((row) => {
      const visitStatus = deriveVisitStatus(row);
      const patient = row.patient ? decryptPatientPII(row.patient) : null;
      const schedules = Array.isArray(row.pep_schedules)
        ? [...row.pep_schedules].sort(
            (a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime()
          )
        : [];
      return {
        ...row,
        patient,
        visit_status: visitStatus,
        pep_schedules: schedules,
      };
    });

    const summary = {
      total: items.length,
      Waiting: 0,
      Triage: 0,
      'For Doctor Order': 0,
      'For Vaccination': 0,
      Completed: 0,
    };

    for (const item of items) {
      if (summary[item.visit_status] !== undefined) {
        summary[item.visit_status] += 1;
      }
    }

    let filtered = items;
    if (query.visit_status && query.visit_status !== 'ALL') {
      filtered = filtered.filter((i) => i.visit_status === query.visit_status);
    }

    const search = (query.search || '').trim().toLowerCase();
    if (search) {
      filtered = filtered.filter((i) => {
        const p = i.patient || {};
        const queueNum = i.clinical_context?.queue_number || '';
        return [
          p.full_name,
          p.qr_code_hash,
          p.phone,
          p.barangay,
          queueNum,
          i.animal_type,
          i.bite_site,
        ].some((val) => typeof val === 'string' && val.toLowerCase().includes(search));
      });
    }

    return {
      items: filtered,
      summary,
    };
  }

  /**
   * Checks a patient into the live branch queue using either `qr_code_hash` or `patient_id`.
   */
  static async checkInPatient({ user, tenant, payload }) {
    let patient = null;

    if (payload.patient_id) {
      const { data, error } = await supabaseAdmin
        .from('patients')
        .select('*')
        .eq('id', payload.patient_id)
        .maybeSingle();
      if (error || !data) throw new AppError('Patient not found for check-in.', 404);
      patient = decryptPatientPII(data);
    } else if (payload.qr_code_hash) {
      const { data, error } = await supabaseAdmin
        .from('patients')
        .select('*')
        .ilike('qr_code_hash', payload.qr_code_hash.trim())
        .maybeSingle();
      if (error || !data) {
        throw new AppError(`No patient found with QR token "${payload.qr_code_hash}".`, 404);
      }
      patient = decryptPatientPII(data);
    } else {
      throw new AppError('Either patient_id or qr_code_hash is required for check-in.', 400);
    }

    const branchId = await this.resolveBranchId(
      user,
      tenant,
      payload.branch_id || patient.registered_branch_id
    );
    if (!branchId) {
      throw new AppError('Branch ID is required to check in a patient.', 400);
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const { count } = await supabaseAdmin
      .from('bite_cases')
      .select('id', { count: 'exact', head: true })
      .eq('branch_id', branchId)
      .gte('created_at', `${todayStr}T00:00:00.000Z`);

    const queueNumber = `Q-${String((count || 0) + 1).padStart(3, '0')}`;
    const initialVisitStatus = payload.visit_status || 'Waiting';

    const clinicalContext = {
      visit_status: initialVisitStatus,
      queue_number: queueNumber,
      visit_type: payload.visit_type || 'new_exposure',
      chief_complaint: payload.chief_complaint || '',
      checked_in_at: new Date().toISOString(),
      checked_in_by: user.id,
      checked_in_by_name: user.full_name,
    };

    const insertPayload = {
      branch_id: branchId,
      patient_id: patient.id,
      exposure_date: payload.exposure_date || todayStr,
      animal_type: payload.animal_type || 'Dog',
      animal_status: payload.animal_status || 'unknown',
      bite_site: payload.bite_site || 'Pending Triage Assessment',
      clinical_context: clinicalContext,
      status: mapVisitStatusToDbCaseStatus(initialVisitStatus),
    };

    const { data: createdCase, error: insertError } = await supabaseAdmin
      .from('bite_cases')
      .insert(insertPayload)
      .select(
        `
        *,
        branch:branches!bite_cases_branch_id_fkey(id, name, barangay),
        patient:patients!bite_cases_patient_id_fkey(*)
      `
      )
      .single();

    if (insertError) {
      throw new AppError(`Failed to check in patient: ${insertError.message}`, 400);
    }

    await supabaseAdmin.from('audit_logs').insert({
      branch_id: branchId,
      actor_id: user.id,
      action: 'PATIENT_QR_CHECKED_IN',
      entity_type: 'bite_cases',
      entity_id: createdCase.id,
      metadata: {
        patient_id: patient.id,
        qr_code_hash: patient.qr_code_hash,
        queue_number: queueNumber,
        visit_status: initialVisitStatus,
      },
    });

    return {
      ...createdCase,
      patient: createdCase.patient ? decryptPatientPII(createdCase.patient) : patient,
      visit_status: deriveVisitStatus(createdCase),
    };
  }

  /**
   * Transitions a visit across `Waiting`, `Triage`, `For Doctor Order`, `For Vaccination`, `Completed`.
   */
  static async updateVisitStatus({ user, tenant, caseId, visitStatus, notes }) {
    if (!VISIT_STATUSES.includes(visitStatus)) {
      throw new AppError(
        `Invalid visit_status "${visitStatus}". Allowed: ${VISIT_STATUSES.join(', ')}`,
        400
      );
    }

    const { data: existing, error: fetchErr } = await supabaseAdmin
      .from('bite_cases')
      .select('*')
      .eq('id', caseId)
      .maybeSingle();

    if (fetchErr || !existing) {
      throw new AppError('Visit case not found.', 404);
    }

    if (
      (user.role === ROLES.NURSE || user.role === ROLES.DOCTOR) &&
      existing.branch_id !== (user.branch_id || tenant?.branchId)
    ) {
      throw new AppError('Tenant violation: cannot modify a visit from another branch.', 403);
    }

    const now = new Date().toISOString();
    const prevContext = existing.clinical_context || {};
    const nextContext = {
      ...prevContext,
      visit_status: visitStatus,
      ...(visitStatus === 'Triage' ? { triage_started_at: now } : {}),
      ...(visitStatus === 'For Doctor Order'
        ? { triage_completed: true, triage_completed_at: now }
        : {}),
      ...(visitStatus === 'For Vaccination' ? { ready_for_vaccination_at: now } : {}),
      ...(visitStatus === 'Completed' ? { completed_at: now } : {}),
      ...(notes ? { status_notes: notes } : {}),
    };

    const nextDbStatus = mapVisitStatusToDbCaseStatus(visitStatus, existing.status);

    const { data: updated, error: updateErr } = await supabaseAdmin
      .from('bite_cases')
      .update({
        status: nextDbStatus,
        clinical_context: nextContext,
      })
      .eq('id', caseId)
      .select(
        `
        *,
        branch:branches!bite_cases_branch_id_fkey(id, name, barangay),
        patient:patients!bite_cases_patient_id_fkey(*),
        clinical_orders(*),
        pep_schedules(*)
      `
      )
      .single();

    if (updateErr) {
      throw new AppError(`Failed to update visit status: ${updateErr.message}`, 400);
    }

    await supabaseAdmin.from('audit_logs').insert({
      branch_id: existing.branch_id,
      actor_id: user.id,
      action: 'VISIT_STATUS_UPDATED',
      entity_type: 'bite_cases',
      entity_id: caseId,
      metadata: {
        previous_visit_status: deriveVisitStatus(existing),
        new_visit_status: visitStatus,
      },
    });

    return {
      ...updated,
      patient: updated.patient ? decryptPatientPII(updated.patient) : null,
      visit_status: deriveVisitStatus(updated),
    };
  }

  /**
   * Saves the Nurse Triage & Wound Assessment and moves the visit to `For Doctor Order`.
   */
  static async saveTriageAssessment({ user, tenant, caseId, payload }) {
    const { data: existing, error: fetchErr } = await supabaseAdmin
      .from('bite_cases')
      .select('*')
      .eq('id', caseId)
      .maybeSingle();

    if (fetchErr || !existing) {
      throw new AppError('Visit case not found.', 404);
    }

    if (
      (user.role === ROLES.NURSE || user.role === ROLES.DOCTOR) &&
      existing.branch_id !== (user.branch_id || tenant?.branchId)
    ) {
      throw new AppError('Tenant violation: cannot update triage for another branch.', 403);
    }

    const suggestion = suggestWhoCategoryFromAssessment({
      animal_type: payload.animal_type ?? existing.animal_type,
      wound_type: payload.wound_type,
      wound_depth: payload.wound_depth,
      bleeding: payload.bleeding,
      multiple_wounds: payload.multiple_wounds,
    });

    const aiCategory =
      payload.ai_suggested_category || existing.ai_suggested_category || suggestion.category;
    const aiConfidence =
      payload.ai_confidence ?? existing.ai_confidence ?? suggestion.confidence;

    const nextVisitStatus = payload.visit_status || 'For Doctor Order';
    const prevContext = existing.clinical_context || {};

    const nextContext = {
      ...prevContext,
      visit_status: nextVisitStatus,
      triage_completed: true,
      triage_completed_at: new Date().toISOString(),
      triaged_by: user.id,
      triaged_by_name: user.full_name,
      weight_kg: payload.weight_kg ?? prevContext.weight_kg ?? null,
      blood_pressure: payload.blood_pressure ?? prevContext.blood_pressure ?? '',
      temperature_c: payload.temperature_c ?? prevContext.temperature_c ?? null,
      allergies: payload.allergies ?? prevContext.allergies ?? '',
      wound_type: payload.wound_type ?? prevContext.wound_type ?? 'bite',
      wound_depth: payload.wound_depth ?? prevContext.wound_depth ?? 'superficial',
      bleeding: payload.bleeding ?? prevContext.bleeding ?? false,
      multiple_wounds: payload.multiple_wounds ?? prevContext.multiple_wounds ?? false,
      wound_washed: payload.wound_washed ?? prevContext.wound_washed ?? true,
      washed_within_15_min:
        payload.washed_within_15_min ?? prevContext.washed_within_15_min ?? false,
      antiseptic_applied: payload.antiseptic_applied ?? prevContext.antiseptic_applied ?? false,
      tandok_or_traditional:
        payload.tandok_or_traditional ?? prevContext.tandok_or_traditional ?? false,
      previous_rabies_vaccine:
        payload.previous_rabies_vaccine ?? prevContext.previous_rabies_vaccine ?? false,
      last_tetanus_year: payload.last_tetanus_year ?? prevContext.last_tetanus_year ?? '',
    };

    const { data: updated, error: updateErr } = await supabaseAdmin
      .from('bite_cases')
      .update({
        exposure_date: payload.exposure_date || existing.exposure_date,
        animal_type: payload.animal_type || existing.animal_type,
        animal_status: payload.animal_status || existing.animal_status,
        bite_site: payload.bite_site || existing.bite_site,
        animal_observation_status:
          payload.animal_observation_status || existing.animal_observation_status,
        clinical_notes:
          payload.clinical_notes !== undefined ? payload.clinical_notes : existing.clinical_notes,
        adverse_reactions:
          payload.adverse_reactions !== undefined
            ? payload.adverse_reactions
            : existing.adverse_reactions,
        ai_suggested_category: aiCategory,
        ai_confidence: aiConfidence,
        clinical_context: nextContext,
        status: mapVisitStatusToDbCaseStatus(nextVisitStatus, existing.status),
      })
      .eq('id', caseId)
      .select(
        `
        *,
        branch:branches!bite_cases_branch_id_fkey(id, name, barangay),
        patient:patients!bite_cases_patient_id_fkey(*),
        clinical_orders(*),
        pep_schedules(*)
      `
      )
      .single();

    if (updateErr) {
      throw new AppError(`Failed to save triage assessment: ${updateErr.message}`, 400);
    }

    await supabaseAdmin.from('audit_logs').insert({
      branch_id: existing.branch_id,
      actor_id: user.id,
      action: 'TRIAGE_ASSESSMENT_COMPLETED',
      entity_type: 'bite_cases',
      entity_id: caseId,
      metadata: {
        ai_suggested_category: aiCategory,
        ai_confidence: aiConfidence,
        visit_status: nextVisitStatus,
      },
    });

    return {
      ...updated,
      patient: updated.patient ? decryptPatientPII(updated.patient) : null,
      visit_status: deriveVisitStatus(updated),
    };
  }
}
