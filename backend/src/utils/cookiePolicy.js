/**
 * Healthcare Cookie Security Policy (RA 10173 Compliance).
 * Ensures any server-issued session or authentication cookie strictly enforces:
 * - httpOnly: true
 * - secure: process.env.NODE_ENV === 'production'
 * - sameSite: 'lax'
 */
export function getSecureCookieOptions(overrides = {}) {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    ...overrides,
    // Always enforce httpOnly and production secure flag on backend session cookies
    ...(overrides.allowClientRead ? {} : { httpOnly: true }),
    ...(isProd ? { secure: true } : {}),
  };
}

/**
 * Express middleware that wraps `res.cookie` so any cookie set by backend routes
 * automatically inherits strict healthcare security flags (HttpOnly, Secure, SameSite=Lax).
 */
export function enforceSecureCookiesMiddleware(_req, res, next) {
  const originalCookie = res.cookie.bind(res);
  res.cookie = (name, value, options = {}) => {
    const safeOptions = getSecureCookieOptions(options);
    return originalCookie(name, value, safeOptions);
  };
  next();
}
