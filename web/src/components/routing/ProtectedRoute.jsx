import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth, ROLES, STAFF_ROLES, getRoleHome } from '../../context/AuthContext';
import { BufferLoader } from '../ui/BufferLoader';

/**
 * Strict role and branch-locked route guard for `/dashboard/*`:
 * - While Supabase session is being verified or buffer transition is active -> BufferLoader.
 * - Patients are never allowed into any staff route -> /mobile-app-only.
 * - Unauthenticated visitors -> /login.
 * - Authenticated users outside `allowedRoles` are sent to their own role dashboard.
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

  if (role === ROLES.PATIENT) {
    return <Navigate to={getRoleHome(ROLES.PATIENT)} replace />;
  }

  if (!isAuthenticated) {
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
