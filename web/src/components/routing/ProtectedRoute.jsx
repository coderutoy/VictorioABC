import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth, STAFF_ROLES, getRoleHome } from '../../context/AuthContext';
import { BufferLoader } from '../ui/BufferLoader';

/**
 * Strict role and branch-locked route guard for `/dashboard/*`:
 * - While Supabase session is being verified or buffer transition is active -> BufferLoader.
 * - Unauthenticated visitors or non-staff accounts -> /staff-login.
 * - Authenticated staff users outside `allowedRoles` are sent to their own role dashboard.
 */
export function ProtectedRoute({ allowedRoles = STAFF_ROLES }) {
  const { isAuthenticated, role, loading, bufferMessage, isDark } = useAuth();
  const location = useLocation();

  if (loading || bufferMessage) {
    return (
      <BufferLoader
        message={bufferMessage || 'Loading clinical workspace...'}
        isDark={isDark}
      />
    );
  }

  if (!isAuthenticated || !STAFF_ROLES.includes(role)) {
    return <Navigate to="/staff-login" replace state={{ from: location }} />;
  }

  if (!allowedRoles.includes(role)) {
    return <Navigate to={getRoleHome(role)} replace />;
  }

  return <Outlet />;
}

/** `/dashboard` -> the signed-in staff member's own role dashboard. */
export function DashboardRedirect() {
  const { role } = useAuth();
  return <Navigate to={getRoleHome(role)} replace />;
}
