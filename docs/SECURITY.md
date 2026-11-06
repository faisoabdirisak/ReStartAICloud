# ST-5 route security review

Reviewed locally on 6 November 2026. This is a source review and automated regression exercise, not an independent penetration test or security certification.

## Route-by-route result

| Route | Checks reviewed | Result |
| --- | --- | --- |
| GET /health | Returns only process status | No configuration or secrets returned; not a dependency-readiness probe |
| POST /api/analyze | Input/output Zod schemas, body limit, AI rate limit, safe upstream/save failures, cookie creation | Secret non-leak tested; validated output persisted; fit inputs still rely on AI judgment |
| GET /api/sessions/me | Token lookup, missing token, public seed tokens, JSON response projection, storage failure | Guest access scoped to token; no token in JSON; no-store; DB failure now sanitized 500 rather than false empty response |
| PATCH /api/sessions/me/progress | Body validation, token, plan-item ownership, timestamp update, DB rejection | Other guests and public seed tokens cannot write; failed promises forwarded to safe error handler |
| PATCH /api/sessions/me/select | Body validation, opportunity ownership, null selection, DB rejection | Owned selections only; invalid/stale storage failures safely returned |
| DELETE /api/sessions/me | Token-scoped lookup, cascade delete, cookie clearing, origin gate, failure behavior | No other-session ID accepted; failed deletion no longer silently clears client state |
| POST /api/sessions/demo | Persona whitelist, token projection, read-only route, live-cookie preservation | Public fictional data only; no Set-Cookie or writes; public seed credentials blocked on live routes |
| Unknown /api routes | Production SPA boundary | JSON 404 instead of index.html |

## Common protections and fixes

- Helmet headers; 16 KB JSON limit; malformed JSON and oversized bodies have safe JSON errors.
- Restricted CORS with credentials plus an independent mutation Origin/fetch-metadata check. CORS alone is not a write authorization mechanism.
- HttpOnly, SameSite=Strict guest cookie; Secure in production. An opaque cookie is a bearer credential, not account authentication.
- Per-process analysis/session rate limits and no-store headers on API responses.
- Express 4 async route failures explicitly forwarded to error middleware. Raw database exceptions are not sent to the browser.
- New model-generated resource links accept only HTTP/HTTPS. Model output remains untrusted even after schema validation.
- Automated regression tests use fake credentials and mocked SDK boundaries, plus a disposable real SQLite persistence and guest-isolation check. No live Gemini requests made for this review.

## Remaining limits before broader use

- Profile text is sent to Gemini and may reappear in generated results. Do not collect sensitive information for the challenge demo.
- Raw profile fields are not persisted, but generated results are. Cookie expiry does not delete DB records: automatic retention cleanup is not implemented.
- Cookie loss means no recovery; no accounts or cross-device access. A stolen guest cookie can access that guest's data.
- Repeated valid analysis creates a new saved session; old sessions need an eventual retention policy.
- An IP rate limiter is not a global provider-spend cap. Proxy configuration and shared limiting need deployment-specific review.
- Prompt injection and misleading suggestions remain possible; schema validation and fixed scoring weights do not prove factual accuracy.
- Provider calls have no application-specific deadline/cancellation policy yet. Resource availability and cost/risk estimates are not independently verified.
- Standalone cost/risk fields and scoring signals are not saved. Scores are not success probabilities.
- SQLite concurrency, backups, production HTTPS, migrations, hosting, and dependency monitoring require operational work.
- No independent accessibility review, external penetration test, or deployed end-to-end assessment is claimed.

## Reproduce checks

`npm run lint`, `npm run typecheck`, `npm test`, `npm run test:coverage`, `npm run build`, `npm audit`.
Coverage includes all server production modules and enforces 80% on four aggregate metrics.
GitHub CodeQL success means the scan completed; inspect Security alerts and annotations separately.

References: [Express 4 async error handling](https://expressjs.com/en/guide/error-handling.html),
[Vitest coverage](https://vitest.dev/guide/coverage.html).
