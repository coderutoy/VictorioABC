import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { PublicNavbar } from './PublicNavbar';
import { PublicFooter } from './PublicFooter';
import { PagePetBackground } from '../PagePetBackground';

export function PublicLayout() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);

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
