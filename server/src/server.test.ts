import { afterEach, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ listen: vi.fn((_port: number, ready: () => void) => ready()) }));
vi.mock('./index.js', () => ({ default: { listen: state.listen } }));
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });
it.each(['', '3456'])('uses the default or configured port without opening a listener: %s', async (port) => {
  vi.stubEnv('PORT', port); vi.resetModules(); state.listen.mockClear();
  vi.spyOn(console, 'log').mockImplementation(() => {});
  await import('./server.js');
  expect(state.listen).toHaveBeenCalledWith(port ? 3456 : 3001, expect.any(Function));
});
