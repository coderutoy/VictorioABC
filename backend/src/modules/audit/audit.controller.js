import { asyncHandler } from '../../middleware/error.middleware.js';
import { AuditService } from './audit.service.js';

export const getAuditHealth = asyncHandler(async (req, res) => {
  const data = await AuditService.getModuleStatus(req.tenant);
  res.json({ success: true, data });
});
