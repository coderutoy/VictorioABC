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
 * Ensures zero patient PII/PHI (names, bite categories, contact numbers, addresses, medical records)
 * is ever persisted in browser storage, and cleans up removed legacy accessibility keys.
 */
const FORBIDDEN_PII_KEY_REGEX =
  /patient|medical|bite_case|clinical_order|phone|address|birthdate|government_id|philhealth|wound/i;

function sanitizeBrowserStorageForHealthcarePrivacy() {
  if (typeof window === 'undefined') return;
  try {
    // Clean up legacy accessibility toolbar state so font-size is never stuck
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

function buildConsentRecord(status) {
  const isAccepted = status === CONSENT_VALUES.ACCEPTED;
  return {
    essential: true,
    analytics: isAccepted,
    consentGiven: true,
    status: isAccepted ? CONSENT_VALUES.ACCEPTED : CONSENT_VALUES.ESSENTIAL_ONLY,
    timestamp: new Date().toISOString(),
  };
}

function parseStoredConsentRecord(raw) {
  if (!raw) return null;
  if (raw === CONSENT_VALUES.ACCEPTED || raw === CONSENT_VALUES.ESSENTIAL_ONLY) {
    return buildConsentRecord(raw);
  }
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && parsed.consentGiven === true) {
      const isAccepted =
        parsed.analytics === true || parsed.status === CONSENT_VALUES.ACCEPTED;
      return {
        essential: true,
        analytics: Boolean(isAccepted),
        consentGiven: true,
        status: isAccepted ? CONSENT_VALUES.ACCEPTED : CONSENT_VALUES.ESSENTIAL_ONLY,
        timestamp: parsed.timestamp || new Date().toISOString(),
      };
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
      // Ensure localStorage is normalized to structured JSON object format
      window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(parsed));
      return parsed;
    }
  } catch {
    // Fallback to first-party cookie
  }
  return readConsentCookie();
}

const CookieConsentContext = createContext(null);

const SESSION_DISMISS_KEY = 'vabc_cookie_notice_dismissed';

function wasNoticeDismissedThisSession() {
  if (typeof window === 'undefined') return false;
  try {
    return window.sessionStorage.getItem(SESSION_DISMISS_KEY) === '1';
  } catch {
    return false;
  }
}

export function CookieConsentProvider({ children }) {
  const [consentRecord, setConsentRecord] = useState(readInitialConsentRecord);
  const [isBannerOpen, setIsBannerOpen] = useState(
    () => readInitialConsentRecord() === null && !wasNoticeDismissedThisSession()
  );
  const [openedFromPreferences, setOpenedFromPreferences] = useState(false);

  const consent = consentRecord ? consentRecord.status : null;

  // Enforce healthcare storage hygiene and apply conditional script blocking on mount & consent change
  useEffect(() => {
    sanitizeBrowserStorageForHealthcarePrivacy();

    if (consentRecord?.analytics) {
      loadNonEssentialScripts(CONSENT_VALUES.ACCEPTED);
    } else {
      blockOrCleanupNonEssentialScripts();
    }
  }, [consentRecord]);

  const saveConsentPreferences = useCallback(({ analytics = false } = {}) => {
    const nextStatus = analytics
      ? CONSENT_VALUES.ACCEPTED
      : CONSENT_VALUES.ESSENTIAL_ONLY;
    const record = {
      essential: true,
      analytics: Boolean(analytics),
      consentGiven: true,
      status: nextStatus,
      timestamp: new Date().toISOString(),
    };

    setConsentRecord(record);
    setIsBannerOpen(false);
    setOpenedFromPreferences(false);

    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(record));
      }
    } catch {
      // Ignore storage write errors
    }
    writeConsentCookie(record);

    if (record.analytics) {
      loadNonEssentialScripts(CONSENT_VALUES.ACCEPTED);
    } else {
      blockOrCleanupNonEssentialScripts();
    }

    return record;
  }, []);

  const acceptAll = useCallback(() => {
    return saveConsentPreferences({ analytics: true });
  }, [saveConsentPreferences]);

  const rejectNonEssential = useCallback(() => {
    return saveConsentPreferences({ analytics: false });
  }, [saveConsentPreferences]);

  const openCookiePreferences = useCallback(() => {
    setOpenedFromPreferences(true);
    setIsBannerOpen(true);
  }, []);

  /**
   * "×" dismissal: hides the notice for this browser session only and NEVER treats it as
   * "Accept All". With no stored decision, every non-essential script stays blocked
   * (equivalent to Essential Only) until the visitor explicitly opts in via Preferences.
   */
  const dismissCookieNotice = useCallback(() => {
    setIsBannerOpen(false);
    setOpenedFromPreferences(false);
    try {
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(SESSION_DISMISS_KEY, '1');
      }
    } catch {
      // Ignore storage write errors
    }
    blockOrCleanupNonEssentialScripts();
  }, []);

  const closeCookiePreferences = useCallback(() => {
    setIsBannerOpen(false);
    setOpenedFromPreferences(false);
  }, []);

  const value = useMemo(
    () => ({
      consent,
      consentRecord,
      isBannerOpen,
      openedFromPreferences,
      acceptAll,
      rejectNonEssential,
      saveConsentPreferences,
      openCookiePreferences,
      closeCookiePreferences,
      dismissCookieNotice,
    }),
    [
      consent,
      consentRecord,
      isBannerOpen,
      openedFromPreferences,
      acceptAll,
      rejectNonEssential,
      saveConsentPreferences,
      openCookiePreferences,
      closeCookiePreferences,
      dismissCookieNotice,
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
