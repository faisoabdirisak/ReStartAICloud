import { afterAll, beforeAll, expect, it, vi } from 'vitest';
import request from 'supertest';
import { mkdtempSync, unlinkSync, rmdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
vi.mock('./lib/gemini.js', () => ({
  generateContent: vi.fn(), GeminiError: class extends Error {},
}));
import { generateContent } from './lib/gemini.js';
const folder = mkdtempSync(path.join(tmpdir(), 'restart-st5-db-'));
const database = path.join(folder, 'integration.db');
let app: (typeof import('./index.js'))['default'];
let prisma: (typeof import('./lib/db.js'))['prisma'];
beforeAll(async () => {
  vi.stubEnv('DATABASE_URL', `file:${database.replaceAll('\\', '/')}`);
  vi.stubEnv('NODE_ENV', 'test');
  writeFileSync(database, '');
  const root = fileURLToPath(new URL('../../', import.meta.url));
  execFileSync(process.execPath, [path.join(root, 'node_modules/prisma/build/index.js'), 'db', 'push',
    '--schema', path.join(root, 'prisma/schema.prisma'), '--skip-generate'], { env: process.env, stdio: 'pipe', timeout: 20_000 });
  ({ prisma } = await import('./lib/db.js'));
  ({ default: app } = await import('./index.js'));
}, 30_000);
afterAll(async () => {
  await prisma?.$disconnect();
  for (const suffix of ['', '-journal', '-wal', '-shm']) {
    try { unlinkSync(database + suffix); } catch { /* absent SQLite auxiliary file */ }
  }
  try { rmdirSync(folder); } catch { /* keep diagnostics if an unexpected file remains */ }
  vi.unstubAllEnvs();
});
it('persists results, selection and progress, enforces ownership, and deletes only the current guest', async () => {
  const raw = { opportunities: ['career-pivot', 'upskilling', 'micro-business'].map((category, i) => ({
    title: `Fictional opportunity ${i + 1}`, category, summary: 'Fictional summary', reasoning: 'Fictional reasoning',
    signals: { skillFitPct: 80, affordabilityPct: 70, launchTimeDays: 30, complexityScore: 3 },
    planItems: Array.from({ length: 12 }, (_, j) => ({ day: j + 1, week: Math.floor(j / 3) + 1, title: `Task ${j + 1}` })),
  })) };
  vi.mocked(generateContent).mockResolvedValue(JSON.stringify(raw));
  const profile = { currentRole: 'Fictional worker', skills: 'Planning', experience: 'Two years', location: 'Chicago', goals: 'Explore options' };
  const guest = request.agent(app);
  const created = await guest.post('/api/analyze').send(profile);
  expect(created.status).toBe(200);
  const opportunity = created.body.opportunities[0];
  expect((await guest.patch('/api/sessions/me/select').send({ opportunityId: opportunity.id })).status).toBe(204);
  expect((await guest.patch('/api/sessions/me/progress').send({ planItemId: opportunity.planItems[0].id, isCompleted: true })).status).toBe(204);
  const restored = await guest.get('/api/sessions/me');
  expect(restored.body.selectedOpportunityId).toBe(opportunity.id);
  expect(restored.body.opportunities[0].planItems[0].isCompleted).toBe(true);
  expect(restored.body.opportunities[0].planItems[0].completedAt).toBeTruthy();
  expect(restored.body.cookieToken).toBeUndefined();
  const other = request.agent(app);
  expect((await other.post('/api/analyze').send(profile)).status).toBe(200);
  expect((await other.patch('/api/sessions/me/progress').send({ planItemId: opportunity.planItems[0].id, isCompleted: false })).status).toBe(403);
  expect((await guest.delete('/api/sessions/me')).status).toBe(204);
  expect((await guest.get('/api/sessions/me')).status).toBe(204);
  expect((await other.get('/api/sessions/me')).status).toBe(200);
  expect(await prisma.session.count()).toBe(1);
});

it('seeds distinct persona plans idempotently without changing live guest records', async () => {
  const root = fileURLToPath(new URL('../../', import.meta.url));
  const before = await prisma.session.findMany({ include: { opportunities: true } });
  for (let run = 0; run < 2; run++) {
    execFileSync(process.execPath, ['--import', 'tsx', path.join(root, 'prisma/seed.ts')],
      { cwd: root, env: process.env, stdio: 'pipe', timeout: 20_000 });
  }
  const titles = new Set<string>();
  for (const personaId of ['maria', 'james', 'aisha']) {
    const res = await request(app).post('/api/sessions/demo').send({ personaId });
    expect(res.status).toBe(200);
    expect(res.body.opportunities).toHaveLength(3);
    res.body.opportunities.forEach((opp: { title: string; planItems: { title: string }[] }) => {
      titles.add(opp.title); expect(opp.planItems[0].title).toContain(opp.title);
    });
  }
  expect(titles.size).toBe(9);
  expect(await prisma.session.count()).toBe(before.length + 3);
  for (const session of before) {
    expect(await prisma.session.findUnique({ where: { id: session.id }, include: { opportunities: true } })).toEqual(session);
  }
}, 30_000);
