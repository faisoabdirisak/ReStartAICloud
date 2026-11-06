import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

// ── Mock Prisma and Gemini before importing the app ──────────────────────────
vi.mock('../lib/db.js', () => ({
  prisma: {
    session: {
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    planItem: {
      findUnique: vi.fn(),
    },
    progressEntry: {
      upsert: vi.fn(),
    },
  },
}));

vi.mock('../lib/gemini.js', () => ({
  generateContent: vi.fn(),
  GeminiError: class GeminiError extends Error {
    statusCode: number;
    constructor(message: string, statusCode = 500) {
      super(message);
      this.name = 'GeminiError';
      this.statusCode = statusCode;
    }
  },
  GEMINI_MODEL: 'gemini-3.5-flash-lite',
}));

import { prisma } from '../lib/db.js';
import app from '../index.js';

// ── Shared test fixtures ─────────────────────────────────────────────────────
const SESSION_COOKIE = 'restart_sid=test-token-abc123';

const MOCK_DB_SESSION = {
  id: 'session-1',
  cookieToken: 'test-token-abc123',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  selectedOpportunityId: null,
  opportunities: [
    {
      id: 'opp-1',
      sessionId: 'session-1',
      title: 'UX Designer',
      category: 'career-pivot',
      summary: 'Use customer insight skills.',
      reasoning: 'Strong transferable skills.',
      feasibilityScore: 82,
      rank: 1,
      planItems: [
        {
          id: 'item-1',
          opportunityId: 'opp-1',
          day: 1,
          week: 1,
          title: 'Research the field',
          description: null,
          resourceUrl: null,
          progressEntry: null,
        },
        {
          id: 'item-2',
          opportunityId: 'opp-1',
          day: 3,
          week: 1,
          title: 'Complete intro course',
          description: null,
          resourceUrl: null,
          progressEntry: { id: 'pe-1', planItemId: 'item-2', isCompleted: true, completedAt: new Date(), updatedAt: new Date() },
        },
      ],
    },
  ],
};

// ── GET /api/sessions/me ─────────────────────────────────────────────────────
describe('GET /api/sessions/me', () => {
  beforeEach(() => vi.resetAllMocks());

  it('returns 204 with no cookie', async () => {
    const res = await request(app).get('/api/sessions/me');
    expect(res.status).toBe(204);
  });

  it('returns 204 when cookie does not match a DB session', async () => {
    vi.mocked(prisma.session.findUnique).mockResolvedValue(null);
    const res = await request(app)
      .get('/api/sessions/me')
      .set('Cookie', SESSION_COOKIE);
    expect(res.status).toBe(204);
  });

  it('returns session with opportunities and isCompleted state', async () => {
    vi.mocked(prisma.session.findUnique).mockResolvedValue(MOCK_DB_SESSION as never);
    const res = await request(app)
      .get('/api/sessions/me')
      .set('Cookie', SESSION_COOKIE);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe('session-1');
    expect(res.body.opportunities).toHaveLength(1);
    expect(res.body.opportunities[0].planItems[0].isCompleted).toBe(false);
    expect(res.body.opportunities[0].planItems[1].isCompleted).toBe(true);
  });

  it('does NOT return cookieToken in response', async () => {
    vi.mocked(prisma.session.findUnique).mockResolvedValue(MOCK_DB_SESSION as never);
    const res = await request(app)
      .get('/api/sessions/me')
      .set('Cookie', SESSION_COOKIE);
    expect(JSON.stringify(res.body)).not.toContain('cookieToken');
  });

  it('guest isolation: a different token gets 204', async () => {
    vi.mocked(prisma.session.findUnique).mockResolvedValue(null);
    const res = await request(app)
      .get('/api/sessions/me')
      .set('Cookie', 'restart_sid=different-token');
    expect(res.status).toBe(204);
  });
});

// ── PATCH /api/sessions/me/progress ─────────────────────────────────────────
describe('PATCH /api/sessions/me/progress', () => {
  beforeEach(() => vi.resetAllMocks());

  it('returns 401 with no cookie', async () => {
    const res = await request(app)
      .patch('/api/sessions/me/progress')
      .send({ planItemId: 'item-1', isCompleted: true });
    expect(res.status).toBe(401);
  });

  it('returns 403 when plan item belongs to a different guest', async () => {
    vi.mocked(prisma.planItem.findUnique).mockResolvedValue({
      id: 'item-1',
      opportunity: {
        session: { cookieToken: 'other-guests-token', id: 'session-2', sessionId: 'session-2' },
        sessionId: 'session-2',
      },
    } as never);

    const res = await request(app)
      .patch('/api/sessions/me/progress')
      .set('Cookie', SESSION_COOKIE)
      .send({ planItemId: 'item-1', isCompleted: true });
    expect(res.status).toBe(403);
  });

  it('upserts progress and returns 204 for own item', async () => {
    vi.mocked(prisma.planItem.findUnique).mockResolvedValue({
      id: 'item-1',
      opportunityId: 'opp-1',
      opportunity: {
        sessionId: 'session-1',
        session: { cookieToken: 'test-token-abc123', id: 'session-1' },
      },
    } as never);
    vi.mocked(prisma.progressEntry.upsert).mockResolvedValue({} as never);
    vi.mocked(prisma.session.update).mockResolvedValue({} as never);

    const res = await request(app)
      .patch('/api/sessions/me/progress')
      .set('Cookie', SESSION_COOKIE)
      .send({ planItemId: 'item-1', isCompleted: true });
    expect(res.status).toBe(204);
    expect(vi.mocked(prisma.progressEntry.upsert)).toHaveBeenCalledOnce();
  });

  it('returns 400 for invalid body', async () => {
    const res = await request(app)
      .patch('/api/sessions/me/progress')
      .set('Cookie', SESSION_COOKIE)
      .send({ planItemId: 'item-1' }); // missing isCompleted
    expect(res.status).toBe(400);
  });
});

// ── PATCH /api/sessions/me/select ────────────────────────────────────────────
describe('PATCH /api/sessions/me/select', () => {
  beforeEach(() => vi.resetAllMocks());

  it('returns 401 with no cookie', async () => {
    const res = await request(app)
      .patch('/api/sessions/me/select')
      .send({ opportunityId: 'opp-1' });
    expect(res.status).toBe(401);
  });

  it('deselects (null) without ownership check', async () => {
    vi.mocked(prisma.session.update).mockResolvedValue({} as never);
    const res = await request(app)
      .patch('/api/sessions/me/select')
      .set('Cookie', SESSION_COOKIE)
      .send({ opportunityId: null });
    expect(res.status).toBe(204);
  });
});

// ── DELETE /api/sessions/me ──────────────────────────────────────────────────
describe('DELETE /api/sessions/me', () => {
  beforeEach(() => vi.resetAllMocks());

  it('returns 204 with no cookie (nothing to clear)', async () => {
    const res = await request(app).delete('/api/sessions/me');
    expect(res.status).toBe(204);
  });

  it('deletes session and clears cookie', async () => {
    vi.mocked(prisma.session.findUnique).mockResolvedValue({ id: 'session-1' } as never);
    vi.mocked(prisma.session.delete).mockResolvedValue({} as never);

    const res = await request(app)
      .delete('/api/sessions/me')
      .set('Cookie', SESSION_COOKIE);

    expect(res.status).toBe(204);
    expect(vi.mocked(prisma.session.delete)).toHaveBeenCalledWith({ where: { id: 'session-1' } });
    // Cookie should be cleared (Set-Cookie header present)
    const setCookie = res.headers['set-cookie'];
    expect(setCookie).toBeDefined();
  });

  it('does NOT delete another guests session', async () => {
    // If token not found, should not delete anything
    vi.mocked(prisma.session.findUnique).mockResolvedValue(null);

    const res = await request(app)
      .delete('/api/sessions/me')
      .set('Cookie', 'restart_sid=unknown-token');

    expect(res.status).toBe(204);
    expect(vi.mocked(prisma.session.delete)).not.toHaveBeenCalled();
  });
});

// ── POST /api/sessions/demo ───────────────────────────────────────────────────
describe('POST /api/sessions/demo', () => {
  beforeEach(() => vi.resetAllMocks());

  it('returns 400 for unknown persona id', async () => {
    const res = await request(app)
      .post('/api/sessions/demo')
      .send({ personaId: 'unknown' });
    expect(res.status).toBe(400);
  });

  it('returns 404 when seeded session not in DB', async () => {
    vi.mocked(prisma.session.findUnique).mockResolvedValue(null);
    const res = await request(app)
      .post('/api/sessions/demo')
      .send({ personaId: 'maria' });
    expect(res.status).toBe(404);
  });

  it('returns session data for a valid seeded persona', async () => {
    vi.mocked(prisma.session.findUnique).mockResolvedValue(MOCK_DB_SESSION as never);
    const res = await request(app)
      .post('/api/sessions/demo')
      .send({ personaId: 'maria' });
    expect(res.status).toBe(200);
    expect(res.body.id).toBe('session-1');
    expect(res.body.opportunities).toBeDefined();
  });

  it('does NOT set or modify the live session cookie', async () => {
    vi.mocked(prisma.session.findUnique).mockResolvedValue(MOCK_DB_SESSION as never);
    const res = await request(app)
      .post('/api/sessions/demo')
      .send({ personaId: 'james' });
    expect(res.status).toBe(200);
    // No Set-Cookie header — live session must not be affected
    const setCookie = res.headers['set-cookie'];
    expect(setCookie).toBeUndefined();
  });

  it('does NOT expose cookieToken in the response', async () => {
    vi.mocked(prisma.session.findUnique).mockResolvedValue(MOCK_DB_SESSION as never);
    const res = await request(app)
      .post('/api/sessions/demo')
      .send({ personaId: 'aisha' });
    expect(JSON.stringify(res.body)).not.toContain('cookieToken');
  });
});
