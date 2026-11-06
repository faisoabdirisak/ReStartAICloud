/**
 * Typed API client for the Express backend.
 * All calls go through the Vite dev-server proxy to /api.
 * credentials: 'include' is set so the HttpOnly session cookie is sent.
 *
 * Errors are surfaced as ApiError instances with a human-readable message.
 * Raw server errors are never shown verbatim to the user.
 */
import type { AnalyzeRequest, Session, ProgressUpdate, SelectOpportunity } from '@restart-ai/shared';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function apiFetch<T>(path: string, init: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      ...init,
      credentials: 'include', // send HttpOnly cookie
      headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) },
    });
  } catch {
    throw new ApiError('Could not reach the server. Check your connection.', 0);
  }

  // 204 No Content — return undefined cast to T
  if (res.status === 204) return undefined as T;

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message =
      res.status === 400
        ? 'Some fields are invalid — please check your inputs.'
        : res.status === 401 || res.status === 403
          ? 'Session not found or access denied. Please start over.'
          : res.status === 429
            ? 'Too many requests. Please wait a moment before trying again.'
            : res.status >= 500
              ? 'The AI service is temporarily unavailable. Please try again shortly.'
              : 'Something went wrong. Please try again.';
    throw new ApiError(message, res.status, body.details);
  }

  return body as T;
}

/** Submit profile → Gemini → returns Session (also sets HttpOnly cookie) */
export async function analyzeProfile(profile: AnalyzeRequest): Promise<Session> {
  return apiFetch<Session>('/api/analyze', {
    method: 'POST',
    body: JSON.stringify(profile),
  });
}

/**
 * Restore saved session from HttpOnly cookie.
 * Returns null when no session exists (204 response).
 */
export async function restoreSession(): Promise<Session | null> {
  try {
    const session = await apiFetch<Session | undefined>('/api/sessions/me', { method: 'GET' });
    return session ?? null;
  } catch (err) {
    if (err instanceof ApiError && err.status === 0) throw err; // network error — let caller handle
    return null; // cookie absent or session expired — treat as empty
  }
}

/** Persist a plan item toggle */
export async function updateProgress(update: ProgressUpdate): Promise<void> {
  return apiFetch<void>('/api/sessions/me/progress', {
    method: 'PATCH',
    body: JSON.stringify(update),
  });
}

/** Persist the selected opportunity (null to deselect) */
export async function selectOpportunity(body: SelectOpportunity): Promise<void> {
  return apiFetch<void>('/api/sessions/me/select', {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

/** Delete the session and clear the cookie (start over) */
export async function clearSession(): Promise<void> {
  return apiFetch<void>('/api/sessions/me', { method: 'DELETE' });
}
