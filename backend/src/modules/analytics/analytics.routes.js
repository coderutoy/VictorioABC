import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole, ROLES } from '../../middleware/rbac.middleware.js';
import { enforceTenantScope } from '../../middleware/tenant.middleware.js';
import { getAnalyticsHealth } from './analytics.controller.js';

const router = Router();

router.use(authenticate);
router.use(requireRole(ROLES.ADMIN));
router.use(enforceTenantScope({ allowPatientSelf: false }));

router.get('/health', getAnalyticsHealth);

export default router;
