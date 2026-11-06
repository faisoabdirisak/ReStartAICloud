# Architecture

## Boundaries

`client/` is the React UI; `shared/` supplies Zod schemas and types; `server/` exposes the Express API.
`prisma/schema.prisma` defines SQLite persistence. npm workspaces and the root lockfile are the dependency source of truth.
The separate `gemini-test` directory is outside this repository; the application neither imports nor requires it.

## Analysis flow

1. ProfileForm validates a non-sensitive profile and posts JSON to `/api/analyze`.
2. The server validates bounds, builds a prompt, and calls Gemini using a server-only environment key.
3. JSON fences are removed and the model output is validated: exactly three opportunities, each with 12 plan items.
4. TypeScript computes a rounded score: skill fit 40%, affordability 30%, launch speed 20%, simplicity 10%.
   Launch speed maps 1 day to 100 and 365 days to 0; simplicity maps complexity 1 to 100 and 10 to 0.
   Scores depend on AI-supplied signals; deterministic arithmetic does not make those inputs objective.
5. Prisma saves opportunity and plan data, and the server sets an opaque HttpOnly guest cookie.
6. The browser stores the returned session in `useSession`; GET `/api/sessions/me` restores it after reload.

## Persistence and progress

Session owns Opportunity; Opportunity owns PlanItem; each PlanItem has at most one ProgressEntry.
Session also holds selectedOpportunityId. Cascading deletion removes the session's results and progress.
Task completion is persisted through PATCH `/api/sessions/me/progress`; the dashboard computes percentages from completed items.
Streaks count consecutive UTC calendar days ending today or yesterday with at least one currently completed task.
Undoing completion removes its timestamp from that calculation. Re-checking a task records a new completion time.
The original profile, dedicated cost/risk fields, and scoring inputs are not stored by the current database schema.

## Guest identity and demo

The random guest token is an access credential. It is sent only in an HttpOnly, SameSite=Strict cookie,
with Secure enabled in production, and never returned as a JSON field. There is no account recovery or cross-device identity.
Fictional seeded personas are publicly readable through a whitelist of persona IDs. Public seed tokens cannot authenticate live API requests.
Demo state remains in memory separately from a live session and has a bundled mock fallback.

## Development and production

Vite on 5173 proxies `/api` to Express on 3001. Production Express serves `client/dist` and a non-API SPA fallback.
Unknown API routes return JSON 404; API failures return sanitized JSON instead of raw exceptions.
The production runtime uses tsx and requires installed development dependencies. See DEPLOYMENT.md for the environment and storage model.

## Boundaries of verification

Most Vitest route tests mock Prisma and Gemini; SDK-boundary tests mock the Google SDK. A disposable SQLite integration test verifies actual
schema setup, persistence, ownership and deletion. No test establishes a live provider connection or a production database migration. Coverage is a useful regression measure, not proof of correctness.
The user has manually exercised navigation, restored progress, demo separation, and streak behavior in the local application.
