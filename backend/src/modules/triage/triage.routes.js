import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole, ROLES } from '../../middleware/rbac.middleware.js';
import { enforceTenantScope } from '../../middleware/tenant.middleware.js';
import {
  getTriageHealth,
  listTriageQueue,
  checkInPatient,
  updateVisitStatus,
  saveTriageAssessment,
} from './triage.controller.js';

const router = Router();

router.use(authenticate);
router.use(requireRole(ROLES.PATIENT, ROLES.NURSE, ROLES.DOCTOR, ROLES.ADMIN));
router.use(enforceTenantScope({ allowPatientSelf: true }));

router.get('/health', getTriageHealth);
router.get('/queue', requireRole(ROLES.NURSE, ROLES.DOCTOR, ROLES.ADMIN), listTriageQueue);
router.post('/check-in', requireRole(ROLES.NURSE, ROLES.DOCTOR, ROLES.ADMIN), checkInPatient);
router.patch(
  '/cases/:id/status',
  requireRole(ROLES.NURSE, ROLES.DOCTOR, ROLES.ADMIN),
  updateVisitStatus
);
router.put(
  '/cases/:id/assessment',
  requireRole(ROLES.NURSE, ROLES.DOCTOR, ROLES.ADMIN),
  saveTriageAssessment
);

export default router;
