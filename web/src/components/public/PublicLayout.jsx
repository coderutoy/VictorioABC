import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { PublicNavbar } from './PublicNavbar';
import { PublicFooter } from './PublicFooter';
import { BottomRefreshControl } from './BottomRefreshControl';
import { PagePetBackground } from '../PagePetBackground';
import { useCookieConsent } from '../../context/CookieConsentContext';

export function PublicLayout() {
  const { pathname } = useLocation();
  const { isBannerOpen, openedFromPreferences } = useCookieConsent();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);

  // Reserve space at the bottom on phones/tablets so the compact cookie card never covers the Refresh pill
  const reserveForCookieCard = isBannerOpen && !openedFromPreferences;

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-clip bg-[#F2F2ED] text-[#464B71]">
      {/* 3-Variant Dogs & Cats Background Pattern at 50% Opacity Behind Content */}
      <PagePetBackground />

      <div
        className={`relative z-10 flex min-h-screen flex-col ${
          reserveForCookieCard ? 'pb-40 lg:pb-0' : ''
        }`}
      >
        <PublicNavbar />
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
        <PublicFooter />
        <BottomRefreshControl />
      </div>
    </div>
  );
}
