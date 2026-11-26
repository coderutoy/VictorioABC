import crypto from 'node:crypto';
import { supabaseAdmin } from '../../config/supabase.js';
import { AppError } from '../../middleware/error.middleware.js';
import { ROLES } from '../../middleware/rbac.middleware.js';
import { encryptPatientPII, decryptPatientPII } from '../../utils/crypto.js';
import { deriveVisitStatus } from '../triage/triage.service.js';

function generateQrToken() {
  return `VABC-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
}

export class PatientsService {
  static async getModuleStatus(tenant) {
    return {
      module: 'patients',
      tenant,
      ready: true,
    };
  }

  static async resolveDefaultBranchId(user, tenant, requestedBranchId) {
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
   * Lists and searches patients across branches with AES-256-GCM decryption of PII fields.
   */
  static async listPatients({ user, tenant, query = {} }) {
    let dbQuery = supabaseAdmin
      .from('patients')
      .select(
        `
        id,
        profile_id,
        registered_branch_id,
        qr_code_hash,
        full_name,
        phone,
        birthdate,
        gender,
        address,
        barangay,
        municipality,
        latitude,
        longitude,
        created_at,
        updated_at,
        registered_branch:branches!patients_registered_branch_id_fkey(id, name, barangay),
        bite_cases(
          id,
          branch_id,
          exposure_date,
          animal_type,
          animal_status,
          bite_site,
          ai_suggested_category,
          doctor_validated_category,
          status,
          clinical_context,
          created_at
        )
      `
      )
      .order('created_at', { ascending: false });

    if (user.role === ROLES.PATIENT) {
      dbQuery = dbQuery.eq('profile_id', user.id);
    } else {
      const filterBranchId = query.branch_id || (query.scope === 'branch' ? tenant?.branchId : null);
      if (filterBranchId) {
        dbQuery = dbQuery.eq('registered_branch_id', filterBranchId);
      }
      if (query.barangay) {
        dbQuery = dbQuery.ilike('barangay', `%${query.barangay.trim()}%`);
      }
    }

    const { data, error } = await dbQuery.limit(Number(query.limit) || 200);
    if (error) {
      throw new AppError(`Failed to load patients: ${error.message}`, 500);
    }

    const decryptedList = (data || []).map((row) => {
      const decrypted = decryptPatientPII(row);
      const cases = Array.isArray(decrypted.bite_cases)
        ? [...decrypted.bite_cases].sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )
        : [];
      const latestCase = cases[0] || null;
      return {
        ...decrypted,
        latest_case: latestCase
          ? {
              ...latestCase,
              visit_status: deriveVisitStatus(latestCase),
            }
          : null,
        total_cases: cases.length,
      };
    });

    const search = (query.search || '').trim().toLowerCase();
    if (!search) {
      return decryptedList;
    }

    return decryptedList.filter((p) => {
      const fields = [
        p.full_name,
        p.qr_code_hash,
        p.phone,
        p.address,
        p.barangay,
        p.municipality,
        p.government_id,
      ];
      return fields.some((val) => typeof val === 'string' && val.toLowerCase().includes(search));
    });
  }

  /**
   * Retrieves a single patient by ID along with their episode history, clinical orders, and PEP schedules.
   */
  static async getPatientById({ user, patientId }) {
    const { data, error } = await supabaseAdmin
      .from('patients')
      .select(
        `
        *,
        registered_branch:branches!patients_registered_branch_id_fkey(id, name, barangay, municipality),
        bite_cases(
          *,
          branch:branches!bite_cases_branch_id_fkey(id, name, barangay),
          doctor:profiles!bite_cases_doctor_id_fkey(id, full_name, license_number),
          clinical_orders(*),
          pep_schedules(*)
        )
      `
      )
      .eq('id', patientId)
      .maybeSingle();

    if (error) {
      throw new AppError(`Failed to fetch patient: ${error.message}`, 500);
    }
    if (!data) {
      throw new AppError('Patient not found.', 404);
    }

    if (user.role === ROLES.PATIENT && data.profile_id !== user.id) {
      throw new AppError('Forbidden: You can only view your own patient record.', 403);
    }

    const decrypted = decryptPatientPII(data);
    decrypted.bite_cases = (decrypted.bite_cases || [])
      .map((c) => ({
        ...c,
        visit_status: deriveVisitStatus(c),
        pep_schedules: (c.pep_schedules || []).sort(
          (a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime()
        ),
      }))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return decrypted;
  }

  /**
   * Looks up a patient by QR code hash/token for Reception & Nurse QR Check-In.
   */
  static async getPatientByQrCode({ qrCode }) {
    const cleaned = (qrCode || '').trim();
    if (!cleaned) {
      throw new AppError('QR code token is required.', 400);
    }

    const { data, error } = await supabaseAdmin
      .from('patients')
      .select(
        `
        *,
        registered_branch:branches!patients_registered_branch_id_fkey(id, name, barangay, municipality),
        bite_cases(
          *,
          branch:branches!bite_cases_branch_id_fkey(id, name, barangay),
          doctor:profiles!bite_cases_doctor_id_fkey(id, full_name, license_number),
          clinical_orders(*),
          pep_schedules(*)
        )
      `
      )
      .ilike('qr_code_hash', cleaned)
      .maybeSingle();

    if (error) {
      throw new AppError(`QR lookup failed: ${error.message}`, 500);
    }
    if (!data) {
      throw new AppError(`No patient found matching QR token "${cleaned}".`, 404);
    }

    const decrypted = decryptPatientPII(data);
    decrypted.bite_cases = (decrypted.bite_cases || [])
      .map((c) => ({
        ...c,
        visit_status: deriveVisitStatus(c),
        pep_schedules: (c.pep_schedules || []).sort(
          (a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime()
        ),
      }))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return decrypted;
  }

  /**
   * Registers a new patient, encrypting PII (phone, address, government_id) via AES-256-GCM
   * and generating a unique QR token.
   */
  static async createPatient({ user, tenant, payload }) {
    const registeredBranchId = await this.resolveDefaultBranchId(
      user,
      tenant,
      payload.registered_branch_id
    );

    if (
      (user.role === ROLES.NURSE || user.role === ROLES.DOCTOR) &&
      payload.registered_branch_id &&
      payload.registered_branch_id !== user.branch_id
    ) {
      throw new AppError('Cannot register patient under a different branch.', 403);
    }

    const qrToken = payload.qr_code_hash?.trim() || generateQrToken();

    const encryptedPii = encryptPatientPII({
      phone: payload.phone || null,
      address: payload.address,
      government_id: payload.government_id || null,
    });

    const insertPayload = {
      profile_id: user.role === ROLES.PATIENT ? user.id : payload.profile_id || null,
      registered_branch_id: registeredBranchId,
      qr_code_hash: qrToken,
      full_name: payload.full_name.trim(),
      phone: encryptedPii.phone || null,
      birthdate: payload.birthdate,
      gender: payload.gender,
      address: encryptedPii.address,
      barangay: payload.barangay.trim(),
      municipality: (payload.municipality || 'San Jose del Monte').trim(),
      latitude: payload.latitude ?? null,
      longitude: payload.longitude ?? null,
    };

    const { data, error } = await supabaseAdmin
      .from('patients')
      .insert(insertPayload)
      .select(
        `
        *,
        registered_branch:branches!patients_registered_branch_id_fkey(id, name, barangay)
      `
      )
      .single();

    if (error) {
      throw new AppError(`Failed to register patient: ${error.message}`, 400);
    }

    await supabaseAdmin.from('audit_logs').insert({
      branch_id: registeredBranchId,
      actor_id: user.id,
      action: 'PATIENT_REGISTERED',
      entity_type: 'patients',
      entity_id: data.id,
      metadata: {
        qr_code_hash: data.qr_code_hash,
        barangay: data.barangay,
        municipality: data.municipality,
        pii_encrypted: true,
      },
    });

    return decryptPatientPII(data);
  }

  /**
   * Updates an existing patient profile, re-encrypting modified PII fields via AES-256-GCM.
   */
  static async updatePatient({ user, tenant, patientId, payload }) {
    const existing = await this.getPatientById({ user, patientId });

    if (user.role === ROLES.PATIENT && existing.profile_id !== user.id) {
      throw new AppError('Forbidden: Cannot update another patient profile.', 403);
    }

    const nextAddress = payload.address !== undefined ? payload.address : existing.address;
    const nextPhone = payload.phone !== undefined ? payload.phone : existing.phone;
    const nextGovId =
      payload.government_id !== undefined ? payload.government_id : existing.government_id;

    const encryptedPii = encryptPatientPII({
      phone: nextPhone || null,
      address: nextAddress,
      government_id: nextGovId || null,
    });

    const updatePayload = {
      ...(payload.full_name !== undefined ? { full_name: payload.full_name.trim() } : {}),
      ...(payload.birthdate !== undefined ? { birthdate: payload.birthdate } : {}),
      ...(payload.gender !== undefined ? { gender: payload.gender } : {}),
      ...(payload.barangay !== undefined ? { barangay: payload.barangay.trim() } : {}),
      ...(payload.municipality !== undefined
        ? { municipality: payload.municipality.trim() }
        : {}),
      ...(payload.latitude !== undefined ? { latitude: payload.latitude } : {}),
      ...(payload.longitude !== undefined ? { longitude: payload.longitude } : {}),
      ...(user.role === ROLES.ADMIN && payload.registered_branch_id !== undefined
        ? { registered_branch_id: payload.registered_branch_id }
        : {}),
      phone: encryptedPii.phone || null,
      address: encryptedPii.address,
    };

    const { data, error } = await supabaseAdmin
      .from('patients')
      .update(updatePayload)
      .eq('id', patientId)
      .select(
        `
        *,
        registered_branch:branches!patients_registered_branch_id_fkey(id, name, barangay)
      `
      )
      .single();

    if (error) {
      throw new AppError(`Failed to update patient: ${error.message}`, 400);
    }

    await supabaseAdmin.from('audit_logs').insert({
      branch_id: tenant?.branchId || existing.registered_branch_id,
      actor_id: user.id,
      action: 'PATIENT_UPDATED',
      entity_type: 'patients',
      entity_id: data.id,
      metadata: {
        qr_code_hash: data.qr_code_hash,
        pii_encrypted: true,
      },
    });

    return decryptPatientPII(data);
  }
}
