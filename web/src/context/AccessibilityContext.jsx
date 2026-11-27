import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const A11Y_STORAGE_KEY = 'vabc_a11y_prefs';

const DEFAULT_PREFS = {
  fontScale: 100, // 100 | 115 | 130
  highContrast: false,
  reduceMotion: false,
};

function loadInitialPrefs() {
  if (typeof window === 'undefined') return DEFAULT_PREFS;
  try {
    const raw = window.localStorage.getItem(A11Y_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        fontScale: [100, 115, 130].includes(Number(parsed.fontScale))
          ? Number(parsed.fontScale)
          : 100,
        highContrast: Boolean(parsed.highContrast),
        reduceMotion: Boolean(parsed.reduceMotion),
      };
    }
  } catch {
    // Ignore storage read errors
  }
  return DEFAULT_PREFS;
}

const AccessibilityContext = createContext(null);

export function AccessibilityProvider({ children }) {
  const [prefs, setPrefs] = useState(loadInitialPrefs);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    try {
      window.localStorage.setItem(A11Y_STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      // Ignore storage write errors
    }

    document.documentElement.style.fontSize = `${prefs.fontScale}%`;
    document.documentElement.classList.toggle('vabc-high-contrast', prefs.highContrast);
    document.documentElement.classList.toggle('vabc-reduce-motion', prefs.reduceMotion);
  }, [prefs]);

  const setFontScale = (scale) => {
    setPrefs((prev) => ({ ...prev, fontScale: scale }));
  };

  const toggleHighContrast = () => {
    setPrefs((prev) => ({ ...prev, highContrast: !prev.highContrast }));
  };

  const toggleReduceMotion = () => {
    setPrefs((prev) => ({ ...prev, reduceMotion: !prev.reduceMotion }));
  };

  const resetAccessibility = () => {
    setPrefs(DEFAULT_PREFS);
  };

  const value = useMemo(
    () => ({
      ...prefs,
      setFontScale,
      toggleHighContrast,
      toggleReduceMotion,
      resetAccessibility,
    }),
    [prefs]
  );

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) {
    return {
      ...DEFAULT_PREFS,
      setFontScale: () => {},
      toggleHighContrast: () => {},
      toggleReduceMotion: () => {},
      resetAccessibility: () => {},
    };
  }
  return ctx;
}
