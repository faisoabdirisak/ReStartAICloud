/**
 * Cookie-based guest session helpers.
 *
 * Each guest receives an opaque HttpOnly cookie containing a session ID.
 * The cookie value is looked up against the DB cookieToken column.
 * Sessions are never shared between guests — a guest can only read/modify
 * data tied to their own cookie token.
 *
 * Security properties:
 *   - HttpOnly: not readable by client JS
 *   - SameSite=Strict: CSRF protection for state-changing requests
 *   - Secure: set to true in production (HTTPS)
 *   - 30-day maxAge
 */
import type { Response, Request } from 'express';

export const SESSION_COOKIE = 'restart_sid';
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export function setSessionCookie(res: Response, sessionId: string): void {
  res.cookie(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: MAX_AGE_MS,
    path: '/',
  });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(SESSION_COOKIE, { path: '/' });
}

/**
 * Read the session token from the cookie — returns null if absent.
 * The returned value is the cookieToken (opaque), not the session ID.
 */
export function getSessionToken(req: Request): string | null {
  const val = req.cookies?.[SESSION_COOKIE];
  return typeof val === 'string' && val.length > 0 ? val : null;
}
