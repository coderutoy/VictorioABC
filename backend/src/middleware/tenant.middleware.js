import { AppError } from './error.middleware.js';
import { ROLES } from './rbac.middleware.js';

/**
 * Enforces branch_id tenant isolation:
 * - Central Admin ('admin'): bypasses branch lock; optionally filters by query/body branch_id
 * - Nurse / Doctor: strictly locked to req.user.branch_id; rejects cross-branch mutation attempts
 * - Patient: allowed only on routes setting { allowPatientSelf: true }
 */
export function enforceTenantScope({ allowPatientSelf = false } = {}) {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    const { role, branch_id: assignedBranchId, id: userId } = req.user;

    // 1. Central Admin — global HQ visibility across all branches
    if (role === ROLES.ADMIN) {
      const requestedBranch = req.query.branch_id || req.body?.branch_id || null;
      req.tenant = {
        isGlobalAdmin: true,
        branchId: requestedBranch,
      };
      return next();
    }

    // 2. Branch Clinical Staff (Nurse & Doctor)
    if (role === ROLES.NURSE || role === ROLES.DOCTOR) {
      if (!assignedBranchId) {
        return next(new AppError('Clinical staff account has no assigned branch_id.', 403));
      }

      const payloadBranchId = req.body?.branch_id || req.params?.branchId;
      if (payloadBranchId && payloadBranchId !== assignedBranchId) {
        return next(
          new AppError('Tenant isolation violation: cannot mutate another branch workspace.', 403)
        );
      }

      req.tenant = {
        isGlobalAdmin: false,
        branchId: assignedBranchId,
      };
      return next();
    }

    // 3. Patient Mobile Account
    if (role === ROLES.PATIENT) {
      if (!allowPatientSelf) {
        return next(new AppError('Patients cannot access clinic tenant endpoints.', 403));
      }
      req.tenant = {
        isGlobalAdmin: false,
        branchId: null,
        patientProfileId: userId,
      };
      return next();
    }

    return next(new AppError('Unrecognized role for tenant scoping.', 403));
  };
}
