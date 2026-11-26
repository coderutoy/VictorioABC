import { asyncHandler } from '../../middleware/error.middleware.js';
import { TriageService } from './triage.service.js';

export const getTriageHealth = asyncHandler(async (req, res) => {
  const data = await TriageService.getModuleStatus(req.tenant);
  res.json({ success: true, data });
});
