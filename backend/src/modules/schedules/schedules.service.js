import crypto from 'node:crypto';
import { supabaseAdmin } from '../../config/supabase.js';
import { AppError } from '../../middleware/error.middleware.js';
import { ROLES } from '../../middleware/rbac.middleware.js';
import { decryptPatientPII } from '../../utils/crypto.js';

export class SchedulesService {
  static async getModuleStatus(tenant) {
    return {
      module: 'schedules',
      tenant,
      ready: true,
    };
  }

  /**
   * Lists PEP vaccination schedules with patient, case, clinical order, and inventory details.
   */
  static async listSchedules({ user, tenant, query = {} }) {
    let dbQuery = supabaseAdmin
      .from('pep_schedules')
      .select(
        `
        *,
        branch:branches!pep_schedules_branch_id_fkey(id, name, barangay),
        administered_branch:branches!pep_schedules_administered_branch_id_fkey(id, name, barangay),
        nurse:profiles!pep_schedules_nurse_id_fkey(id, full_name),
        inventory:vaccine_inventory!pep_schedules_inventory_batch_id_fkey(id, vaccine_name, batch_number, lot_number, item_type),
        erig_inventory:vaccine_inventory!pep_schedules_erig_inventory_batch_id_fkey(id, vaccine_name, batch_number, lot_number),
        tetanus_inventory:vaccine_inventory!pep_schedules_tetanus_inventory_batch_id_fkey(id, vaccine_name, batch_number, lot_number),
        bite_case:bite_cases!pep_schedules_case_id_fkey(
          id,
          branch_id,
          patient_id,
          exposure_date,
          animal_type,
          animal_status,
          bite_site,
          doctor_validated_category,
          ai_suggested_category,
          clinical_context,
          status,
          patient:patients!bite_cases_patient_id_fkey(*),
          clinical_orders(*)
        )
      `
      )
      .order('scheduled_date', { ascending: true });

    if (query.case_id) {
      dbQuery = dbQuery.eq('case_id', query.case_id);
    }

    if (query.status && query.status !== 'ALL') {
      dbQuery = dbQuery.eq('status', query.status);
    }

    if (query.dose_number && query.dose_number !== 'ALL') {
      dbQuery = dbQuery.eq('dose_number', query.dose_number);
    }

    if (query.date) {
      dbQuery = dbQuery.eq('scheduled_date', query.date);
    }

    const branchId =
      user.role === ROLES.ADMIN
        ? query.branch_id || tenant?.branchId || null
        : query.cross_branch === 'true'
          ? null
          : user.branch_id || tenant?.branchId;

    if (branchId && !query.case_id) {
      dbQuery = dbQuery.eq('branch_id', branchId);
    }

    const { data, error } = await dbQuery.limit(Number(query.limit) || 200);
    if (error) {
      throw new AppError(`Failed to load PEP schedules: ${error.message}`, 500);
    }

    const mapped = (data || []).map((row) => {
      if (row.bite_case?.patient) {
        row.bite_case.patient = decryptPatientPII(row.bite_case.patient);
      }
      return row;
    });

    if (user.role === ROLES.PATIENT) {
      return mapped.filter((row) => row.bite_case?.patient?.profile_id === user.id);
    }

    const search = (query.search || '').trim().toLowerCase();
    if (!search) return mapped;

    return mapped.filter((row) => {
      const p = row.bite_case?.patient || {};
      return [p.full_name, p.qr_code_hash, p.phone, p.barangay, row.dose_number].some(
        (v) => typeof v === 'string' && v.toLowerCase().includes(search)
      );
    });
  }

