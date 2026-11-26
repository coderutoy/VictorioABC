import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole, ROLES } from '../../middleware/rbac.middleware.js';
import { enforceTenantScope } from '../../middleware/tenant.middleware.js';
import {
  getPatientsHealth,
  listPatients,
  getPatientById,
  getPatientByQrCode,
  createPatient,
  updatePatient,
} from './patients.controller.js';

const router = Router();

router.use(authenticate);
router.use(requireRole(ROLES.PATIENT, ROLES.NURSE, ROLES.DOCTOR, ROLES.ADMIN));
router.use(enforceTenantScope({ allowPatientSelf: true }));

router.get('/health', getPatientsHealth);
router.get('/qr/:qrCode', requireRole(ROLES.NURSE, ROLES.DOCTOR, ROLES.ADMIN), getPatientByQrCode);
router.get('/', listPatients);
router.get('/:id', getPatientById);
router.post('/', createPatient);
router.put('/:id', updatePatient);
router.patch('/:id', updatePatient);

export default router;
