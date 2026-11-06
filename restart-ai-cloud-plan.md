# ReStart AI Cloud — IBM AI Challenge Plan

## Overview

**Goal:** Build a production-quality, full-stack AI web application for the IBM AI Challenge.
A displaced worker arrives, describes their situation, and the app returns:
- 3 ranked opportunity cards (career pivots, upskilling paths, or micro-business ideas)
- Transparent feasibility scores with reasoning
- A personalised 30-day action plan per opportunity
- A progress dashboard to track completion

**Approach:** Greenfield monorepo. React/Vite/TS frontend + Express/TS backend in a single repo.
No authentication in the MVP. A "Guest Demo" mode loads fictional personas so judges can explore without entering real data. The `gemini-test/` directory is preserved and never modified.

**Non-goals:** Auth/accounts, payments, account-based cross-device access, mobile-native app. Browser-specific guest persistence is implemented.

---

## Architecture

```
restart-ai-cloud/
├── client/          # React + Vite + TypeScript + Tailwind + Motion + Lucide
├── server/          # Express + TypeScript + Zod + Prisma (SQLite)
├── shared/          # Zod schemas + TypeScript types shared by both sides
├── .github/         # CI/CD workflows + CodeQL
├── prisma/          # schema.prisma + migrations
└── docs/            # Architecture, API reference, contributing guide
```

**Data flow:**
1. Client form → POST `/api/analyze` → Zod validation → Gemini API call → structured JSON → Prisma save → response
2. Client restores GET `/api/sessions/me` using an HttpOnly cookie → renders cards + plan
3. Progress updates → PATCH `/api/sessions/me/progress`

The separate `gemini-test/` folder is outside this application repository. Raw profile form fields are sent to Gemini but not saved in SQLite; generated results and task progress are saved.

---

## Design System

| Token | Light | Dark |
|---|---|---|
| Background | `#F8FAFC` | `#0D1117` |
| Surface | `#FFFFFF` | `#161B22` |
| Surface-elevated | `#F1F5F9` | `#21262D` |
| Primary | `#6366F1` (indigo-500) | same |
| Primary-hover | `#4F46E5` | same |
| Success | `#10B981` | same |
| Warning | `#F59E0B` | same |
| Danger | `#EF4444` | same |
| Text-primary | `#0F172A` | `#F0F6FC` |
| Text-muted | `#64748B` | `#8B949E` |
| Border | `#E2E8F0` | `#30363D` |

**Typography:** Inter (variable font via Google Fonts)
**Motion:** Framer Motion — fade-up on mount, stagger children, skeleton pulse for loading
**Icons:** Lucide React
**Cards:** Glassmorphism on dark, subtle shadow on light; hover lift + border glow
**Feasibility score:** Animated radial progress ring, colour-coded by tier (green/amber/red)
**Responsive:** Mobile-first, single-column → 3-column grid at md breakpoint

---

## Milestones

### M1 — Project Scaffold & Design System
Establish the full repo structure, tooling, and visual foundations so every subsequent milestone builds on a stable base.

### M2 — Core AI Pipeline
Wire the Gemini API (reusing patterns from `gemini-test/`) through a secure Express backend, returning validated, typed opportunity data.

### M3 — Opportunity Cards & 30-Day Plans UI
Render the three ranked cards with feasibility scores and expand each into a full 30-day action plan.

### M4 — Progress Dashboard & Guest Demo
Add the progress-tracking dashboard, guest demo mode with fictional personas, onboarding flow, and polish animations/loading states.

### M5 — Quality, Security & CI/CD
Vitest unit + integration tests, CodeQL scanning, GitHub Actions CI pipeline, deployment config, and documentation.

---

## Sub-Tasks

---

### ST-1 — Project Scaffold & Design System [x] done

**Intent:** Create the monorepo skeleton with all tooling configured so the team can immediately write typed, linted, tested code with the design system in place.

