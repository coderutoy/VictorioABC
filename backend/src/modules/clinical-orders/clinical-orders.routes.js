import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole, ROLES } from '../../middleware/rbac.middleware.js';
import { enforceTenantScope } from '../../middleware/tenant.middleware.js';
import { getClinicalOrdersHealth } from './clinical-orders.controller.js';

const router = Router();

router.use(authenticate);
router.use(requireRole(ROLES.NURSE, ROLES.DOCTOR, ROLES.ADMIN));
router.use(enforceTenantScope({ allowPatientSelf: false }));

router.get('/health', getClinicalOrdersHealth);

export default router;
