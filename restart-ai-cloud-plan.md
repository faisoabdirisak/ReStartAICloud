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

**Non-goals:** Auth/accounts, payments, multi-user persistence, mobile-native app.

---

## Architecture

```
restart-ai-cloud/
├── client/          # React + Vite + TypeScript + Tailwind + Motion + Lucide
├── server/          # Express + TypeScript + Zod + Prisma (SQLite)
├── shared/          # Zod schemas + TypeScript types shared by both sides
├── .github/         # CI/CD workflows + CodeQL
├── prisma/          # schema.prisma + migrations
├── gemini-test/     # PRESERVED — not touched
└── docs/            # Architecture, API reference, contributing guide
```

**Data flow:**
1. Client form → POST `/api/analyze` → Zod validation → Gemini API call → structured JSON → Prisma save → response
2. Client polls GET `/api/sessions/:id` → renders cards + plan
3. Progress updates → PATCH `/api/sessions/:id/progress`

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

### ST-4 — Progress Dashboard & Guest Demo [-] in progress

> **Numbering note:** Our implementation work referred to session persistence as "ST-3", but in
> this plan ST-3 is *Opportunity Cards & 30-Day Plans UI* (already done) and ST-4 is this stage.
> The persistence work (HttpOnly cookie, `GET /me` restore, `PATCH /me/progress`, `PATCH /me/select`,
> `DELETE /me`) was delivered as part of completing ST-3 in the plan's own terms. The items below
> reflect what was additionally delivered at the ST-4 level.

**Intent:** Add the session progress dashboard, a guest demo mode with fictional personas, and the onboarding welcome screen so the app is judge-ready without real user data.

**Expected Outcomes:**
- [x] `Dashboard` page shows: completion % ring, per-opportunity progress bars, steps-complete counts, focus/select CTA — implemented as `DashboardPreview` component, rendered on the Dashboard nav page
- [ ] `Dashboard` page shows: streak counter — **not yet implemented**
- [x] `GuestDemoBar` banner at top of every page when in demo mode, with 3 persona switcher buttons
- [x] `OnboardingModal` appears on first visit (localStorage flag), explains the app in 3 slides with motion transitions
- [x] Dark/light theme toggle persists to `localStorage` — confirmed in `ThemeContext.tsx`
- [x] All demo data is clearly labelled fictional (disclaimer in UI) — "Demo mode — fictional data only" banner
- [x] Each demo persona has pre-seeded data available — `prisma/seed.ts` created with Maria/James/Aisha; note: guest demo currently uses in-memory mock data (`mockData.ts`) while `seed.ts` seeds the DB for the server-backed path
- [ ] Each demo persona served from a DB-seeded `Session` via the cookie/session route — `seed.ts` exists but `GuestDemoBar` loads `MOCK_OPPORTUNITIES` from client state, not via the server session routes; needs wiring

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
8. [ ] Wire `GuestDemoBar` persona selection to load DB-seeded sessions via server routes
9. [ ] Add streak counter to `DashboardPreview`
10. [ ] Write tests for `Dashboard` progress calculations and seed data shape

**Relevant Context:**
- Fictional personas: Maria — former retail manager, James — laid-off delivery driver, Aisha — ex-hospitality worker
- `prisma/seed.ts` uses stable cookie tokens (`demo-token-maria-*`, etc.) so sessions survive server restarts
- User manually verified (06 Nov 2026): data persists when navigating between Home, Opportunities, and Dashboard pages

**Status:** [-] in progress — core dashboard, onboarding, demo bar, theme persistence, and seed script done; streak counter, DB-backed demo sessions, and dashboard tests remain

---

### ST-5 — Quality, Security & CI/CD [-] in progress

**Intent:** Ensure the project meets IBM AI Challenge standards for code quality, security, testing coverage, and automated deployment.

