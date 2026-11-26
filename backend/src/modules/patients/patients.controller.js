import { asyncHandler } from '../../middleware/error.middleware.js';
import { PatientsService } from './patients.service.js';

export const getPatientsHealth = asyncHandler(async (req, res) => {
  const data = await PatientsService.getModuleStatus(req.tenant);
  res.json({ success: true, data });
});
