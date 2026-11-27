import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import {
  loginWithBranchLock,
  verifyBranchSession,
} from './auth.controller.js';

const router = Router();

router.post('/login', loginWithBranchLock);
router.post('/verify-branch', authenticate, verifyBranchSession);

export default router;
