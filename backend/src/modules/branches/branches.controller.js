import { asyncHandler } from '../../middleware/error.middleware.js';
import { BranchesService } from './branches.service.js';

export const getBranchesHealth = asyncHandler(async (req, res) => {
  const data = await BranchesService.getModuleStatus(req.tenant);
  res.json({ success: true, data });
});

export const listBranches = asyncHandler(async (req, res) => {
  const data = await BranchesService.listBranches(req.user);
  res.json({ success: true, data });
});
