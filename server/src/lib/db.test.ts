import { afterEach, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ created: vi.fn() }));
vi.mock('@prisma/client', () => ({ PrismaClient: class { constructor(options: unknown) { state.created(options); } } }));
const cache = globalThis as unknown as { prisma?: unknown };
afterEach(() => { delete cache.prisma; vi.unstubAllEnvs(); });
it('reuses the development singleton without opening a real database', async () => {
  vi.stubEnv('NODE_ENV', 'development'); delete cache.prisma; vi.resetModules(); state.created.mockClear();
  const first = await import('./db.js'); vi.resetModules();
  const second = await import('./db.js');
  expect(first.prisma).toBe(second.prisma);
  expect(state.created).toHaveBeenCalledTimes(1);
});
it('does not retain a production client on the global object', async () => {
  vi.stubEnv('NODE_ENV', 'production'); delete cache.prisma; vi.resetModules();
  await import('./db.js'); expect(cache.prisma).toBeUndefined();
});
