import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { PublicNavbar } from './PublicNavbar';
import { PublicFooter } from './PublicFooter';
import { PagePetBackground } from '../PagePetBackground';
import { useAuth, STAFF_ROLES, getRoleHome } from '../../context/AuthContext';
import { BufferLoader } from '../ui/BufferLoader';

/**
 * Public website layout:
 * - Always renders in the default public light theme (`bg-[#F2F2ED] text-[#464B71]`).
 * - Enforces Strict Staff Route Lock: while a staff member (`admin`, `doctor`, `nurse`)
 *   is logged in, navigating to any public route immediately redirects back to their
 *   dedicated role dashboard workspace.
 */
export function PublicLayout() {
  const { pathname } = useLocation();
  const { isAuthenticated, role, loading, bufferMessage } = useAuth();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);

  if (loading || bufferMessage) {
    return (
      <BufferLoader
        message={bufferMessage || 'Verifying clinical workspace session...'}
      />
    );
  }

  if (isAuthenticated && STAFF_ROLES.includes(role)) {
    return <Navigate to={getRoleHome(role)} replace />;
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-clip bg-[#F2F2ED] text-[#464B71]">
      {/* 3-Variant Dogs & Cats Background Pattern at 50% Opacity Behind Content */}
      <PagePetBackground />

      <div className="relative z-10 flex min-h-screen flex-col">
        <PublicNavbar />
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
        <PublicFooter />
      </div>
    </div>
  );
}
