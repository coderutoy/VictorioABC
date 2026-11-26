import { z } from 'zod';
import { asyncHandler } from '../../middleware/error.middleware.js';
import { TriageService, VISIT_STATUSES } from './triage.service.js';

const checkInSchema = z.object({
  patient_id: z.string().uuid().optional().nullable(),
  qr_code_hash: z.string().optional().nullable(),
  branch_id: z.string().uuid().optional().nullable(),
  visit_type: z.enum(['new_exposure', 'follow_up_dose']).optional().default('new_exposure'),
  visit_status: z.enum(VISIT_STATUSES).optional().default('Waiting'),
  chief_complaint: z.string().optional().nullable(),
  exposure_date: z.string().optional().nullable(),
  animal_type: z.string().optional().nullable(),
  animal_status: z
    .enum(['stray', 'domestic_vaccinated', 'domestic_unvaccinated', 'unknown'])
    .optional()
    .default('unknown'),
  bite_site: z.string().optional().nullable(),
});

const statusUpdateSchema = z.object({
  visit_status: z.enum(VISIT_STATUSES),
  notes: z.string().optional().nullable(),
});

const assessmentSchema = z.object({
  exposure_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  animal_type: z.string().min(1).optional(),
  animal_status: z
    .enum(['stray', 'domestic_vaccinated', 'domestic_unvaccinated', 'unknown'])
    .optional(),
  bite_site: z.string().min(1).optional(),
  animal_observation_status: z
    .enum(['under_observation', 'alive_healthy', 'died', 'lost_stray', 'killed_tested'])
    .optional(),
  clinical_notes: z.string().optional().nullable(),
  adverse_reactions: z.string().optional().nullable(),
  ai_suggested_category: z.enum(['I', 'II', 'III']).optional().nullable(),
  ai_confidence: z.number().min(0).max(1).optional().nullable(),
  weight_kg: z.number().positive().optional().nullable(),
  blood_pressure: z.string().optional().nullable(),
  temperature_c: z.number().optional().nullable(),
  allergies: z.string().optional().nullable(),
  wound_type: z
    .enum(['bite', 'scratch', 'lick_broken_skin', 'intact_skin_contact'])
    .optional(),
  wound_depth: z.enum(['intact', 'superficial', 'deep_transdermal']).optional(),
  bleeding: z.boolean().optional(),
  multiple_wounds: z.boolean().optional(),
  wound_washed: z.boolean().optional(),
  washed_within_15_min: z.boolean().optional(),
  antiseptic_applied: z.boolean().optional(),
  tandok_or_traditional: z.boolean().optional(),
  previous_rabies_vaccine: z.boolean().optional(),
  last_tetanus_year: z.string().optional().nullable(),
  visit_status: z.enum(VISIT_STATUSES).optional(),
});

export const getTriageHealth = asyncHandler(async (req, res) => {
  const data = await TriageService.getModuleStatus(req.tenant);
  res.json({ success: true, data });
});

export const listTriageQueue = asyncHandler(async (req, res) => {
  const data = await TriageService.listQueue({
    user: req.user,
    tenant: req.tenant,
    query: req.query,
  });
  res.json({ success: true, data });
});

export const checkInPatient = asyncHandler(async (req, res) => {
  const payload = checkInSchema.parse(req.body);
  const data = await TriageService.checkInPatient({
    user: req.user,
    tenant: req.tenant,
    payload,
  });
  res.status(201).json({ success: true, data });
});

export const updateVisitStatus = asyncHandler(async (req, res) => {
  const payload = statusUpdateSchema.parse(req.body);
  const data = await TriageService.updateVisitStatus({
    user: req.user,
    tenant: req.tenant,
    caseId: req.params.id,
    visitStatus: payload.visit_status,
    notes: payload.notes,
  });
  res.json({ success: true, data });
});

export const saveTriageAssessment = asyncHandler(async (req, res) => {
  const payload = assessmentSchema.parse(req.body);
  const data = await TriageService.saveTriageAssessment({
    user: req.user,
    tenant: req.tenant,
    caseId: req.params.id,
    payload,
  });
  res.json({ success: true, data });
});
