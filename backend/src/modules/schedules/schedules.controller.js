import { z } from 'zod';
import { asyncHandler } from '../../middleware/error.middleware.js';
import { SchedulesService } from './schedules.service.js';

const administerDoseSchema = z.object({
  inventory_batch_id: z.string().uuid().optional().nullable(),
  erig_inventory_batch_id: z.string().uuid().optional().nullable(),
  tetanus_inventory_batch_id: z.string().uuid().optional().nullable(),
  administered_branch_id: z.string().uuid().optional().nullable(),
  doses_deducted: z.number().int().positive().optional().default(1),
  erig_administered: z.boolean().optional(),
  tetanus_administered: z.boolean().optional(),
  injection_site: z.string().optional().nullable(),
  administration_notes: z.string().optional().nullable(),
  adverse_reactions: z.string().optional().nullable(),
});

const rescheduleDoseSchema = z.object({
  scheduled_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'scheduled_date must be YYYY-MM-DD'),
  reschedule_reason: z.string().min(3, 'Please specify a reschedule reason'),
});

export const getSchedulesHealth = asyncHandler(async (req, res) => {
  const data = await SchedulesService.getModuleStatus(req.tenant);
  res.json({ success: true, data });
});

export const listSchedules = asyncHandler(async (req, res) => {
  const data = await SchedulesService.listSchedules({
    user: req.user,
    tenant: req.tenant,
    query: req.query,
  });
  res.json({ success: true, data });
});

export const administerDose = asyncHandler(async (req, res) => {
  const payload = administerDoseSchema.parse(req.body);
  const data = await SchedulesService.administerDose({
    user: req.user,
    tenant: req.tenant,
    scheduleId: req.params.id,
    payload,
  });
  res.json({ success: true, data });
});

export const rescheduleDose = asyncHandler(async (req, res) => {
  const payload = rescheduleDoseSchema.parse(req.body);
  const data = await SchedulesService.rescheduleDose({
    user: req.user,
    scheduleId: req.params.id,
    payload,
  });
  res.json({ success: true, data });
});
