import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth, ROLES, STAFF_ROLES, getRoleHome } from '../../context/AuthContext';
import { Spinner } from '../ui/Spinner';

/**
 * Strict role route guard.
 * - While the Supabase session is being verified → loading spinner.
 * - Patients are never allowed into any staff route → /mobile-app-only.
 * - Unauthenticated visitors → /login.
 * - Authenticated users outside `allowedRoles` are sent to their OWN role dashboard.
 */
export function ProtectedRoute({ allowedRoles = STAFF_ROLES }) {
  const { isAuthenticated, role, loading } = useAuth();
  const location = useLocation();

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

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!allowedRoles.includes(role)) {
    return <Navigate to={getRoleHome(role)} replace />;
  }

  return <Outlet />;
}

/** `/dashboard` → the signed-in user's own role dashboard. */
export function DashboardRedirect() {
  const { role } = useAuth();
  return <Navigate to={getRoleHome(role)} replace />;
}
