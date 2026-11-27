import { Link } from 'react-router-dom';
import { useCookieConsent } from '../../context/CookieConsentContext';

export function Footer() {
  const { openCookiePreferences } = useCookieConsent();

  return (
    <footer className="border-t border-[#DDDCD4] bg-white px-4 py-3 text-xs text-[#464B71]/80 lg:px-6">
      <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
        <span>
          &copy; {new Date().getFullYear()} Victorio Animal Bite Center &mdash; 7 Official Branches.
        </span>
        <div className="flex flex-wrap items-center gap-4">
          <Link to="/privacy-policy" className="font-semibold text-[#118AB2] hover:underline">
            Privacy Policy (RA 10173)
          </Link>
          <button
            type="button"
            onClick={openCookiePreferences}
            className="font-semibold text-[#118AB2] hover:underline"
          >
            Cookie Preferences
          </button>
          <span>Physician verification required for all WHO Category &amp; PEP orders.</span>
        </div>
      </div>
    </footer>
  );
}
