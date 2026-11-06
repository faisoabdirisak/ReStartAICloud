import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';

// Mock Gemini so importing the app doesn't throw when GEMINI_API_KEY is absent
vi.mock('./lib/gemini.js', () => ({
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

import app from './index.js';

describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});
