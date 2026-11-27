import { Router } from 'express';
import { authenticate, requireAdmin } from '../../../middleware/auth.js';
import {
  loginWithBranchLock,
  verifyBranchSession,
} from '../auth/auth.controller.js';
import {
  getHealth,
  getAuthMe,
  getDashboardSummary,
  listPatients,
  createPatient,
  updatePatient,
  listCases,
  createCase,
  updateCase,
  listDoses,
  administerDose,
  missOrRescheduleDose,
  listInventory,
  createInventoryBatch,
  updateInventoryBatch,
  deleteInventoryBatch,
  listAdminStaff,
  createAdminStaff,
  updateAdminStaff,
} from './v1.controller.js';

const router = Router();

// Public health & auth routes
router.get('/health', getHealth);
router.post('/auth/login', loginWithBranchLock);
router.post('/auth/verify-branch', authenticate, verifyBranchSession);
router.get('/auth/me', authenticate, getAuthMe);

// Dashboard Summary
router.get('/dashboard/summary', authenticate, getDashboardSummary);

// Patients CRUD (AES-256-GCM Encrypted PII)
router.get('/patients', authenticate, listPatients);
router.post('/patients', authenticate, createPatient);
router.patch('/patients/:id', authenticate, updatePatient);

// Clinical Cases CRUD (Nurse Triage -> Doctor WHO Cat I-III Assessment + Auto PEP Generation)
router.get('/cases', authenticate, listCases);
router.post('/cases', authenticate, createCase);
router.patch('/cases/:id', authenticate, updateCase);

// PEP Doses CRUD (Nurse Dose Administration & Inventory Deduction)
router.get('/doses', authenticate, listDoses);
router.patch('/doses/:id/administer', authenticate, administerDose);
router.post('/doses/:id/administer', authenticate, administerDose);
router.patch('/doses/:id/miss', authenticate, missOrRescheduleDose);

// Vaccine & Biologics Inventory CRUD
router.get('/inventory', authenticate, listInventory);
router.post('/inventory', authenticate, createInventoryBatch);
router.patch('/inventory/:id', authenticate, updateInventoryBatch);
router.delete('/inventory/:id', authenticate, requireAdmin, deleteInventoryBatch);

// Admin Staff Management (Admin Role Only)
router.get('/admin/staff', authenticate, requireAdmin, listAdminStaff);
router.post('/admin/staff', authenticate, requireAdmin, createAdminStaff);
router.patch('/admin/staff/:id', authenticate, requireAdmin, updateAdminStaff);

export default router;
