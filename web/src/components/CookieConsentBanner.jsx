import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, CheckCircle2, X, SlidersHorizontal } from 'lucide-react';
import {
  useCookieConsent,
  CONSENT_VALUES,
} from '../context/CookieConsentContext';

export function CookieConsentBanner() {
  const {
    consent,
    consentRecord,
    isBannerOpen,
    openedFromPreferences,
    acceptAll,
    rejectNonEssential,
    saveConsentPreferences,
    closeCookiePreferences,
    openCookiePreferences,
    dismissCookieNotice,
  } = useCookieConsent();

  const [analyticsEnabled, setAnalyticsEnabled] = useState(
    () => Boolean(consentRecord?.analytics)
  );

  useEffect(() => {
    setAnalyticsEnabled(Boolean(consentRecord?.analytics));
  }, [consentRecord, isBannerOpen]);

  useEffect(() => {
    if (!isBannerOpen) return undefined;
    const handleKeyDown = (e) => {
      if (e.key !== 'Escape') return;
      if (openedFromPreferences) closeCookiePreferences();
      else dismissCookieNotice();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isBannerOpen, openedFromPreferences, closeCookiePreferences, dismissCookieNotice]);

  if (!isBannerOpen) return null;

  const statusLabel =
    consent === CONSENT_VALUES.ACCEPTED
      ? 'Current setting: Accepted All (Essential + Analytics)'
      : consent === CONSENT_VALUES.ESSENTIAL_ONLY
        ? 'Current setting: Essential Only (Tracking Blocked)'
        : 'Current setting: Essential Only (no choice saved yet)';

  // Full preferences dialog (opened from the footer "Cookie Preferences" or the banner's Preferences link)
  if (openedFromPreferences) {
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Manage Cookie Preferences"
        className="pointer-events-auto fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-[#343857]/75 p-4"
      >
        <div className="w-full max-w-lg space-y-4 rounded-3xl border-2 border-[#7CD5C7] bg-white p-5 text-[#464B71] shadow-2xl sm:p-6">
          <div className="flex items-start justify-between gap-3 border-b border-[#F2F2ED] pb-3">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#7CD5C7]/30 px-3 py-0.5 text-xs font-extrabold text-[#464B71]">
                <SlidersHorizontal className="h-3.5 w-3.5 text-[#118AB2]" />
                <span>RA 10173 Cookie Preferences</span>
              </span>
              <h2 className="mt-1.5 text-lg font-extrabold text-[#464B71]">
                Manage Your Cookie &amp; Privacy Settings
              </h2>
              <p className="mt-0.5 text-xs font-semibold text-[#118AB2]">{statusLabel}</p>
            </div>

            <button
              type="button"
              onClick={closeCookiePreferences}
              aria-label="Close cookie preferences"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F2F2ED] text-[#464B71] hover:bg-[#DDDCD4]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-3 text-xs sm:text-sm">
            <div className="flex items-start justify-between gap-4 rounded-2xl border border-[#7CD5C7] bg-[#EAFBF8] p-3.5">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-extrabold text-[#464B71]">
                    Strictly Necessary Cookies
                  </span>
                  <span className="rounded-full bg-[#464B71] px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-[#7CD5C7]">
                    Always Active
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-[#464B71]/85">
                  Security, your selected clinic branch, and saving this decision. Zero patient medical data is stored.
                </p>
              </div>
              <input
                type="checkbox"
                checked
                disabled
                aria-label="Essential cookies always active"
                className="mt-1 h-5 w-5 accent-[#118AB2]"
              />
            </div>

            <label className="flex cursor-pointer items-start justify-between gap-4 rounded-2xl border border-[#DDDCD4] bg-[#F2F2ED]/60 p-3.5 transition hover:border-[#118AB2]">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-extrabold text-[#464B71]">Optional Analytics Cookies</span>
                  <span className="rounded-full bg-[#118AB2]/15 px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-[#118AB2]">
                    {analyticsEnabled ? 'Enabled' : 'Blocked'}
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-[#464B71]/85">
                  Anonymous page-traffic measurement. Blocked by default until you opt in.
                </p>
              </div>
              <input
                type="checkbox"
                checked={analyticsEnabled}
                onChange={(e) => setAnalyticsEnabled(e.target.checked)}
                className="mt-1 h-5 w-5 cursor-pointer accent-[#118AB2]"
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2.5 border-t border-[#F2F2ED] pt-3">
            <Link
              to="/privacy-policy"
              onClick={closeCookiePreferences}
              className="text-xs font-extrabold text-[#118AB2] underline hover:text-[#0D6E8E]"
            >
              Read RA 10173 Privacy Policy
            </Link>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => rejectNonEssential()}
                className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border-2 border-[#464B71] bg-white px-3.5 py-2 text-xs font-extrabold text-[#464B71] transition hover:bg-[#F2F2ED]"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>Essential Only</span>
              </button>
              <button
                type="button"
                onClick={() => saveConsentPreferences({ analytics: analyticsEnabled })}
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[#464B71] px-3.5 py-2 text-xs font-extrabold text-white transition hover:bg-[#343857]"
              >
                Save Preferences
              </button>
              <button
                type="button"
                onClick={() => acceptAll()}
                className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-[#118AB2] px-3.5 py-2 text-xs font-extrabold text-white transition hover:bg-[#0D6E8E]"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Accept All</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Compact floating cookie card (first visit)
  return (
    <div
      role="region"
      aria-label="Cookie consent"
      data-testid="cookie-consent-banner"
      className="pointer-events-auto fixed inset-x-3 bottom-3 z-[60] rounded-2xl border border-[#7CD5C7] bg-[#464B71] p-3.5 pr-10 text-white shadow-2xl sm:inset-x-auto sm:bottom-4 sm:left-4 sm:w-full sm:max-w-sm"
    >
      <button
        type="button"
        onClick={dismissCookieNotice}
        aria-label="Dismiss cookie notice"
        className="absolute right-1.5 top-1.5 inline-flex h-9 w-9 items-center justify-center rounded-lg text-xl leading-none text-white/80 transition hover:bg-white/15 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#7CD5C7]"
      >
        <span aria-hidden="true">&times;</span>
      </button>

      <p className="text-xs leading-snug text-white/95">
        We use essential cookies only by default; analytics stay off unless you accept.{' '}
        <Link
          to="/privacy-policy"
          className="rounded font-extrabold text-[#7CD5C7] underline underline-offset-2 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#7CD5C7]"
        >
          Privacy Policy
        </Link>
        .
      </p>

      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        <button
          type="button"
          data-testid="cookie-accept-all-btn"
          onClick={() => acceptAll()}
          className="inline-flex min-h-[40px] cursor-pointer items-center justify-center rounded-lg bg-[#118AB2] px-3.5 py-1.5 text-xs font-extrabold text-white transition hover:bg-[#0D6E8E] focus:outline-none focus:ring-2 focus:ring-[#7CD5C7]"
        >
          Accept All
        </button>
        <button
          type="button"
          data-testid="cookie-essential-only-btn"
          onClick={() => rejectNonEssential()}
          className="inline-flex min-h-[40px] cursor-pointer items-center justify-center rounded-lg border border-[#7CD5C7] bg-transparent px-3.5 py-1.5 text-xs font-extrabold text-white transition hover:bg-white hover:text-[#464B71] focus:outline-none focus:ring-2 focus:ring-[#7CD5C7]"
        >
          Essential Only
        </button>
        <button
          type="button"
          onClick={openCookiePreferences}
          className="inline-flex min-h-[40px] items-center rounded-lg px-1.5 text-xs font-bold text-[#7CD5C7] underline underline-offset-2 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#7CD5C7]"
        >
          Preferences
        </button>
      </div>
    </div>
  );
}