**Expected Outcomes:**
- `client/` boots with `vite dev` showing a themed shell (dark/light toggle, Inter font, Tailwind tokens)
- `server/` boots with `ts-node` / `tsx` serving `GET /health → 200`
- `shared/` exports base Zod schemas importable by both sides
- Prisma schema exists with `Session`, `Opportunity`, `PlanItem` models
- Tailwind config encodes all design tokens from the Design System section above
- Vitest configured for both client and server
- ESLint + Prettier configured
- `.env.example` documents `GEMINI_API_KEY`, `DATABASE_URL`, `PORT`, `NODE_ENV`

**Todo List:**
1. Initialise root `package.json` as a pnpm workspace with `client/`, `server/`, `shared/` members
2. Scaffold `client/` with Vite + React + TypeScript template; install Tailwind, Motion, Lucide
3. Scaffold `server/` with Express + TypeScript; install Zod, Prisma, tsx
4. Create `shared/` package with base Zod schemas (`AnalyzeRequest`, `Opportunity`, `PlanItem`, `Session`)
5. Configure Tailwind with design tokens (colours, typography, radius, shadow)
6. Create `ThemeProvider` context + `useTheme` hook + dark-mode toggle component
7. Create `AppShell` layout with nav bar (logo, theme toggle) and main content area
8. Define Prisma schema: `Session`, `Opportunity`, `PlanItem`, `ProgressEntry` models
9. Add `vitest.config.ts` to root and both packages
10. Add `.env.example`; add `.gitignore` excluding `.env`, `node_modules`, `dist`, `*.db`

**Relevant Context:**
- Design tokens table above must be mirrored exactly in `tailwind.config.ts`
- `gemini-test/` must not be modified or imported from

**Status:** [x] done

---

### ST-2 — Core AI Pipeline [x] done

**Intent:** Build the secure server-side AI pipeline so the client can submit a profile and receive structured, validated opportunity data from Gemini.

**Expected Outcomes:**
- `POST /api/analyze` accepts a `AnalyzeRequest` body, validates with Zod, calls Gemini, returns `Session` with 3 `Opportunity` objects each containing `feasibilityScore`, `reasoning`, and `planItems`
- Gemini prompt is crafted server-side only (API key never exposed to client)
- Response schema is enforced with Zod before writing to DB
- Rate-limiting middleware on the route (express-rate-limit)
- Input sanitisation: no PII stored beyond what user explicitly provides
- Unit tests cover: Zod validation rejects bad input, happy-path returns typed data, Gemini error surfaces as 502 with safe message

**Todo List:**
1. Create `server/src/lib/gemini.ts` — wrapper that calls Gemini Flash-Lite, mirrors the pattern from `gemini-test/` (examine first, do not copy files)
2. Create system prompt template in `server/src/prompts/analyze.ts` — defines output JSON schema in the prompt
3. Create `server/src/routes/analyze.ts` — POST handler with Zod body parse, calls gemini lib, saves to Prisma, returns typed response
4. Add `express-rate-limit` middleware scoped to `/api/analyze`
5. Add `cors` middleware restricted to `CLIENT_ORIGIN` env var
6. Validate Gemini's raw response against `OpportunityArraySchema` before saving
7. Write unit tests for the route handler (mock Gemini + Prisma)

**Relevant Context:**
- Zod schemas defined in `shared/` in ST-1 are the single source of truth
- `gemini-test/` contains the verified API call pattern — inspect before writing `gemini.ts`
- Gemini model: `gemini-2.0-flash-lite` (or the exact model ID confirmed in `gemini-test/`)

**Status:** [x] done

---

### ST-3 — Opportunity Cards & 30-Day Plans UI [x] done

**Intent:** Deliver the primary value screen — three ranked opportunity cards with feasibility scores and expandable 30-day action plans.

**Expected Outcomes:**
- `ProfileForm` component collects: current role, skills, location, constraints (textarea), goals
- Submitting shows a loading state (skeleton cards + animated progress indicator)
- Three `OpportunityCard` components render: title, category badge, feasibility ring (animated radial SVG), one-line summary, "View Plan" CTA
- Clicking "View Plan" expands/navigates to `PlanView` — a 30-day checklist grouped by week, each item checkable
- Checking an item calls `PATCH /api/sessions/:id/progress`
- Error state shows friendly message + retry button
- Fully responsive: stacked on mobile, 3-column grid on ≥md