**Expected Outcomes:**
- [x] GitHub Actions CI workflow runs on every PR: lint, typecheck, Vitest, build — `.github/workflows/ci.yml` created
- [x] CodeQL analysis workflow runs on push to `master` — `.github/workflows/codeql.yml` created
- [x] Helmet middleware present on all API responses — `app.use(helmet())` in `server/src/index.ts`
- [x] `GEMINI_API_KEY` only used server-side; `.env` excluded from git via `.gitignore`
- [x] Single-process deployment configured — Express serves `client/dist` as static files when `NODE_ENV=production` (`server/src/index.ts`)
- [x] Integration test for `POST /api/analyze` — 9 supertest tests in `analyze.test.ts` using mocked Gemini; already committed in `d2409e9`
- [x] Route security assertions — `sessions.test.ts` covers cookie isolation, ownership enforcement, and token non-disclosure; `analyze.test.ts` covers secret-leak prevention; all committed
- [ ] All Vitest suites pass with ≥80% coverage on `server/src/` — coverage config not yet added; CI runs tests but does not enforce threshold
- [ ] `docs/ARCHITECTURE.md` — not yet created
- [ ] `docs/API.md` — not yet created
- [ ] `docs/CONTRIBUTING.md` — not yet created
- [ ] `README.md` — not yet created (a write was interrupted mid-session; file confirmed absent)

**Todo List:**
1. [x] Create `.github/workflows/ci.yml` — lint, typecheck, test, build jobs
2. [x] Create `.github/workflows/codeql.yml` — CodeQL analysis for JS/TS
3. [x] Add `helmet` middleware to Express app
4. [x] Audit all routes: no secrets in responses, no raw errors leaked — enforced by tests (`cookieToken` non-disclosure, `GEMINI_API_KEY` non-leak, 401/403 ownership checks) and middleware (Helmet, Zod, rate-limit); no separate written audit doc produced
5. [ ] Add Vitest coverage config; enforce 80% threshold in CI
6. [x] Write integration test for `POST /api/analyze` using a mocked Gemini response — `analyze.test.ts` has 10 supertest tests under `POST /api/analyze` + 1 `GET /health` = 11 total; all mock `vi.mock('../lib/gemini.js')` so no real API key is needed in CI (committed in `f27e94c`, expanded in `d2409e9`)
7. [ ] Write `docs/ARCHITECTURE.md`, `docs/API.md`, `docs/CONTRIBUTING.md`
8. [ ] Write `README.md` with overview, feature list, Guest Demo instructions, tech stack badge table
9. [x] Configure deployment: Express serves `client/dist` as static files from `server/src/index.ts` when `NODE_ENV=production`

**Relevant Context:**
- `Helmet` defaults are sufficient; no custom CSP needed for MVP
- Single-process deployment: Express serves `client/dist` as static files from `server/src/index.ts`
- CodeQL default query suite for JavaScript is sufficient
- Test suite (committed in `d2409e9`): analyze.test.ts 11 · sessions.test.ts 14 · scoring.test.ts 6 · index.test.ts 1 = **32 server** · shared 10 · client 9 (AppShell 4 + components 5) = **51 total**

**Status:** [-] in progress — CI/CD workflows, Helmet, static serving, integration tests, and route audit assertions done; coverage enforcement threshold, docs folder, and README remain

---

## First Agent Task & Acceptance Criteria

**Task:** Implement **ST-1 — Project Scaffold & Design System**

**Acceptance Criteria:**

1. Running `pnpm install` at repo root installs all workspace dependencies without errors.
2. `pnpm --filter client dev` serves the app at `localhost:5173` showing: Inter font, themed background (dark default), nav bar with logo and a working light/dark toggle.
3. `pnpm --filter server dev` starts Express and `GET http://localhost:3001/health` returns `{"status":"ok"}`.
4. `pnpm test` runs Vitest across all packages and exits 0 (no failing tests; placeholder test file per package is sufficient).
5. `pnpm --filter client build` exits 0 with no TypeScript errors.
6. `prisma/schema.prisma` defines `Session`, `Opportunity`, `PlanItem`, `ProgressEntry` with correct relation fields.
7. `tailwind.config.ts` contains all colour tokens from the Design System table verbatim.
8. `.env.example` documents `GEMINI_API_KEY`, `DATABASE_URL`, `PORT`, `NODE_ENV`, `CLIENT_ORIGIN`.
9. `shared/` package exports `AnalyzeRequest`, `Opportunity`, `PlanItem`, `Session` Zod schemas with correct TypeScript inference types.
10. `gemini-test/` directory is untouched (verified via `git status`).
