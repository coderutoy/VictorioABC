import { z } from 'zod';
import { asyncHandler } from '../../middleware/error.middleware.js';
import { ClinicalOrdersService } from './clinical-orders.service.js';

const createClinicalOrderSchema = z.object({
  case_id: z.string().uuid('Valid case_id is required'),
  doctor_validated_category: z.enum(['I', 'II', 'III']),
  ai_override_reason: z.string().optional().nullable(),
  regimen_type: z.enum(['ID', 'IM', 'booster']).default('ID'),
  day0_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'day0_date must be YYYY-MM-DD')
    .optional(),
  generate_pep_schedule: z.boolean().optional(),
  erig_required: z.boolean().default(false),
  immunoglobulin_type: z.enum(['ERIG', 'HRIG', 'none']).optional(),
  erig_skin_test_result: z.enum(['pending', 'negative', 'positive']).optional(),
  tetanus_required: z.boolean().default(false),
  tetanus_preparation: z.string().optional().nullable(),
  instructions: z.string().optional().nullable(),
  clinical_notes: z.string().optional().nullable(),
  adverse_reactions: z.string().optional().nullable(),
  exposure_date: z.string().optional(),
  animal_type: z.string().optional(),
  animal_status: z
    .enum(['stray', 'domestic_vaccinated', 'domestic_unvaccinated', 'unknown'])
    .optional(),
  bite_site: z.string().optional(),
  animal_observation_status: z
    .enum(['under_observation', 'alive_healthy', 'died', 'lost_stray', 'killed_tested'])
    .optional(),
  weight_kg: z.number().positive().optional().nullable(),
  wound_type: z
    .enum(['bite', 'scratch', 'lick_broken_skin', 'intact_skin_contact'])
    .optional(),
  wound_depth: z.enum(['intact', 'superficial', 'deep_transdermal']).optional(),
  bleeding: z.boolean().optional(),
  multiple_wounds: z.boolean().optional(),
  wound_washed: z.boolean().optional(),
});

export const getClinicalOrdersHealth = asyncHandler(async (req, res) => {
  const data = await ClinicalOrdersService.getModuleStatus(req.tenant);
  res.json({ success: true, data });
});

export const listClinicalOrders = asyncHandler(async (req, res) => {
  const data = await ClinicalOrdersService.listClinicalOrders({
    user: req.user,
    tenant: req.tenant,
    query: req.query,
  });
  res.json({ success: true, data });
});

export const createClinicalOrder = asyncHandler(async (req, res) => {
  const payload = createClinicalOrderSchema.parse(req.body);
  const data = await ClinicalOrdersService.createClinicalOrder({
    user: req.user,
    tenant: req.tenant,
    payload,
  });
  res.status(201).json({ success: true, data });
});