**Todo List:**
1. Create `ProfileForm` with controlled inputs, client-side Zod validation, submit handler calling `POST /api/analyze`
2. Create `SkeletonCards` loading state (3 pulsing card placeholders)
3. Create `OpportunityCard` component with all fields from `Opportunity` type
4. Create `FeasibilityRing` — animated SVG radial progress, colour-coded by score tier
5. Create `PlanView` — weekly grouped checklist, each item with checkbox + label + optional resource link
6. Wire `PATCH /api/sessions/:id/progress` on checkbox toggle
7. Add stagger entrance animation (Framer Motion) to card grid
8. Add error boundary + error state UI
9. Write component tests for `OpportunityCard` and `FeasibilityRing` (Vitest + Testing Library)

**Relevant Context:**
- `FeasibilityRing` score tiers: 0–49 red, 50–74 amber, 75–100 green
- Motion: cards fade-up with 0.1s stagger delay per card
- All API calls go through a `client/src/lib/api.ts` fetch wrapper

**Status:** [x] done

---

### ST-4 — Progress Dashboard & Guest Demo [x] done

> **Numbering note:** Our implementation work referred to session persistence as "ST-3", but in
> this plan ST-3 is *Opportunity Cards & 30-Day Plans UI* (already done) and ST-4 is this stage.
> The persistence work (HttpOnly cookie, `GET /me` restore, `PATCH /me/progress`, `PATCH /me/select`,
> `DELETE /me`) was delivered as part of completing ST-3 in the plan's own terms. The items below
> reflect what was additionally delivered at the ST-4 level.

**Intent:** Add the session progress dashboard, a guest demo mode with fictional personas, and the onboarding welcome screen so the app is judge-ready without real user data.

**Expected Outcomes:**
- [x] `Dashboard` page shows: completion % ring, per-opportunity progress bars, steps-complete counts, focus/select CTA — implemented as `DashboardPreview` component, rendered on the Dashboard nav page
- [x] `Dashboard` page shows: streak counter 
- [x] `GuestDemoBar` banner at top of every page when in demo mode, with 3 persona switcher buttons
- [x] `OnboardingModal` appears on first visit (localStorage flag), explains the app in 3 slides with motion transitions
- [x] Dark/light theme toggle persists to `localStorage` — confirmed in `ThemeContext.tsx`
- [x] All demo data is clearly labelled fictional (disclaimer in UI) — "Demo mode — fictional data only" banner
- [x] Each demo persona has pre-seeded data available — `prisma/seed.ts` created with Maria/James/Aisha; the client loads seeded fictional data through the demo API, with bundled mock data as an offline fallback
- [x] Each demo persona served from a DB-seeded `Session` via `POST /api/sessions/demo`; this read-only route never replaces the live cookie, and demo progress stays in client memory

> **Session route note:** the plan specifies `GET /api/sessions/:id`; the implementation uses
> `GET /api/sessions/me` (cookie-identified, no ID in URL). This is intentional — there is no
> authentication and exposing numeric/CUID session IDs in URLs would allow enumeration. The
> cookie-based route satisfies the same functional requirement.

**Todo List:**
1. [x] Create `Dashboard` page component with completion metrics and plan item list
2. [x] Create session restore route — implemented as `GET /api/sessions/me` (see note above)
3. [x] Seed script `prisma/seed.ts` — 3 fictional personas (Maria, James, Aisha) with full opportunity + plan data
4. [x] Create `GuestDemoBar` component with persona switcher; demo session held in React state (`useSession` hook)
5. [x] Create `OnboardingModal` with 3 slides (`AnimatePresence` transitions)
6. [x] Persist theme preference to `localStorage` in `ThemeProvider`
7. [x] Add disclaimer copy to `GuestDemoBar`
8. [x] Wire `GuestDemoBar` persona selection to load DB-seeded sessions via server routes
9. [x] Add streak counter to `DashboardPreview`
10. [x] Write tests for `Dashboard` progress calculations and seed data shape

