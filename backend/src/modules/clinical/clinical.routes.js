import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole, ROLES } from '../../middleware/rbac.middleware.js';
import {
  getClinicalOverview,
  upsertVaccineStock,
  createWalkInIntake,
  forwardCaseToDoctor,
  submitDoctorAssessment,
  markDoseAdministered,
} from './clinical.controller.js';

const router = Router();

router.use(authenticate);
router.use(requireRole(ROLES.ADMIN, ROLES.DOCTOR, ROLES.NURSE));

router.get('/overview', getClinicalOverview);
router.post('/inventory', upsertVaccineStock);
router.post('/intake', createWalkInIntake);
router.patch('/cases/:id/forward-doctor', forwardCaseToDoctor);
router.post('/cases/:id/assess', submitDoctorAssessment);
router.post('/doses/:id/administer', markDoseAdministered);

export default router;