  /**
   * Records nurse administration of a scheduled PEP dose (Day 0, Day 3, Day 7, Day 14, Day 28).
   * Automatically triggers PostgreSQL `trg_pep_schedules_deduct_inventory` to deduct stock
   * and updates the parent visit's live status to `Completed`.
   */
  static async administerDose({ user, tenant, scheduleId, payload }) {
    const { data: schedule, error: fetchErr } = await supabaseAdmin
      .from('pep_schedules')
      .select('*, bite_case:bite_cases!pep_schedules_case_id_fkey(*)')
      .eq('id', scheduleId)
      .maybeSingle();

    if (fetchErr || !schedule) {
      throw new AppError('PEP schedule dose not found.', 404);
    }

    if (schedule.status === 'completed') {
      throw new AppError(`${schedule.dose_number} has already been marked as administered.`, 400);
    }

    const administeringBranchId =
      user.role === ROLES.ADMIN
        ? payload.administered_branch_id || tenant?.branchId || schedule.branch_id
        : user.branch_id || tenant?.branchId || schedule.branch_id;

    // Resolve anti-rabies inventory batch if not explicitly passed
    let inventoryBatchId = payload.inventory_batch_id || null;
    if (!inventoryBatchId) {
      const todayStr = new Date().toISOString().slice(0, 10);
      const { data: autoBatch } = await supabaseAdmin
        .from('vaccine_inventory')
        .select('id')
        .eq('branch_id', administeringBranchId)
        .eq('item_type', 'anti_rabies')
        .gte('expiration_date', todayStr)
        .gte('quantity_remaining', payload.doses_deducted || 1)
        .order('expiration_date', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (!autoBatch) {
        throw new AppError(
          'No active anti-rabies vaccine batch with sufficient stock found for this branch. Please select an inventory batch.',
          400
        );
      }
      inventoryBatchId = autoBatch.id;
    }

    const now = new Date().toISOString();

    const { data: updatedSchedule, error: updateErr } = await supabaseAdmin
      .from('pep_schedules')
      .update({
        status: 'completed',
        administered_date: now,
        nurse_id: user.id,
        administered_branch_id: administeringBranchId,
        inventory_batch_id: inventoryBatchId,
        erig_inventory_batch_id: payload.erig_inventory_batch_id || null,
        tetanus_inventory_batch_id: payload.tetanus_inventory_batch_id || null,
        doses_deducted: payload.doses_deducted || 1,
      })
      .eq('id', scheduleId)
      .select(
        `
        *,
        nurse:profiles!pep_schedules_nurse_id_fkey(id, full_name),
        inventory:vaccine_inventory!pep_schedules_inventory_batch_id_fkey(id, vaccine_name, batch_number, lot_number)
      `
      )
      .single();

    if (updateErr) {
      throw new AppError(`Failed to record dose administration: ${updateErr.message}`, 400);
    }

    // Check remaining scheduled doses for this case
    const { data: allCaseDoses } = await supabaseAdmin
      .from('pep_schedules')
      .select('id, dose_number, status')
      .eq('case_id', schedule.case_id);

    const allCompleted =
      Array.isArray(allCaseDoses) &&
      allCaseDoses.length > 0 &&
      allCaseDoses.every((d) => d.status === 'completed');

    const biteCase = schedule.bite_case;
    if (biteCase) {
      const prevCtx = biteCase.clinical_context || {};
      const adminHistory = Array.isArray(prevCtx.administration_logs)
        ? prevCtx.administration_logs
        : [];

      const nextCtx = {
        ...prevCtx,
        visit_status: 'Completed',
        completed_at: now,
        last_administered_dose: schedule.dose_number,
        last_administered_at: now,
        administration_logs: [
          ...adminHistory,
          {
            schedule_id: schedule.id,
            dose_number: schedule.dose_number,
            administered_at: now,
            nurse_id: user.id,
            nurse_name: user.full_name,
            branch_id: administeringBranchId,
            inventory_batch_id: inventoryBatchId,
            erig_administered: Boolean(payload.erig_administered || payload.erig_inventory_batch_id),
            tetanus_administered: Boolean(
              payload.tetanus_administered || payload.tetanus_inventory_batch_id
            ),
            injection_site: payload.injection_site || 'Both deltoids (ID/IM)',
            notes: payload.administration_notes || '',
          },
        ],
      };

      const caseUpdate = {
        clinical_context: nextCtx,
        ...(payload.adverse_reactions
          ? { adverse_reactions: payload.adverse_reactions }
          : {}),
        ...(allCompleted
          ? {
              status: 'completed',
              certificate_code:
                biteCase.certificate_code ||
                `CERT-VABC-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
              certificate_signed_at: now,
            }
          : {}),
      };

      await supabaseAdmin.from('bite_cases').update(caseUpdate).eq('id', biteCase.id);
    }

    return updatedSchedule;
  }

  /**
   * Reschedules a pending PEP dose with a clinical reason.
   */
  static async rescheduleDose({ user, scheduleId, payload }) {
    const { data, error } = await supabaseAdmin
      .from('pep_schedules')
      .update({
        scheduled_date: payload.scheduled_date,
        reschedule_reason: payload.reschedule_reason,
        rescheduled_by: user.id,
        status: 'rescheduled',
      })
      .eq('id', scheduleId)
      .select('*')
      .single();

    if (error) {
      throw new AppError(`Failed to reschedule dose: ${error.message}`, 400);
    }

    return data;
  }
}
