import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  loadNonEssentialScripts,
  blockOrCleanupNonEssentialScripts,
} from '../utils/scriptLoader';

export const CONSENT_STORAGE_KEY = 'vabc_cookie_consent';
export const CONSENT_COOKIE_NAME = 'vabc_consent';
export const CONSENT_VALUES = Object.freeze({
  ACCEPTED: 'accepted',
  ESSENTIAL_ONLY: 'essential_only',
});

const SIX_MONTHS_SECONDS = 15552000; // 180 days

/**
 * Allowed non-sensitive UI keys in localStorage (besides Supabase Auth's internal session token).
 * Ensures zero patient PII/PHI (names, bite categories, contact numbers, addresses, medical records)
 * is ever persisted in browser storage.
 */
const FORBIDDEN_PII_KEY_REGEX =
  /patient|medical|bite_case|clinical_order|phone|address|birthdate|government_id|philhealth|wound/i;

function sanitizeBrowserStorageForHealthcarePrivacy() {
  if (typeof window === 'undefined') return;
  try {
    for (const storage of [window.localStorage, window.sessionStorage]) {
      if (!storage) continue;
      const keysToRemove = [];
      for (let i = 0; i < storage.length; i += 1) {
        const key = storage.key(i);
        if (key && FORBIDDEN_PII_KEY_REGEX.test(key)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => storage.removeItem(k));
    }
  } catch {
    // Ignore storage access errors in restricted iframes
  }
}

function readConsentCookie() {
  if (typeof document === 'undefined' || !document.cookie) return null;
  const parts = document.cookie.split(';');
  for (const part of parts) {
    const [rawName, rawVal] = part.split('=');
    if (rawName?.trim() === CONSENT_COOKIE_NAME) {
      const val = rawVal?.trim();
      if (val === CONSENT_VALUES.ACCEPTED || val === CONSENT_VALUES.ESSENTIAL_ONLY) {
        return val;
      }
    }
  }
  return null;
}

function writeConsentCookie(value) {
  if (typeof document === 'undefined') return;
  const isHttps = typeof window !== 'undefined' && window.location?.protocol === 'https:';
  const secureFlag = isHttps ? '; Secure' : '';
  document.cookie = `${CONSENT_COOKIE_NAME}=${value}; path=/; max-age=${SIX_MONTHS_SECONDS}; SameSite=Lax${secureFlag}`;
}

function readInitialConsent() {
  if (typeof window === 'undefined') return null;
  try {
    const stored = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (stored === CONSENT_VALUES.ACCEPTED || stored === CONSENT_VALUES.ESSENTIAL_ONLY) {
      return stored;
    }
  } catch {
    // Fallback to first-party cookie
  }
  return readConsentCookie();
}

const CookieConsentContext = createContext(null);

export function CookieConsentProvider({ children }) {
  const [consent, setConsent] = useState(readInitialConsent);
  const [isBannerOpen, setIsBannerOpen] = useState(() => readInitialConsent() === null);
  const [openedFromPreferences, setOpenedFromPreferences] = useState(false);

  // Enforce healthcare storage hygiene and apply conditional script blocking on mount & consent change
  useEffect(() => {
    sanitizeBrowserStorageForHealthcarePrivacy();

    if (consent === CONSENT_VALUES.ACCEPTED) {
      loadNonEssentialScripts(CONSENT_VALUES.ACCEPTED);
    } else {
      // Both null (unanswered) and 'essential_only' strictly block non-essential scripts
      blockOrCleanupNonEssentialScripts();
    }
  }, [consent]);

  const saveDecision = useCallback((nextValue) => {
    setConsent(nextValue);
    setIsBannerOpen(false);
    setOpenedFromPreferences(false);

    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(CONSENT_STORAGE_KEY, nextValue);
      }
    } catch {
      // Ignore storage write errors
    }
    writeConsentCookie(nextValue);

    if (nextValue === CONSENT_VALUES.ACCEPTED) {
      loadNonEssentialScripts(CONSENT_VALUES.ACCEPTED);
    } else {
      blockOrCleanupNonEssentialScripts();
    }
  }, []);

  const acceptAll = useCallback(() => {
    saveDecision(CONSENT_VALUES.ACCEPTED);
  }, [saveDecision]);

  const rejectNonEssential = useCallback(() => {
    saveDecision(CONSENT_VALUES.ESSENTIAL_ONLY);
  }, [saveDecision]);

  const openCookiePreferences = useCallback(() => {
    setOpenedFromPreferences(true);
    setIsBannerOpen(true);
  }, []);

  const closeCookiePreferences = useCallback(() => {
    if (consent !== null) {
      setIsBannerOpen(false);
      setOpenedFromPreferences(false);
    }
  }, [consent]);

  const value = useMemo(
    () => ({
      consent,
      isBannerOpen,
      openedFromPreferences,
      acceptAll,
      rejectNonEssential,
      openCookiePreferences,
      closeCookiePreferences,
    }),
    [
      consent,
      isBannerOpen,
      openedFromPreferences,
      acceptAll,
      rejectNonEssential,
      openCookiePreferences,
      closeCookiePreferences,
    ]
  );

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsent() {
  const ctx = useContext(CookieConsentContext);
  if (!ctx) {
    throw new Error('useCookieConsent must be used inside a CookieConsentProvider');
  }
  return ctx;
}
