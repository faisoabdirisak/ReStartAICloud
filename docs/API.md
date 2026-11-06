# API reference

Development base URL: `http://localhost:3001`. The frontend normally uses its same-origin Vite proxy.
Use `Content-Type: application/json` and include browser credentials. Never put guest tokens into URLs.
All `/api` responses are marked `Cache-Control: no-store`. Cross-origin browser mutations are rejected.

## Routes

| Method and path | Input | Success | Key failures |
| --- | --- | --- | --- |
| GET `/health` | None | 200 `{ "status": "ok" }` | Health does not check DB or Gemini availability |
| POST `/api/analyze` | Profile below | 200 Session + Set-Cookie | 400 validation, 403 origin, 413 size, 429 rate limit, 500 save, 502 AI |
| GET `/api/sessions/me` | Guest cookie | 200 Session, or 204 when absent/unrecognized | 500 storage failure |
| PATCH `/api/sessions/me/progress` | `{ "planItemId": "...", "isCompleted": true }` | 204 | 400 body, 401 cookie, 403 item ownership, 500 storage |
| PATCH `/api/sessions/me/select` | `{ "opportunityId": "..." }` or null | 204 | 400 body, 401 cookie, 403 opportunity ownership, 500 storage/stale session |
| DELETE `/api/sessions/me` | Guest cookie | 204, clears cookie; deletes owned session if present | 403 origin, 500 storage |
| POST `/api/sessions/demo` | `{ "personaId": "maria" }` (`james`, `aisha` also allowed) | 200 fictional Session; no cookie changes | 400 persona, 404 not seeded, 500 storage |

AI analysis: 10 requests per 15 minutes per IP. Session endpoints: 120 requests per minute per IP.
Limits are in-memory per server process. Browser mutations require an allowed Origin when supplied and reject cross-site fetch metadata.
A non-browser client may omit Origin, but ownership requirements still apply.

## Profile

```json
{
  "currentRole": "Retail manager",
  "skills": "Customer service and team leadership",
  "experience": "Six years leading a retail team",
  "location": "Chicago, IL",
  "startupBudget": 500,
  "interests": "Remote operations",
  "constraints": "Ten hours weekly for training",
  "goals": "Explore a practical career transition"
}
```

Required: currentRole (1-200 chars), skills (1-1000), experience (1-500), location (1-200), goals (1-1000).
Optional: startupBudget (integer USD, 0-1,000,000; default 0), interests (up to 500), constraints (up to 1000).
The body limit is 16 KB. Use fictional data; profile contents are sent to the AI provider.

## Session response

Session contains `id`, ISO `createdAt`/`updatedAt`, nullable `selectedOpportunityId`, and `opportunities` sorted by rank.
Each opportunity contains `id`, `title`, `category`, `summary`, `reasoning`, `feasibilityScore`, `rank`, and `planItems`.
Each plan item contains `id`, `day`, `week`, `title`, optional `description`/`resourceUrl`, `isCompleted`, and nullable `completedAt`.
New AI resource URLs are restricted to HTTP or HTTPS. Optional absent values may be omitted from JSON.
The guest `cookieToken`, API key, and original profile are not in this response.
New opportunities include nullable `explanation`:

- `version: 1`, `source: "ai-estimate"` or `"fictional-demo"`.
- `estimatedCostUSD`: nonnegative integer or null (unknown, distinct from 0).
- `risks`: up to 500 characters or null.
- `assumptions` and `questionsToVerify`: up to six strings each, at most 300 characters per string.
- `signals`: skillFitPct and affordabilityPct (0-100), launchTimeDays (1-365), complexityScore (1-10).

The server creates this envelope from validated model output and stores it as versioned JSON text in SQLite.
The same version-1 formula supplies server scores and UI contributions. Assumptions and questions default to empty arrays if absent,
not invented statements. Old, malformed, or unsupported saved explanations are returned as null without changing the saved score or plan.
Demo signals are deliberately synthetic; only new live analyses have AI-estimated inputs.

## Errors and cookies

Validation errors use `{ "error": "Invalid request", "details": { "field": ["message"] } }`.
Other errors use a safe `{ "error": "..." }` message, never a raw stack or database error.
`restart_sid` is HttpOnly, SameSite=Strict, Path=/, with a 30-day maximum age and Secure in production.
Public fictional seed tokens are rejected as guest credentials. Demo progress is temporary client state.
