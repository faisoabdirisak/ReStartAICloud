import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const sdk = vi.hoisted(() => ({ generate: vi.fn(), constructed: vi.fn() }));
vi.mock('@google/genai', () => ({
  GoogleGenAI: class {
    models = { generateContent: sdk.generate };
    constructor(options: unknown) { sdk.constructed(options); }
  },
}));
afterEach(() => vi.unstubAllEnvs());
beforeEach(() => { vi.resetModules(); sdk.generate.mockReset(); sdk.constructed.mockClear(); });

describe('Gemini boundary (SDK mocked, no network)', () => {
  it('fails safely before contacting the SDK when key is absent', async () => {
    vi.stubEnv('GEMINI_API_KEY', '');
    const { generateContent, GeminiError } = await import('./gemini.js');
    await expect(generateContent('fictional profile')).rejects.toBeInstanceOf(GeminiError);
    expect(sdk.constructed).not.toHaveBeenCalled();
  });
  it('uses the configured model, trims output and reuses the client', async () => {
    vi.stubEnv('GEMINI_API_KEY', 'test-only-placeholder');
    vi.stubEnv('GEMINI_MODEL', 'test-model');
    sdk.generate.mockResolvedValue({ text: '  {"opportunities":[]}  ' });
    const { generateContent } = await import('./gemini.js');
    expect(await generateContent('profile')).toBe('{"opportunities":[]}');
    await generateContent('profile two');
    expect(sdk.constructed).toHaveBeenCalledTimes(1);
    expect(sdk.generate).toHaveBeenCalledWith(expect.objectContaining({ model: 'test-model', contents: 'profile' }));
  });
  it.each([undefined, '', '   '])('rejects an empty model response: %s', async (text) => {
    vi.stubEnv('GEMINI_API_KEY', 'test-only-placeholder');
    sdk.generate.mockResolvedValue({ text });
    const { generateContent } = await import('./gemini.js');
    await expect(generateContent('profile')).rejects.toThrow('Model returned empty response');
  });
  it('propagates SDK failures for the route to sanitize', async () => {
    vi.stubEnv('GEMINI_API_KEY', 'test-only-placeholder');
    sdk.generate.mockRejectedValue(new Error('upstream failed'));
    const { generateContent } = await import('./gemini.js');
    await expect(generateContent('profile')).rejects.toThrow('upstream failed');
  });
});
