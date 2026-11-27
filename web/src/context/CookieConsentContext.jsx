import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  loadNonEssentialScripts,
  blockOrCleanupNonEssentialScripts,
} from '../utils/scriptLoader';

export const CONSENT_STORAGE_KEY = 'vabc_cookie_consent';
export const CONSENT_COOKIE_NAME = 'vabc_consent';
export const CONSENT_VALUES = Object.freeze({
  ACCEPTED: 'accepted',
});

const SIX_MONTHS_SECONDS = 15552000; // 180 days

/**
 * Ensures zero patient PII/PHI (names, bite categories, contact numbers, addresses, medical records)
 * is ever persisted in browser storage, and cleans up removed legacy accessibility keys.
 */
const FORBIDDEN_PII_KEY_REGEX =
  /patient|medical|bite_case|clinical_order|phone|address|birthdate|government_id|philhealth|wound/i;

function sanitizeBrowserStorageForHealthcarePrivacy() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem('vabc_a11y_prefs');
    if (typeof document !== 'undefined') {
      document.documentElement.style.fontSize = '';
      document.documentElement.classList.remove('vabc-high-contrast', 'vabc-reduce-motion');
    }

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

function buildAcceptedRecord(timestamp) {
  return {
    consentGiven: true,
    analytics: true,
    essential: true,
    status: CONSENT_VALUES.ACCEPTED,
    timestamp: timestamp || new Date().toISOString(),
  };
}

function parseStoredConsentRecord(raw) {
  if (!raw) return null;
  if (raw === CONSENT_VALUES.ACCEPTED) {
    return buildAcceptedRecord();
  }
  try {
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === 'object' &&
      parsed.consentGiven === true &&
      (parsed.analytics === true || parsed.status === CONSENT_VALUES.ACCEPTED)
    ) {
      return buildAcceptedRecord(parsed.timestamp);
    }
  } catch {
    // Ignore malformed JSON
  }
  return null;
}

function readConsentCookie() {
  if (typeof document === 'undefined' || !document.cookie) return null;
  const parts = document.cookie.split(';');
  for (const part of parts) {
    const eqIdx = part.indexOf('=');
    const rawName = eqIdx > -1 ? part.slice(0, eqIdx) : part;
    const rawVal = eqIdx > -1 ? part.slice(eqIdx + 1) : '';
    if (rawName?.trim() === CONSENT_COOKIE_NAME) {
      const val = decodeURIComponent(rawVal?.trim() || '');
      const parsed = parseStoredConsentRecord(val);
      if (parsed) return parsed;
    }
  }
  return null;
}

function writeConsentCookie(record) {
  if (typeof document === 'undefined' || !record) return;
  const isHttps = typeof window !== 'undefined' && window.location?.protocol === 'https:';
  const secureFlag = isHttps ? '; Secure' : '';
  document.cookie = `${CONSENT_COOKIE_NAME}=${encodeURIComponent(record.status)}; path=/; max-age=${SIX_MONTHS_SECONDS}; SameSite=Lax${secureFlag}`;
}

function readInitialConsentRecord() {
  if (typeof window === 'undefined') return null;
  try {
    const stored = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    const parsed = parseStoredConsentRecord(stored);
    if (parsed) {
      window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(parsed));
      return parsed;
    }
  } catch {
    // Fallback to first-party cookie
  }
  return readConsentCookie();
}

const CookieConsentContext = createContext(null);

export function CookieConsentProvider({ children }) {
  const [consentRecord, setConsentRecord] = useState(readInitialConsentRecord);
  const [isBannerOpen, setIsBannerOpen] = useState(
    () => readInitialConsentRecord() === null
  );

  const consent = consentRecord ? consentRecord.status : null;
  const isAccepted = Boolean(consentRecord?.consentGiven && consentRecord?.analytics);

  useEffect(() => {
    sanitizeBrowserStorageForHealthcarePrivacy();

    if (isAccepted) {
      loadNonEssentialScripts(CONSENT_VALUES.ACCEPTED);
    } else {
      blockOrCleanupNonEssentialScripts();
    }
  }, [isAccepted]);

  const acceptAll = useCallback(() => {
    const record = buildAcceptedRecord();
    setConsentRecord(record);
    setIsBannerOpen(false);

    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(record));
      }
    } catch {
      // Ignore storage write errors
    }
    writeConsentCookie(record);
    loadNonEssentialScripts(CONSENT_VALUES.ACCEPTED);
    return record;
  }, []);

  const openCookiePreferences = useCallback(() => {
    if (!isAccepted) {
      setIsBannerOpen(true);
    }
  }, [isAccepted]);

  const closeCookiePreferences = useCallback(() => {
    setIsBannerOpen(false);
  }, []);

  const value = useMemo(
    () => ({
      consent,
      consentRecord,
      isAccepted,
      isBannerOpen: !isAccepted && isBannerOpen,
      acceptAll,
      openCookiePreferences,
      closeCookiePreferences,
    }),
    [
      consent,
      consentRecord,
      isAccepted,
      isBannerOpen,
      acceptAll,
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
