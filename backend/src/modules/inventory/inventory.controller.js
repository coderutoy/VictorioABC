import { asyncHandler } from '../../middleware/error.middleware.js';
import { InventoryService } from './inventory.service.js';

export const getInventoryHealth = asyncHandler(async (req, res) => {
  const data = await InventoryService.getModuleStatus(req.tenant);
  res.json({ success: true, data });
});
