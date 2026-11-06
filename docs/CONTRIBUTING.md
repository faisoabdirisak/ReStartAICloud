# Contributing

Use Node 22.13+ in the 22.x line, or a supported Node 24+ release, with npm 9+.
Run commands from the application root. Use `npm ci` for the committed lockfile and consult README.md for local environment setup.
Do not change the separate `gemini-test` folder or commit credentials, SQLite files, generated build info, coverage, or verification logs.

## Changes and checks

1. Inspect the current plan and preserve its stage numbering.
2. Add behavior-focused regression tests for new functionality or a bug fix.
3. Run `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:coverage`, `npm run build`, and `npm audit`.
4. Review `git diff` and explicitly stage intended files. Never paste API keys into issues or reviews.
5. Keep docs and the existing plan accurate. Do not mark public deployment complete without a real verified deployment.

Server coverage must meet 80% aggregate statements, branches, functions, and lines across all `server/src` production code.
Do not lower thresholds or exclude difficult modules merely to pass CI. Mock Gemini and the SDK in automated tests.
Most route tests mock Prisma; `server/src/persistence.test.ts` also checks a disposable real SQLite database. Extend these checks when persistence behavior or migrations change.
Never test destructive schema changes against the user's development database.

## Manual acceptance

Submit a fictional profile; verify three results and plan content. Navigate Home -> Opportunities -> Dashboard.
Select an opportunity, complete tasks, refresh and reopen the same host in the same browser.
Switch demo personas and exit demo; the live results should remain unchanged. Confirm demo tasks do not mutate shared seed records.
Test Start over only on a disposable guest session. Check mobile layout and keyboard access before a submission.
Fit scores are not completion percentages; confirm the lower task progress changes on completion.

## Commit examples

- `feat: ...` for behavior, `fix: ...` for a defect, `test: ...` for tests, `docs: ...` for documentation.
- Emoji conventions used here include `🔒 fix: harden guest session API` and `📋 docs: update development status`.

PRs should describe the concrete change, tests run, and any data or deployment implications.
No automatic deployment is enabled by CI. Publishing, destructive migrations, and history rewrites require explicit authorization.
