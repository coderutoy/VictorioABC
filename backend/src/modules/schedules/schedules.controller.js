import { asyncHandler } from '../../middleware/error.middleware.js';
import { SchedulesService } from './schedules.service.js';

export const getSchedulesHealth = asyncHandler(async (req, res) => {
  const data = await SchedulesService.getModuleStatus(req.tenant);
  res.json({ success: true, data });
});
