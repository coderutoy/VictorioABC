import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth, STAFF_ROLES } from '../../context/AuthContext';
import { Spinner } from '../ui/Spinner';

export function RoleRoute({ allowedRoles = STAFF_ROLES }) {
  const { isAuthenticated, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Spinner size="lg" label="Verifying clinical session..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
