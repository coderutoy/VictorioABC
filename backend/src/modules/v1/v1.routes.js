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
import {
  getAdminCommandCenter,
  executeRebalanceTransfer,
  getDoctorWorkspace,
  verifyAiSubmission,
  submitDoctorDosingSignoff,
  createAefiReport,
  getNurseWorkspace,
  openReconstitutedVial,
  administerNurseFefoDose,
  logColdChainTemperature,
  logDefaulterCall,
  getLiveNotifications,
  updateProfilePreferences,
} from './intelligence.controller.js';

const router = Router();

// Public health & auth routes
router.get('/health', getHealth);
router.post('/auth/login', loginWithBranchLock);
router.post('/auth/verify-branch', authenticate, verifyBranchSession);
router.get('/auth/me', authenticate, getAuthMe);

// Phase 2.3 Intelligent Role Workspaces & Notifications
router.get('/admin/command-center', authenticate, requireAdmin, getAdminCommandCenter);
router.post('/admin/rebalance-transfer', authenticate, requireAdmin, executeRebalanceTransfer);

router.get('/doctor/workspace', authenticate, getDoctorWorkspace);
router.post('/doctor/ai-verify', authenticate, verifyAiSubmission);
router.post('/doctor/dosing-signoff', authenticate, submitDoctorDosingSignoff);
router.post('/doctor/aefi', authenticate, createAefiReport);

router.get('/nurse/workspace', authenticate, getNurseWorkspace);
router.post('/nurse/vials/open', authenticate, openReconstitutedVial);
router.post('/nurse/doses/administer', authenticate, administerNurseFefoDose);
router.post('/nurse/cold-chain', authenticate, logColdChainTemperature);
router.post('/nurse/defaulters/call', authenticate, logDefaulterCall);

router.get('/notifications', authenticate, getLiveNotifications);
router.patch('/profile/preferences', authenticate, updateProfilePreferences);

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
