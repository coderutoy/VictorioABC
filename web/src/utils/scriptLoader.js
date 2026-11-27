/**
 * Conditional Non-Essential Script Loader & Blocker (RA 10173 Prior Consent Enforcement).
 *
 * Guarantee:
 * - Zero non-essential analytics, marketing, or widget scripts execute when consent is
 *   `null` (unanswered) or `'essential_only'`.
 * - Scripts are dynamically injected ONLY when consent === `'accepted'`, and are tagged with
 *   `data-cookie-category="non-essential"` so they can be cleanly removed if consent is revoked.
 */

const NON_ESSENTIAL_ATTR = 'data-cookie-category';
const NON_ESSENTIAL_VALUE = 'non-essential';

const TRACKING_COOKIE_PATTERNS = [
  /^_ga/,
  /^_gid$/,
  /^_gat/,
  /^_fbp$/,
  /^_fbc$/,
  /^_gcl_/,
];

/**
 * Helper to delete a client-accessible cookie across root path and domain variants.
 */
function expireClientCookie(name) {
  if (typeof document === 'undefined') return;
  const host = window.location?.hostname || '';
  const domains = [undefined, host, `.${host}`];
  for (const domain of domains) {
    const domainPart = domain ? `; domain=${domain}` : '';
    document.cookie = `${name}=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT${domainPart}; SameSite=Lax`;
  }
}

/**
 * Removes any non-essential tracking cookies (_ga, _gid, _fbp, etc.) from document.cookie.
 */
export function clearNonEssentialCookies() {
  if (typeof document === 'undefined' || !document.cookie) return;
  const rawCookies = document.cookie.split(';');
  for (const entry of rawCookies) {
    const eqIdx = entry.indexOf('=');
    const name = (eqIdx > -1 ? entry.slice(0, eqIdx) : entry).trim();
    if (!name) continue;
    if (TRACKING_COOKIE_PATTERNS.some((regex) => regex.test(name))) {
      expireClientCookie(name);
    }
  }
}

/**
 * Injects a single non-essential script idempotently.
 */
function injectTaggedScript({ id, src, inlineCode, async = true, defer = true }) {
  if (typeof document === 'undefined') return null;
  if (id && document.getElementById(id)) {
    return document.getElementById(id);
  }

  const script = document.createElement('script');
  if (id) script.id = id;
  script.setAttribute(NON_ESSENTIAL_ATTR, NON_ESSENTIAL_VALUE);
  script.type = 'text/javascript';

  if (src) {
    script.src = src;
    script.async = async;
    script.defer = defer;
  } else if (inlineCode) {
    script.text = inlineCode;
  }

  document.head.appendChild(script);
  return script;
}

/**
 * Dynamically loads configured optional analytics/marketing/chat scripts.
 * MUST ONLY be called when user consent === 'accepted'.
 */
export function loadNonEssentialScripts(consent = 'accepted') {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return { loaded: [], blocked: true };
  }

  // Strict guard: never run unless consent is explicitly 'accepted'
  if (consent !== 'accepted') {
    blockOrCleanupNonEssentialScripts();
    return { loaded: [], blocked: true };
  }

  const loaded = [];
  const gaId = (import.meta.env.VITE_GA_MEASUREMENT_ID || '').trim();
  const metaPixelId = (import.meta.env.VITE_META_PIXEL_ID || '').trim();
  const chatWidgetUrl = (import.meta.env.VITE_CHAT_WIDGET_URL || '').trim();

  // 1. Google Analytics 4 (VITE_GA_MEASUREMENT_ID)
  if (gaId) {
    window[`ga-disable-${gaId}`] = false;
    injectTaggedScript({
      id: 'vabc-ga-loader',
      src: `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`,
    });
    window.dataLayer = window.dataLayer || [];
    window.gtag =
      window.gtag ||
      function gtag() {
        window.dataLayer.push(arguments);
      };
    window.gtag('js', new Date());
    window.gtag('config', gaId, { anonymize_ip: true });
    loaded.push('google-analytics');
  }

  // 2. Meta Pixel (VITE_META_PIXEL_ID)
  if (metaPixelId) {
    injectTaggedScript({
      id: 'vabc-meta-pixel',
      src: 'https://connect.facebook.net/en_US/fbevents.js',
    });
    loaded.push('meta-pixel');
  }

  // 3. Optional Chat Widget (VITE_CHAT_WIDGET_URL)
  if (chatWidgetUrl) {
    injectTaggedScript({
      id: 'vabc-chat-widget',
      src: chatWidgetUrl,
    });
    loaded.push('chat-widget');
  }

  window.__VABC_NON_ESSENTIAL_SCRIPTS_ACTIVE__ = true;
  return { loaded, blocked: false };
}

/**
 * Immediately blocks, disables, and cleans up any non-essential scripts and tracking cookies.
 * Called on initial boot when consent is null or 'essential_only', and whenever a user
 * switches from 'accepted' back to 'essential_only'.
 */
export function blockOrCleanupNonEssentialScripts() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const gaId = (import.meta.env.VITE_GA_MEASUREMENT_ID || '').trim();
  if (gaId) {
    window[`ga-disable-${gaId}`] = true;
  }

  // Remove all script tags marked as non-essential
  const taggedScripts = document.querySelectorAll(
    `script[${NON_ESSENTIAL_ATTR}="${NON_ESSENTIAL_VALUE}"]`
  );
  taggedScripts.forEach((node) => {
    node.parentNode?.removeChild(node);
  });

  // Reset optional tracking globals
  try {
    delete window.gtag;
    delete window.fbq;
    delete window._fbq;
    if (Array.isArray(window.dataLayer)) {
      window.dataLayer.length = 0;
    }
  } catch {
    window.gtag = undefined;
    window.fbq = undefined;
  }

  // Expire any non-essential analytics/marketing cookies
  clearNonEssentialCookies();
  window.__VABC_NON_ESSENTIAL_SCRIPTS_ACTIVE__ = false;
}
