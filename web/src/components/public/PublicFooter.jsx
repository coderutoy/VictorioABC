import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  PhoneCall,
  ExternalLink,
  Smartphone,
} from 'lucide-react';
import { useBranch } from '../../context/BranchContext';
import { useCookieConsent } from '../../context/CookieConsentContext';
import { OFFICIAL_BRANCHES, formatPhoneDisplay } from '../../config/branches';
import { MOBILE_APP_DOWNLOAD_URL } from '../../config/appLinks';
import { encodeQrMatrix } from '../../utils/qrEncoder';

const SOCIAL_BRANCH_ORDER = [
  'baliwag',
  'pandi',
  'santa-maria',
  'meycauayan-poblacion',
  'cefels-caloocan',
  'drt',
  'meycauayan-camalig',
];

function FacebookIcon({ className = 'h-4 w-4' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M22 12.06C22 6.504 17.523 2 12 2S2 6.504 2 12.06c0 5.022 3.657 9.184 8.438 9.94v-7.03H7.898v-2.91h2.54V9.845c0-2.522 1.492-3.915 3.777-3.915 1.094 0 2.238.197 2.238.197v2.476h-1.26c-1.243 0-1.63.775-1.63 1.57v1.887h2.773l-.443 2.91h-2.33V22c4.78-.756 8.437-4.918 8.437-9.94Z" />
    </svg>
  );
}

