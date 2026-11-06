import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

// ── Mock Gemini BEFORE importing the app (which imports the route, which imports gemini) ──
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

import { generateContent } from '../lib/gemini.js';
import app from '../index.js';

const VALID_PROFILE = {
  currentRole: 'Retail Manager',
  skills: 'Customer service, team leadership, inventory management',
  experience: '6 years managing a team of 15 in a large retail chain',
  location: 'Chicago, IL',
  startupBudget: 500,
  goals: 'Transition to a remote role with growth potential',
};

const MOCK_AI_RESPONSE = {
  opportunities: [
    {
      title: 'UX Researcher',
      category: 'career-pivot',
      summary: 'Apply your customer insights skills to digital product research.',
      reasoning: 'Strong transferable skills from customer-facing work. Unverified: bootcamp ~$2,000.',
      estimatedCostUSD: 2000,
      risks: 'Competitive market; portfolio required.',
      signals: { skillFitPct: 85, affordabilityPct: 40, launchTimeDays: 90, complexityScore: 5 },
      planItems: Array.from({ length: 12 }, (_, i) => ({
        day: (i + 1) * 2,
        week: Math.ceil((i + 1) / 3),
        title: `Step ${i + 1}`,
      })),
    },
    {
      title: 'E-commerce Store',
      category: 'micro-business',
      summary: 'Launch a niche product store using your supply-chain expertise.',
      reasoning: 'Low startup cost. Unverified: ~$300–500 initial inventory.',
      estimatedCostUSD: 400,
      risks: 'Requires sustained marketing effort.',
      signals: { skillFitPct: 70, affordabilityPct: 90, launchTimeDays: 30, complexityScore: 4 },
      planItems: Array.from({ length: 12 }, (_, i) => ({
        day: (i + 1) * 2,
        week: Math.ceil((i + 1) / 3),
        title: `Step ${i + 1}`,
      })),
    },
    {
      title: 'Data Analytics Certificate',
      category: 'upskilling',
      summary: 'Google Data Analytics certificate opens doors in operations roles.',
      reasoning: 'Completable in 6 months while job searching. Unverified: ~$200 on Coursera.',
      estimatedCostUSD: 200,
      risks: 'Requires consistent self-study.',
      signals: { skillFitPct: 75, affordabilityPct: 95, launchTimeDays: 180, complexityScore: 4 },
      planItems: Array.from({ length: 12 }, (_, i) => ({
        day: (i + 1) * 2,
        week: Math.ceil((i + 1) / 3),
        title: `Step ${i + 1}`,
      })),
    },
  ],
};

describe('POST /api/analyze', () => {
  beforeEach(() => {
    vi.mocked(generateContent).mockReset();
  });

  it('returns 200 with 3 opportunities on valid input', async () => {
    vi.mocked(generateContent).mockResolvedValue(JSON.stringify(MOCK_AI_RESPONSE));

    const res = await request(app).post('/api/analyze').send(VALID_PROFILE);

    expect(res.status).toBe(200);
    expect(res.body.opportunities).toHaveLength(3);
  });

  it('feasibility scores are integers 0–100 (not AI-provided)', async () => {
    vi.mocked(generateContent).mockResolvedValue(JSON.stringify(MOCK_AI_RESPONSE));

    const res = await request(app).post('/api/analyze').send(VALID_PROFILE);

    for (const opp of res.body.opportunities) {
      expect(opp.feasibilityScore).toBeGreaterThanOrEqual(0);
      expect(opp.feasibilityScore).toBeLessThanOrEqual(100);
      expect(Number.isInteger(opp.feasibilityScore)).toBe(true);
    }
  });

  it('ranks are 1, 2, 3 in ascending order in response', async () => {
    vi.mocked(generateContent).mockResolvedValue(JSON.stringify(MOCK_AI_RESPONSE));

    const res = await request(app).post('/api/analyze').send(VALID_PROFILE);
    const ranks = res.body.opportunities.map((o: { rank: number }) => o.rank);
    expect(ranks).toEqual([1, 2, 3]);
  });

  it('returns 400 on missing required fields', async () => {
    const res = await request(app)
      .post('/api/analyze')
      .send({ currentRole: 'Manager' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid request/i);
  });

  it('returns 400 on empty currentRole', async () => {
    const res = await request(app)
      .post('/api/analyze')
      .send({ ...VALID_PROFILE, currentRole: '' });

    expect(res.status).toBe(400);
  });

  it('returns 502 when Gemini returns malformed JSON', async () => {
    vi.mocked(generateContent).mockResolvedValue('NOT VALID JSON {{{');

    const res = await request(app).post('/api/analyze').send(VALID_PROFILE);

    expect(res.status).toBe(502);
    expect(res.body.error).toBeDefined();
  });

  it('returns 502 when Gemini throws', async () => {
    vi.mocked(generateContent).mockRejectedValue(new Error('network timeout'));

    const res = await request(app).post('/api/analyze').send(VALID_PROFILE);

    expect(res.status).toBe(502);
    expect(res.body.error).toBeDefined();
  });

  it('response does not leak API key or internal errors', async () => {
    vi.mocked(generateContent).mockRejectedValue(new Error('GEMINI_API_KEY is invalid'));

    const res = await request(app).post('/api/analyze').send(VALID_PROFILE);

    const body = JSON.stringify(res.body);
    expect(body).not.toMatch(/GEMINI_API_KEY/);
    expect(body).not.toMatch(/api.key/i);
  });

  it('response includes session id and timestamps', async () => {
    vi.mocked(generateContent).mockResolvedValue(JSON.stringify(MOCK_AI_RESPONSE));

    const res = await request(app).post('/api/analyze').send(VALID_PROFILE);

    expect(res.body.id).toBeDefined();
    expect(res.body.createdAt).toBeDefined();
    expect(res.body.updatedAt).toBeDefined();
  });

  it('strips code fences from AI response', async () => {
    const fenced = '```json\n' + JSON.stringify(MOCK_AI_RESPONSE) + '\n```';
    vi.mocked(generateContent).mockResolvedValue(fenced);

    const res = await request(app).post('/api/analyze').send(VALID_PROFILE);

    expect(res.status).toBe(200);
    expect(res.body.opportunities).toHaveLength(3);
  });
});

describe('GET /health', () => {
  it('returns 200', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
