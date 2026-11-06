import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
vi.mock('./lib/gemini.js', () => ({ generateContent: vi.fn(), GeminiError: class extends Error {} }));
vi.mock('./lib/db.js', () => ({ prisma: {
  session: { findUnique: vi.fn(), update: vi.fn(), delete: vi.fn() },
  planItem: { findUnique: vi.fn() }, opportunity: { findUnique: vi.fn() },
  progressEntry: { upsert: vi.fn() },
} }));
import app from './index.js';
import { prisma } from './lib/db.js';
const cookie = 'restart_sid=private-guest';
beforeEach(() => vi.resetAllMocks());
describe('API boundary protections', () => {
  it('sets security headers and prevents caching private responses', async () => {
    const res = await request(app).get('/api/sessions/me');
    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });
  it('rejects cross-origin mutations before database access', async () => {
    const res = await request(app).delete('/api/sessions/me').set('Origin', 'https://untrusted.example').set('Cookie', cookie);
    expect(res.status).toBe(403); expect(prisma.session.delete).not.toHaveBeenCalled();
  });
  it('accepts the configured browser origin', async () => {
    const res = await request(app).delete('/api/sessions/me').set('Origin', process.env.CLIENT_ORIGIN ?? 'http://localhost:5173');
    expect(res.status).toBe(204);
  });
  it('rejects cross-site browser fetches even without Origin', async () => {
    expect((await request(app).delete('/api/sessions/me').set('Sec-Fetch-Site', 'cross-site')).status).toBe(403);
  });
  it('returns safe JSON for malformed JSON', async () => {
    const res = await request(app).patch('/api/sessions/me/progress').set('Content-Type', 'application/json').send('{broken');
    expect(res.status).toBe(400); expect(res.body).toEqual({ error: 'Invalid JSON request.' });
  });
  it('rejects oversized bodies with a safe response', async () => {
    const res = await request(app).post('/api/sessions/demo').send({ personaId: 'x'.repeat(17_000) });
    expect(res.status).toBe(413); expect(JSON.stringify(res.body)).not.toContain('xxxxx');
  });
  it('unknown API paths return JSON instead of an SPA document', async () => {
    const res = await request(app).get('/api/not-a-route');
    expect(res.status).toBe(404); expect(res.type).toBe('application/json');
  });
  it.each(['/api/sessions/me', '/api/sessions/demo'])('sanitizes DB failures on %s', async (route) => {
    vi.mocked(prisma.session.findUnique).mockRejectedValue(new Error('DATABASE_URL=private-secret internal stack'));
    const res = route.endsWith('demo')
      ? await request(app).post(route).send({ personaId: 'maria' })
      : await request(app).get(route).set('Cookie', cookie);
    expect(res.status).toBe(500); expect(res.body).toEqual({ error: 'Request could not be completed. Please try again.' });
  });
  it.each(['demo-token-maria-retail-manager', 'demo-token-james-delivery-driver', 'demo-token-aisha-hospitality'])('public demo token cannot authorize writes: %s', async (token) => {
    const res = await request(app).patch('/api/sessions/me/progress').set('Cookie', `restart_sid=${token}`).send({ planItemId: 'demo-item', isCompleted: true });
    expect(res.status).toBe(401); expect(prisma.progressEntry.upsert).not.toHaveBeenCalled();
  });
  it('rejects invalid opportunity selection', async () => {
    expect((await request(app).patch('/api/sessions/me/select').set('Cookie', cookie).send({ opportunityId: 5 })).status).toBe(400);
  });
  it('rejects another guest opportunity', async () => {
    vi.mocked(prisma.opportunity.findUnique).mockResolvedValue({ session: { cookieToken: 'someone-else' } } as never);
    const res = await request(app).patch('/api/sessions/me/select').set('Cookie', cookie).send({ opportunityId: 'other' });
    expect(res.status).toBe(403); expect(prisma.session.update).not.toHaveBeenCalled();
  });
  it('saves an owned opportunity selection', async () => {
    vi.mocked(prisma.opportunity.findUnique).mockResolvedValue({ session: { cookieToken: 'private-guest' } } as never);
    vi.mocked(prisma.session.update).mockResolvedValue({} as never);
    expect((await request(app).patch('/api/sessions/me/select').set('Cookie', cookie).send({ opportunityId: 'own' })).status).toBe(204);
    expect(prisma.session.update).toHaveBeenCalledWith({ where: { cookieToken: 'private-guest' }, data: { selectedOpportunityId: 'own' } });
  });
  it('surfaces write failure safely instead of leaving the request hanging', async () => {
    vi.mocked(prisma.session.update).mockRejectedValue(new Error('private database failure'));
    const res = await request(app).patch('/api/sessions/me/select').set('Cookie', cookie).send({ opportunityId: null });
    expect(res.status).toBe(500); expect(JSON.stringify(res.body)).not.toContain('database');
  });
  it('limits repeated analysis attempts', async () => {
    for (let i = 0; i < 10; i++) expect((await request(app).post('/api/analyze').send({})).status).toBe(400);
    expect((await request(app).post('/api/analyze').send({})).status).toBe(429);
  });
});
