import { z } from 'zod';
import { asyncHandler } from '../../middleware/error.middleware.js';
import { PatientsService } from './patients.service.js';
import { TriageService } from '../triage/triage.service.js';

const createPatientSchema = z.object({
  full_name: z.string().min(2, 'Full name is required'),
  phone: z.string().optional().nullable(),
  birthdate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Birthdate must be YYYY-MM-DD'),
  gender: z.enum(['male', 'female', 'other']),
  address: z.string().min(3, 'Street/house address is required'),
  barangay: z.string().min(2, 'Barangay is required'),
  municipality: z.string().optional().default('San Jose del Monte'),
  government_id: z.string().optional().nullable(),
  registered_branch_id: z.string().uuid().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  check_in_now: z.boolean().optional().default(false),
  chief_complaint: z.string().optional().nullable(),
});

const updatePatientSchema = createPatientSchema.partial();

export const getPatientsHealth = asyncHandler(async (req, res) => {
  const data = await PatientsService.getModuleStatus(req.tenant);
  res.json({ success: true, data });
});

export const listPatients = asyncHandler(async (req, res) => {
  const data = await PatientsService.listPatients({
    user: req.user,
    tenant: req.tenant,
    query: req.query,
  });
  res.json({ success: true, data });
});

export const getPatientById = asyncHandler(async (req, res) => {
  const data = await PatientsService.getPatientById({
    user: req.user,
    patientId: req.params.id,
  });
  res.json({ success: true, data });
});

export const getPatientByQrCode = asyncHandler(async (req, res) => {
  const data = await PatientsService.getPatientByQrCode({
    qrCode: req.params.qrCode,
  });
  res.json({ success: true, data });
});

export const createPatient = asyncHandler(async (req, res) => {
  const payload = createPatientSchema.parse(req.body);
  const patient = await PatientsService.createPatient({
    user: req.user,
    tenant: req.tenant,
    payload,
  });

  let checkInCase = null;
  if (payload.check_in_now) {
    checkInCase = await TriageService.checkInPatient({
      user: req.user,
      tenant: req.tenant,
      payload: {
        patient_id: patient.id,
        branch_id: patient.registered_branch_id,
        chief_complaint: payload.chief_complaint || 'New walk-in patient intake',
      },
    });
  }

  res.status(201).json({
    success: true,
    data: patient,
    check_in: checkInCase,
  });
});

export const updatePatient = asyncHandler(async (req, res) => {
  const payload = updatePatientSchema.parse(req.body);
  const data = await PatientsService.updatePatient({
    user: req.user,
    tenant: req.tenant,
    patientId: req.params.id,
    payload,
  });
  res.json({ success: true, data });
});
