import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth, ROLES, STAFF_ROLES, getRoleHome } from '../../context/AuthContext';
import { useBranch } from '../../context/BranchContext';
import { Spinner } from '../ui/Spinner';

/**
 * Strict role and active-branch route guard:
 * - While Supabase session is being verified -> loading spinner.
 * - Patients are never allowed into any staff route -> /mobile-app-only.
 * - Unauthenticated visitors -> /login.
 * - If role is `doctor` or `nurse` and `profile.branch_id !== activeBranch.id`:
 *   immediately calls `signOut()`, clears auth state, and redirects to `/login`
 *   (never renders the dashboard or stale branch data, not even briefly).
 * - Authenticated users outside `allowedRoles` are sent to their own role dashboard.
 */
export function ProtectedRoute({ allowedRoles = STAFF_ROLES }) {
  const { isAuthenticated, profile, role, loading, signOut } = useAuth();
  const { activeBranch } = useBranch();
  const location = useLocation();

  const isBranchLockedRole = role === ROLES.DOCTOR || role === ROLES.NURSE;
  const isBranchMismatch =
    Boolean(isAuthenticated && isBranchLockedRole) &&
    profile?.branch_id !== activeBranch?.id;

  useEffect(() => {
    if (isBranchMismatch) {
      signOut();
    }
  }, [isBranchMismatch, signOut]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F2F2ED]">
        <Spinner size="lg" label="Verifying clinical session..." />
      </div>
    );
  }

  if (role === ROLES.PATIENT) {
    return <Navigate to={getRoleHome(ROLES.PATIENT)} replace />;
  }

  if (!isAuthenticated || isBranchMismatch) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!allowedRoles.includes(role)) {
    return <Navigate to={getRoleHome(role)} replace />;
  }

  return <Outlet />;
}

/** `/dashboard` -> the signed-in user's own role dashboard. */
export function DashboardRedirect() {
  const { role } = useAuth();
  return <Navigate to={getRoleHome(role)} replace />;
}
