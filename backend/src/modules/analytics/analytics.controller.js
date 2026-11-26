import { asyncHandler } from '../../middleware/error.middleware.js';
import { AnalyticsService } from './analytics.service.js';

export const getAnalyticsHealth = asyncHandler(async (req, res) => {
  const data = await AnalyticsService.getModuleStatus(req.tenant);
  res.json({ success: true, data });
});
