import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
vi.mock('../lib/api', () => ({
  restoreSession: vi.fn(), clearSession: vi.fn(), analyzeProfile: vi.fn(),
  updateProgress: vi.fn(), selectOpportunity: vi.fn(), loadDemoSession: vi.fn(),
  ApiError: class extends Error {},
}));
import { restoreSession, clearSession } from '../lib/api';
import { useSession } from '../hooks/useSession';
beforeEach(() => vi.resetAllMocks());
it('reports restoration failures rather than pretending no saved session exists', async () => {
  vi.mocked(restoreSession).mockRejectedValue(new Error('offline'));
  const { result } = renderHook(() => useSession());
  await waitFor(() => expect(result.current.status).toBe('error'));
  expect(result.current.apiError).toContain('restore');
});
it('preserves the active session if start over fails on the server', async () => {
  vi.mocked(restoreSession).mockResolvedValue({ id: 'saved', createdAt: new Date(), updatedAt: new Date(), opportunities: [] });
  vi.mocked(clearSession).mockRejectedValue(new Error('offline'));
  const { result } = renderHook(() => useSession());
  await waitFor(() => expect(result.current.status).toBe('ready'));
  await act(async () => { await result.current.startOver(); });
  expect(result.current.sessionId).toBe('saved');
  expect(result.current.apiError).toContain('clear');
});