**Relevant Context:**
- Fictional personas: Maria — former retail manager, James — laid-off delivery driver, Aisha — ex-hospitality worker
- `prisma/seed.ts` uses stable cookie tokens (`demo-token-maria-*`, etc.) so sessions survive server restarts
- User manually verified (06 Nov 2026): data persists when navigating between Home, Opportunities, and Dashboard pages

**Status:** [x] done

---

### ST-5 — Quality, Security & CI/CD [x] implemented and locally verified

**Intent:** Complete code-quality checks, measured server coverage, a documented route review, deployment preparation, and project documentation.

**Expected Outcomes:**
- [x] GitHub CI runs lint, typechecks, tests, build, and server coverage on pushes/PRs to main/master using Node 22.
- [x] CodeQL scans JavaScript/TypeScript on main/master pushes/PRs and its weekly schedule. The previous workflow run was user-confirmed green; the new CI coverage gate still needs a post-push run.
- [x] Coverage includes all server source modules except tests, with 80% aggregate thresholds for statements, branches, functions, and lines.
- [x] Existing mocked analysis tests and new SDK, async error, cross-origin, demo-token, and persistence regression tests.
- [x] Route-by-route review recorded in `docs/SECURITY.md`, including remaining operational limitations.
- [x] Safe JSON errors, limited request bodies, guest ownership, cross-origin mutation checks, API no-store headers, and HTTP/HTTPS-only generated resource links.
- [x] Single-process production start command and built frontend serving verified locally. No cloud deployment is claimed.
- [x] `README.md`, `docs/ARCHITECTURE.md`, `docs/API.md`, `docs/CONTRIBUTING.md`, and `docs/DEPLOYMENT.md` added.

**Todo List:**
1. [x] Maintain `.github/workflows/ci.yml` — lint, typecheck, tests, 80% server coverage gate, build.
2. [x] Maintain `.github/workflows/codeql.yml` — JS/TS scanning; security alerts remain a separate review from successful execution.
3. [x] Helmet middleware on responses; API origin controls and rate limits reviewed.
4. [x] Audit every route for secret exposure, guest ownership, and safe errors; fixes and regression evidence documented in `docs/SECURITY.md`.
5. [x] Add V8 coverage configuration/provider matching Vitest 5.1.0; enforce 80% across all four aggregate metrics in CI.
6. [x] Keep mocked POST `/api/analyze` tests, and add a real disposable SQLite integration check for restore, selection, progress, guest isolation, and deletion. No live Gemini requests in tests.
7. [x] Write architecture, API, contributor, security-review, and deployment documents.
8. [x] Write README with setup, fictional guest demo, working features, checks, and honest limitations.
9. [x] Configure production serving/startup and verify health, homepage, SPA fallback, and API JSON 404 on a temporary local process.

**Verification record — 6 November 2026:**
- 111 tests passed: 21 shared, 65 server, 25 client.
- Server coverage: statements 95.12%, branches 92.92%, functions 97.36%, lines 95.33%; the 80% gate passes. See `server/coverage/index.html` locally.
- Lint, all workspace typechecks, and production build passed.
- Local production smoke test passed without provider calls or querying the user's database.
- Production dependencies audited with `npm audit`; no findings at the time of verification.
- Browser navigation/progress/demo behavior was manually verified by the user before this stage. After the security changes, repeat the manual acceptance steps in CONTRIBUTING.md.
- Local verification does not replace the new GitHub run after these files are pushed.

**Limitations and follow-up (not claimed complete):**
- No public hosting deployment, accounts, cross-device access, retention cleanup, or production backup/migration operations.
- Raw profile fields, standalone estimated cost/risk fields, and AI scoring inputs are not persisted in the current DB schema.
- AI reasoning and fit signals remain unverified estimates; a fit score is not a probability of success.
- Deployment-specific proxy trust, shared rate limiting, provider spend controls/timeouts, and real user evaluation remain follow-up work.

**Status:** [x] ST-5 implementation complete locally; review, commit, push, rerun GitHub Actions, and repeat the browser acceptance checks before release.

---
