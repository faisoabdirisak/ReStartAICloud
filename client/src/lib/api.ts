/**
 * Typed API client for the Express backend.
 * All calls go through the Vite dev-server proxy to /api.
 *
 * Errors are surfaced as ApiError instances with a human-readable message.
 * Raw server errors are never shown verbatim to the user.
 */
import type { AnalyzeRequest, Session } from '@restart-ai/shared';

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
      headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) },
    });
  } catch {
    throw new ApiError('Could not reach the server. Check your connection.', 0);
  }

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message =
      res.status === 400
        ? 'Some fields are invalid — please check your inputs.'
        : res.status === 429
          ? 'Too many requests. Please wait a moment before trying again.'
          : res.status >= 500
            ? 'The AI service is temporarily unavailable. Please try again shortly.'
            : 'Something went wrong. Please try again.';
    throw new ApiError(message, res.status, body.details);
  }

  return body as T;
}

export async function analyzeProfile(profile: AnalyzeRequest): Promise<Session> {
  return apiFetch<Session>('/api/analyze', {
    method: 'POST',
    body: JSON.stringify(profile),
  });
}
