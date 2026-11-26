import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole, ROLES } from '../../middleware/rbac.middleware.js';
import { enforceTenantScope } from '../../middleware/tenant.middleware.js';
import { getBranchesHealth, listBranches } from './branches.controller.js';

const router = Router();

router.use(authenticate);
router.use(requireRole(ROLES.PATIENT, ROLES.NURSE, ROLES.DOCTOR, ROLES.ADMIN));
router.use(enforceTenantScope({ allowPatientSelf: true }));

router.get('/health', getBranchesHealth);
router.get('/', listBranches);

export default router;
