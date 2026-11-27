import { Link } from 'react-router-dom';
import { Cookie, CheckCircle2 } from 'lucide-react';
import { useCookieConsent } from '../context/CookieConsentContext';

/**
 * Classic full-width bottom Cookie Consent Banner.
 * - Restored full-width classic layout with "Accept All Cookies" as the primary action
 *   and a link to /privacy-policy ("Essential Only" removed).
 * - Immediately unmounts/disposes as soon as "Accept All Cookies" is clicked on either
 *   this banner or inside /privacy-policy, and stays disposed across navigation and reloads.
 */
export function CookieConsentBanner() {
  const { isAccepted, isBannerOpen, acceptAll } = useCookieConsent();

  if (isAccepted || !isBannerOpen) return null;

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
            </div>

            <p className="max-w-4xl text-xs leading-relaxed text-white/95 sm:text-sm">
              We use cookies to keep our site secure, remember your selected clinic branch, and improve your browsing experience. We{' '}
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
              data-testid="cookie-accept-all-btn"
              onClick={() => acceptAll()}
              className="inline-flex min-h-[48px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#118AB2] px-6 py-2.5 text-sm font-extrabold text-white shadow-md transition hover:bg-[#0D6E8E] focus:outline-none focus:ring-2 focus:ring-[#7CD5C7] focus:ring-offset-2 focus:ring-offset-[#464B71] sm:flex-initial"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Accept All Cookies</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
