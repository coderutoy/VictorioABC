import { asyncHandler } from '../../middleware/error.middleware.js';
import { ClinicalOrdersService } from './clinical-orders.service.js';

export const getClinicalOrdersHealth = asyncHandler(async (req, res) => {
  const data = await ClinicalOrdersService.getModuleStatus(req.tenant);
  res.json({ success: true, data });
});
