# ReStart AI Cloud

Career exploration and actionable next steps for people navigating a work transition.
Developed with love by Faiso for the IBM AI Challenge.

| Layer | Technology |
| --- | --- |
| Interface | React 18, TypeScript, Vite, Tailwind CSS, Framer Motion |
| API | Express 4, Zod, Google Gen AI SDK |
| Storage | Prisma 5 with SQLite |
| Quality | Vitest, Testing Library, ESLint, GitHub Actions, CodeQL |

## What works

- Submit a fictional or non-sensitive profile to generate three ranked opportunities.
- Explore career pivots, upskilling, and micro-business ideas with 12 action items over 30 days.
- Save recommendations, an opportunity selection, and task progress in a browser-specific guest session.
- View dashboard completion and a UTC-calendar-day activity streak.
- Try Maria, James, and Aisha's fictional demo profiles without a Gemini request.
- Navigate and refresh without losing saved results; deliberately delete the session with Start over.

Feasibility scores are **fit scores out of 100, not success probabilities or task completion percentages**.
TypeScript applies fixed weights to bounded AI-generated signals. Those inputs still depend on model judgment.
Costs and suggested resources are not independently verified. This is a challenge prototype, not a guarantee of employment or income.

## Local setup (PowerShell)

Use Node 22.13+ within the 22.x line, or a supported Node 24+ release, and npm 9+.
Run these commands inside `restart-ai-cloud`, not its parent folder:

```powershell
npm ci
if (!(Test-Path server/.env)) { Copy-Item .env.example server/.env }
```

If `server/.env` already exists, keep it; **do not overwrite it**. Edit it locally with a rotated Gemini key:

```dotenv
GEMINI_API_KEY=replace_with_your_rotated_key
GEMINI_MODEL=your_supported_model_id
DATABASE_URL=file:./dev.db
PORT=3001
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:5173
```

Confirm your model ID is available to your project. Omitting `GEMINI_MODEL` uses the default in `server/src/lib/gemini.ts`.
Never put the API key in client variables or commit `.env`. Revoke any previously exposed key.

```powershell
git check-ignore server/.env
npm run db:push --workspace=server
npm run db:seed --workspace=server
npm run dev --workspace=server
```

If Prisma warns about destructive changes, stop and back up the database before proceeding.
Seeding replaces only the fictional demo sessions. In a second terminal, from the same project folder:

```powershell
npm run dev --workspace=client
```

Open the frontend URL (normally http://localhost:5173). The backend on port 3001 is an API, not the development homepage.
Use the same hostname throughout; `localhost` and `127.0.0.1` have different cookie scopes.
If port 3001 is occupied, check the existing server instead of launching another copy.

## Guest demo

Choose Try Demo, switch between the three personas, open a plan, and view the dashboard.
The client requests fictional seeded sessions from `/api/sessions/demo`. If unavailable, it uses bundled fictional mock data.
Demo checkbox changes are temporary; they do not overwrite a live session or the shared seed records.
Exit the demo to return to the saved live session.

## Quality checks

```powershell
npm run lint
npm run typecheck
npm test
npm run test:coverage
npm run build
npm audit
```

Coverage measures **all server source files** except tests and enforces an 80% aggregate minimum for statements, branches, functions, and lines.
Open `server/coverage/index.html` after the coverage command. Most API tests mock Prisma; a disposable SQLite integration test checks real persistence and ownership. All Gemini calls are mocked in tests.
GitHub CI runs these code checks and server coverage; CodeQL runs separately. A successful scan is not a guarantee of no vulnerabilities.

## Production execution

Build first with `npm ci` and `npm run build`. Inject `NODE_ENV=production`, an HTTPS `CLIENT_ORIGIN`,
`GEMINI_API_KEY`, the chosen `GEMINI_MODEL`, and a persistent `DATABASE_URL` into the server environment.
Then run `npm start`. Runtime TypeScript uses `tsx`, so the current deployment must install development dependencies too.
Serve through HTTPS: production guest cookies have the Secure flag and will not work on plain HTTP.
See [deployment instructions](docs/DEPLOYMENT.md). No public deployment is created by these workflows.

## Data and limitations

- The profile is sent to Gemini; the original form fields are **not stored in SQLite**. Generated recommendations may repeat information from the profile.
- SQLite stores recommendations, plan items, selection, and completion timestamps. The browser holds a 30-day HttpOnly guest cookie.
- No accounts, cross-device access, password recovery, or automatic database expiry/retention cleanup.
- Losing the cookie makes the saved session inaccessible through the UI; back up storage appropriately and use fictional data for judging.
- Standalone `estimatedCostUSD`, `risks`, and scoring signal fields are currently not persisted; saved content is limited to the schema documented in the API reference.
- SQLite on one persistent instance is the prototype deployment model, not a horizontally scaled service.
- The separate `gemini-test` folder is outside this application and must not be included in its repository.

## Project references

- [Development plan and stage status](restart-ai-cloud-plan.md)
- [Architecture](docs/ARCHITECTURE.md)
- [API reference](docs/API.md)
- [Contributing and verification](docs/CONTRIBUTING.md)
- [Route security review and remaining limits](docs/SECURITY.md)
