import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Cookie, CheckCircle2, X } from 'lucide-react';
import {
  useCookieConsent,
  CONSENT_VALUES,
} from '../context/CookieConsentContext';

export function CookieConsentBanner() {
  const {
    consent,
    isBannerOpen,
    openedFromPreferences,
    acceptAll,
    rejectNonEssential,
    closeCookiePreferences,
  } = useCookieConsent();

  useEffect(() => {
    if (!isBannerOpen) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && consent !== null) {
        closeCookiePreferences();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isBannerOpen, consent, closeCookiePreferences]);

  if (!isBannerOpen) return null;

  const statusLabel =
    consent === CONSENT_VALUES.ACCEPTED
      ? 'Current setting: Accepted All'
      : consent === CONSENT_VALUES.ESSENTIAL_ONLY
        ? 'Current setting: Essential Only'
        : 'Current setting: No Non-Essential Scripts Active';

  return (
    <div
      role="region"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-50 border-t-2 border-[#7CD5C7] bg-[#464B71] text-white shadow-2xl"
    >
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#7CD5C7]/25 px-3 py-0.5 text-xs font-extrabold text-[#7CD5C7]">
                <Cookie className="h-3.5 w-3.5" />
                <span>RA 10173 Data Privacy &amp; Cookie Notice</span>
              </span>

              {(openedFromPreferences || consent !== null) && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-0.5 text-xs font-bold text-white">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#7CD5C7]" />
                  <span>{statusLabel}</span>
                </span>
              )}
            </div>

            <p className="text-xs leading-relaxed text-white/95 sm:text-sm max-w-4xl">
              We use essential cookies to keep our site secure and remember your selected clinic branch, and optional analytics cookies (blocked by default) to improve browsing and analyze site traffic. We{' '}
              <strong>never</strong> store patient medical or animal bite records in browser cookies. Read our{' '}
              <Link
                to="/privacy-policy"
                className="font-extrabold text-[#7CD5C7] underline underline-offset-2 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#7CD5C7] rounded"
              >
                Privacy Policy (RA 10173)
              </Link>
              .
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={rejectNonEssential}
              className={`inline-flex min-h-[48px] flex-1 sm:flex-initial items-center justify-center gap-2 rounded-xl border-2 px-5 py-2.5 text-sm font-extrabold transition focus:outline-none focus:ring-2 focus:ring-[#7CD5C7] focus:ring-offset-2 focus:ring-offset-[#464B71] ${
                consent === CONSENT_VALUES.ESSENTIAL_ONLY
                  ? 'border-[#7CD5C7] bg-white text-[#464B71]'
                  : 'border-[#7CD5C7] bg-[#343857] text-white hover:bg-white hover:text-[#464B71]'
              }`}
            >
              <ShieldCheck className="h-4 w-4 shrink-0" />
              <span>Essential Only</span>
            </button>

            <button
              type="button"
              onClick={acceptAll}
              className="inline-flex min-h-[48px] flex-1 sm:flex-initial items-center justify-center gap-2 rounded-xl bg-[#118AB2] px-5 py-2.5 text-sm font-extrabold text-white shadow-md transition hover:bg-[#0D6E8E] focus:outline-none focus:ring-2 focus:ring-[#7CD5C7] focus:ring-offset-2 focus:ring-offset-[#464B71]"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Accept All</span>
            </button>

            {consent !== null && (
              <button
                type="button"
                onClick={closeCookiePreferences}
                aria-label="Close cookie preferences"
                className="inline-flex min-h-[48px] min-w-[48px] items-center justify-center rounded-xl border border-white/20 bg-white/10 p-2.5 text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-[#7CD5C7]"
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
