import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole, ROLES } from '../../middleware/rbac.middleware.js';
import { enforceTenantScope } from '../../middleware/tenant.middleware.js';
import {
  getSchedulesHealth,
  listSchedules,
  administerDose,
  rescheduleDose,
} from './schedules.controller.js';

const router = Router();

router.use(authenticate);
router.use(requireRole(ROLES.PATIENT, ROLES.NURSE, ROLES.DOCTOR, ROLES.ADMIN));
router.use(enforceTenantScope({ allowPatientSelf: true }));

router.get('/health', getSchedulesHealth);
router.get('/', listSchedules);
router.post(
  '/:id/administer',
  requireRole(ROLES.NURSE, ROLES.DOCTOR, ROLES.ADMIN),
  administerDose
);
router.patch(
  '/:id/reschedule',
  requireRole(ROLES.NURSE, ROLES.DOCTOR, ROLES.ADMIN),
  rescheduleDose
);

export default router;
