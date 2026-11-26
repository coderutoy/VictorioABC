import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole, ROLES } from '../../middleware/rbac.middleware.js';
import { enforceTenantScope } from '../../middleware/tenant.middleware.js';
import { getTriageHealth } from './triage.controller.js';

const router = Router();

router.use(authenticate);
router.use(requireRole(ROLES.PATIENT, ROLES.NURSE, ROLES.DOCTOR, ROLES.ADMIN));
router.use(enforceTenantScope({ allowPatientSelf: true }));

router.get('/health', getTriageHealth);

export default router;