export function PublicFooter() {
  const { selectedPublicBranch } = useBranch();
  const { openCookiePreferences } = useCookieConsent();

  const qrMatrix = useMemo(() => encodeQrMatrix(MOBILE_APP_DOWNLOAD_URL), []);
  const qrSize = qrMatrix.length;

  const orderedSocialBranches = useMemo(
    () =>
      SOCIAL_BRANCH_ORDER.map((slug) =>
        OFFICIAL_BRANCHES.find((b) => b.slug === slug)
      ).filter(Boolean),
    []
  );

  return (
    <footer className="border-t border-white/15 bg-[#464B71] text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-12">
          {/* 1. Brand & Patient Navigation */}
          <div className="space-y-4 lg:col-span-3">
            <Link to="/" className="flex items-center gap-3">
              <div className="h-14 w-14 shrink-0 rounded-full border-2 border-[#7CD5C7] bg-white p-0.5 shadow-md">
                <img
                  src="/victorio_logo.jpg"
                  alt="Victorio Animal Bite Center Logo"
                  className="h-full w-full rounded-full object-cover"
                />
              </div>
              <div>
                <p className="text-base font-extrabold text-white">
                  Victorio Animal Bite Center
                </p>
                <p className="text-xs font-semibold text-[#7CD5C7]">
                  7 Branches • Bulacan &amp; Caloocan
                </p>
              </div>
            </Link>

            <p className="text-xs leading-relaxed text-white/80">
              DOH &amp; WHO-aligned Anti-Rabies Vaccination (PEP/PrEP), ERIG/HRIG infiltration, and cross-branch Digital QR Pass tracking.
            </p>

            <nav aria-label="Footer Quick Navigation" className="pt-1">
              <p className="text-xs font-extrabold uppercase tracking-wider text-[#7CD5C7]">
                Patient Quick Links
              </p>
              <ul className="mt-2 grid grid-cols-2 gap-1.5 text-xs font-semibold text-white/90">
                <li>
                  <Link to="/services" className="hover:text-[#7CD5C7] hover:underline">
                    Our Services
                  </Link>
                </li>
                <li>
                  <Link to="/mobile-app" className="hover:text-[#7CD5C7] hover:underline">
                    Mobile App Guide
                  </Link>
                </li>
                <li>
                  <Link to="/branches" className="hover:text-[#7CD5C7] hover:underline">
                    Our Branches
                  </Link>
                </li>
                <li>
                  <Link to="/partners" className="hover:text-[#7CD5C7] hover:underline">
                    Partners
                  </Link>
                </li>
                <li>
                  <Link to="/triage-guide" className="hover:text-[#7CD5C7] hover:underline">
                    Triage Guide
                  </Link>
                </li>
                <li>
                  <Link to="/roadmap" className="hover:text-[#7CD5C7] hover:underline">
                    PEP Roadmap
                  </Link>
                </li>
                <li>
                  <Link to="/protocols" className="hover:text-[#7CD5C7] hover:underline">
                    Protocols
                  </Link>
                </li>
                <li>
                  <Link to="/faq" className="hover:text-[#7CD5C7] hover:underline">
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link to="/about" className="hover:text-[#7CD5C7] hover:underline">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link to="/privacy-policy" className="hover:text-[#7CD5C7] hover:underline">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          {/* 2. Active Branch Quick Contact */}
          <div className="space-y-3 lg:col-span-3">
            <p className="text-xs font-extrabold uppercase tracking-wider text-[#7CD5C7]">
              Active Branch Quick Contact
            </p>
            <div className="space-y-2.5 rounded-2xl border border-white/15 bg-[#343857] p-4 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-extrabold text-white">
                  {selectedPublicBranch.shortName}
                </span>
                <span className="rounded-full bg-[#7CD5C7]/25 px-2 py-0.5 text-[10px] font-bold text-[#7CD5C7]">
                  Selected
                </span>
              </div>

              <div className="flex items-start gap-2 text-white/85">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#7CD5C7]" />
                <span>{selectedPublicBranch.address}</span>
              </div>

              <div className="flex items-center gap-2">
                <PhoneCall className="h-4 w-4 shrink-0 text-[#7CD5C7]" />
                <a
                  href={`tel:${selectedPublicBranch.contactNumber}`}
                  className="font-extrabold text-[#7CD5C7] hover:underline"
                >
                  {selectedPublicBranch.displayPhone ||
                    formatPhoneDisplay(selectedPublicBranch.contactNumber)}
                </a>
              </div>

              <div className="flex flex-wrap items-center gap-3 border-t border-white/10 pt-2">
                <a
                  href={selectedPublicBranch.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-bold text-white/90 hover:text-[#7CD5C7]"
                >
                  <span>Google Maps</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
                <Link
                  to="/branches"
                  className="inline-flex items-center gap-1 font-bold text-[#7CD5C7] hover:underline"
                >
                  <span>All 7 Branches &rarr;</span>
                </Link>
              </div>
            </div>
          </div>

          {/* 3. Our Socials (Facebook Links for All 7 Official Branches) */}
          <div className="space-y-3 lg:col-span-3">
            <p className="text-xs font-extrabold uppercase tracking-wider text-[#7CD5C7]">
              Our Socials (Official Facebook)
            </p>
            <ul className="space-y-1.5 text-xs">
              {orderedSocialBranches.map((branch) => (
                <li key={branch.slug}>
                  <a
                    href={branch.facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-2 rounded-xl bg-white/5 px-3 py-2 font-semibold text-white/90 transition hover:bg-white/15 hover:text-[#7CD5C7]"
                  >
                    <span className="flex items-center gap-2 truncate">
                      <FacebookIcon className="h-4 w-4 shrink-0 text-[#7CD5C7]" />
                      <span className="truncate">{branch.socialLabel}</span>
                    </span>
                    <ExternalLink className="h-3 w-3 shrink-0 opacity-70" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* 4. Mobile App Companion */}
          <div className="space-y-3 lg:col-span-3">
            <p className="text-xs font-extrabold uppercase tracking-wider text-[#7CD5C7]">
              Mobile Companion App
            </p>
            <div className="rounded-xl border border-[#7CD5C7] bg-white p-3 text-center text-[#464B71] shadow-md">
              <div className="inline-flex items-center gap-1 rounded-full bg-[#7CD5C7]/35 px-2 py-0.5 text-[10px] font-extrabold text-[#464B71]">
                <Smartphone className="h-3.5 w-3.5 text-[#118AB2]" />
                <span>Victorio ABC Mobile App</span>
              </div>

              <div className="mx-auto mt-2 flex h-24 w-24 items-center justify-center rounded-lg border border-[#DDDCD4] bg-white p-1.5">
                <svg
                  viewBox={`0 0 ${qrSize} ${qrSize}`}
                  className="h-full w-full"
                  shapeRendering="crispEdges"
                  role="img"
                  aria-label="QR Code to download the Victorio ABC Mobile App"
                >
                  {qrMatrix.map((row, rIdx) =>
                    row.map((cell, cIdx) =>
                      cell ? (
                        <rect
                          key={`${rIdx}-${cIdx}`}
                          x={cIdx}
                          y={rIdx}
                          width="1"
                          height="1"
                          fill="#464B71"
                        />
                      ) : null
                    )
                  )}
                </svg>
              </div>

              <p className="mt-1.5 text-[11px] font-bold text-[#464B71]">
                AI Pre-Triage &amp; Digital PEP Card
              </p>
              <Link
                to="/mobile-app"
                className="mt-1 inline-block text-[11px] font-extrabold text-[#118AB2] hover:underline"
              >
                How the Mobile App Works &rarr;
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Legal & Copyright Bar with Discreet "Staff Portal" Link */}
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/15 pt-6 text-xs text-white/70 sm:flex-row">
          <span>
            &copy; {new Date().getFullYear()} Victorio Animal Bite Center. All rights reserved.
          </span>
          <div className="flex flex-wrap items-center gap-4">
            <Link
              to="/privacy-policy"
              className="font-semibold text-white/75 transition hover:text-[#7CD5C7] hover:underline"
            >
              Privacy Policy (RA 10173)
            </Link>
            <button
              type="button"
              onClick={openCookiePreferences}
              className="font-semibold text-white/75 transition hover:text-[#7CD5C7] hover:underline"
            >
              Cookie Preferences
            </button>
            <Link
              to="/staff-login"
              data-testid="footer-staff-portal-link"
              className="font-medium text-white/60 transition hover:text-white/90 hover:underline"
            >
              Staff Portal
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
