import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Cookie, CheckCircle2, X, SlidersHorizontal } from 'lucide-react';
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
      if (e.key === 'Escape' && (consent !== null || openedFromPreferences)) {
        closeCookiePreferences();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isBannerOpen, consent, openedFromPreferences, closeCookiePreferences]);

  if (!isBannerOpen) return null;

  const statusLabel =
    consent === CONSENT_VALUES.ACCEPTED
      ? 'Current setting: Accepted All (Essential + Analytics)'
      : consent === CONSENT_VALUES.ESSENTIAL_ONLY
        ? 'Current setting: Essential Only (Tracking Blocked)'
        : 'Current setting: No Non-Essential Scripts Active';

  // When opened via "Cookie Preferences" / "Manage Cookies", render an interactive centered modal
  if (openedFromPreferences) {
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Manage Cookie Preferences"
        className="pointer-events-auto fixed inset-0 z-[9999] flex items-center justify-center bg-[#343857]/75 p-4 backdrop-blur-xs"
      >
        <div className="w-full max-w-xl rounded-3xl border-2 border-[#7CD5C7] bg-white p-6 text-[#464B71] shadow-2xl sm:p-7 space-y-5">
          <div className="flex items-start justify-between gap-3 border-b border-[#F2F2ED] pb-4">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#7CD5C7]/30 px-3 py-0.5 text-xs font-extrabold text-[#464B71]">
                <SlidersHorizontal className="h-3.5 w-3.5 text-[#118AB2]" />
                <span>RA 10173 Cookie Preferences</span>
              </span>
              <h2 className="mt-1.5 text-xl font-extrabold text-[#464B71]">
                Manage Your Cookie &amp; Privacy Settings
              </h2>
              <p className="mt-0.5 text-xs font-semibold text-[#118AB2]">{statusLabel}</p>
            </div>

            <button
              type="button"
              onClick={closeCookiePreferences}
              aria-label="Close cookie preferences"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#F2F2ED] text-[#464B71] hover:bg-[#DDDCD4]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-3 text-xs sm:text-sm">
            {/* Essential Cookies Row */}
            <div className="flex items-start justify-between gap-4 rounded-2xl border border-[#7CD5C7] bg-[#EAFBF8] p-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-[#464B71]">
                    1. Strictly Necessary / Essential Cookies
                  </span>
                  <span className="rounded-full bg-[#464B71] px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-[#7CD5C7]">
                    Always Active
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-[#464B71]/85">
                  Required for security, remembering your active clinic branch selection, and saving your cookie consent decision. Zero patient medical data is stored.
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

            {/* Optional Analytics Cookies Row */}
            <label className="flex cursor-pointer items-start justify-between gap-4 rounded-2xl border border-[#DDDCD4] bg-[#F2F2ED]/60 p-4 transition hover:border-[#118AB2]">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-[#464B71]">
                    2. Optional Analytics Cookies
                  </span>
                  <span className="rounded-full bg-[#118AB2]/15 px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-[#118AB2]">
                    {analyticsEnabled ? 'Enabled' : 'Blocked'}
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-[#464B71]/85">
                  Helps us understand anonymous public page traffic so we can improve clinic guides. Strictly blocked by default until you opt in.
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

          <div className="flex flex-wrap items-center justify-between gap-2.5 border-t border-[#F2F2ED] pt-4">
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
                className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border-2 border-[#464B71] bg-white px-4 py-2 text-xs font-extrabold text-[#464B71] transition hover:bg-[#F2F2ED]"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>Essential Only</span>
              </button>

              <button
                type="button"
                onClick={() => saveConsentPreferences({ analytics: analyticsEnabled })}
                className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-[#464B71] px-4 py-2 text-xs font-extrabold text-white transition hover:bg-[#343857]"
              >
                <span>Save Preferences</span>
              </button>

              <button
                type="button"
                onClick={() => acceptAll()}
                className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-[#118AB2] px-4 py-2 text-xs font-extrabold text-white shadow-sm transition hover:bg-[#0D6E8E]"
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

  return (
    <div
      role="region"
      aria-label="Cookie consent"
      data-testid="cookie-consent-banner"
      className="pointer-events-auto fixed inset-x-0 bottom-0 z-[9999] border-t-2 border-[#7CD5C7] bg-[#464B71] text-white shadow-2xl"
    >
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#7CD5C7]/25 px-3 py-0.5 text-xs font-extrabold text-[#7CD5C7]">
                <Cookie className="h-3.5 w-3.5" />
                <span>RA 10173 Data Privacy &amp; Cookie Notice</span>
              </span>

              {consent !== null && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-0.5 text-xs font-bold text-white">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#7CD5C7]" />
                  <span>{statusLabel}</span>
                </span>
              )}
            </div>

            <p className="max-w-4xl text-xs leading-relaxed text-white/95 sm:text-sm">
              We use essential cookies to keep our site secure and remember your selected clinic branch, and optional analytics cookies (blocked by default) to improve browsing and analyze site traffic. We{' '}
              <strong>never</strong> store patient medical or animal bite records in browser cookies. Read our{' '}
              <Link
                to="/privacy-policy"
                className="rounded font-extrabold text-[#7CD5C7] underline underline-offset-2 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#7CD5C7]"
              >
                Privacy Policy (RA 10173)
              </Link>
              .
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2.5">
            <button
              type="button"
              data-testid="cookie-essential-only-btn"
              onClick={() => rejectNonEssential()}
              className="inline-flex min-h-[48px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-[#7CD5C7] bg-[#343857] px-5 py-2.5 text-sm font-extrabold text-white transition hover:bg-white hover:text-[#464B71] focus:outline-none focus:ring-2 focus:ring-[#7CD5C7] focus:ring-offset-2 focus:ring-offset-[#464B71] sm:flex-initial"
            >
              <ShieldCheck className="h-4 w-4 shrink-0" />
              <span>Essential Only</span>
            </button>

            <button
              type="button"
              data-testid="cookie-accept-all-btn"
              onClick={() => acceptAll()}
              className="inline-flex min-h-[48px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#118AB2] px-5 py-2.5 text-sm font-extrabold text-white shadow-md transition hover:bg-[#0D6E8E] focus:outline-none focus:ring-2 focus:ring-[#7CD5C7] focus:ring-offset-2 focus:ring-offset-[#464B71] sm:flex-initial"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Accept All</span>
            </button>

            {consent !== null && (
              <button
                type="button"
                onClick={closeCookiePreferences}
                aria-label="Close cookie preferences"
                className="inline-flex min-h-[48px] min-w-[48px] cursor-pointer items-center justify-center rounded-xl border border-white/20 bg-white/10 p-2.5 text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-[#7CD5C7]"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
