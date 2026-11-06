/**
 * Gemini client wrapper.
 *
 * The API key is loaded exclusively from process.env on the server.
 * It is never logged, echoed, or included in responses.
 *
 * Environment is loaded by Node's --env-file flag (see package.json dev script)
 * BEFORE any module evaluation, so process.env is populated by the time
 * generateContent() is first called.
 *
 * Model is configurable via GEMINI_MODEL env var; defaults to the
 * verified value from gemini-test: "gemini-3.5-flash-lite".
 */
import { GoogleGenAI } from '@google/genai';

export const GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-3.5-flash-lite';

/** Lazily created — avoids throwing at import time; validates on first call. */
let _client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (_client) return _client;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new GeminiError('[gemini] GEMINI_API_KEY environment variable is not set', 500);
  }

  _client = new GoogleGenAI({ apiKey });
  return _client;
}

/**
 * Generate content from Gemini. Returns the raw text response.
 * Throws GeminiError on API or configuration failures.
 */
export async function generateContent(prompt: string): Promise<string> {
  const client = getClient();

  const response = await client.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
    config: {
      temperature: 0.3,
      maxOutputTokens: 4096,
    },
  });

  const text = response.text?.trim();
  if (!text) {
    throw new GeminiError('Model returned empty response', 500);
  }
  return text;
}

export class GeminiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 500
  ) {
    super(message);
    this.name = 'GeminiError';
  }
}
