# Deployment preparation

This repository supports a **single Express process with SQLite on persistent storage**. It is not yet published by these workflows.

## Runtime

1. Provision a Node 22.13+ (22.x) or supported 24+ environment with HTTPS and a persistent writable volume.
2. Install using `npm ci` (development dependencies are required by the current tsx runtime).
3. Run `npm run build` to create `client/dist`; server/shared build scripts typecheck rather than emit standalone JavaScript.
4. Inject server-only environment variables through the host's secret manager:
   `GEMINI_API_KEY`, `GEMINI_MODEL`, `NODE_ENV=production`, `CLIENT_ORIGIN=https://your-public-host`,
   `DATABASE_URL=file:/absolute/persistent/path/restart.db`, and the host's `PORT`.
5. Run `npm run db:generate --workspace=server` if the host did not generate Prisma Client during install.
6. Back up any existing database, inspect schema changes, then run `npm run db:push --workspace=server` as a controlled release step.
   Do not use `--accept-data-loss` or reset against user data. A migration/backup process is needed before operating a production service.
7. With those variables injected, seed fictional personas once using
   `npx tsx prisma/seed.ts` from the root. This bypasses the development-only seed script's local `.env` requirement.
8. Run `npm start`; check `/health`, the homepage, and a disposable guest session over HTTPS.

The environment must be available to every setup and start command; `npm start` intentionally does not load a development `.env` file.
Use the same public origin for UI and API so the Strict cookie works. Existing development cookies do not transfer to the deployed host.

## Operational limits

- Secure cookies require HTTPS. Do not weaken the production flag to make an HTTP preview work.
- The health route checks process responsiveness only; add private DB/provider checks and monitoring before real-world operation.
- Keep one application instance with a persistent SQLite volume. Ephemeral or serverless disks lose sessions; horizontal replicas need shared storage, a supported database, and a shared rate-limit store.
- If the host is behind a proxy, configure Express trust proxy only for the actual trusted topology. The current default is conservative and may rate-limit all visitors under a proxy's IP.
- Backups, account recovery, automatic session expiry/deletion, and service-level guarantees are not implemented.
- Helmet's default content policy may block external Google Fonts; system font fallback is available. Review external assets before changing the policy.
- There is no automated deploy job or tested hosting configuration in CI. Choose and verify a hosting service separately.
