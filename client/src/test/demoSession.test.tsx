import { act, render, renderHook, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import { createDemoOpportunities, type Session } from '@restart-ai/shared';
vi.mock('../lib/api', () => ({ restoreSession: vi.fn(), loadDemoSession: vi.fn(), updateProgress: vi.fn(),
  selectOpportunity: vi.fn(), clearSession: vi.fn(), analyzeProfile: vi.fn(), ApiError: class extends Error {} }));
import { restoreSession, loadDemoSession, updateProgress, selectOpportunity, clearSession } from '../lib/api';
import { useSession } from '../hooks/useSession';
import { PlanView } from '../components/PlanView';
beforeEach(() => { vi.resetAllMocks(); vi.mocked(restoreSession).mockResolvedValue(null); vi.mocked(loadDemoSession).mockResolvedValue(null); });
const makeSession = (id: 'maria' | 'james' | 'aisha'): Session => ({ id, createdAt: new Date(), updatedAt: new Date(), opportunities: createDemoOpportunities(id) });
async function emptyHook() {
  const hook = renderHook(() => useSession());
  await waitFor(() => expect(hook.result.current.status).toBe('empty'));
  return hook;
}
it('missing seeds yield different persona-specific opportunities and plans', async () => {
  const { result } = await emptyHook();
  const titles = new Set<string>();
  for (const id of ['maria', 'james', 'aisha']) {
    await act(async () => result.current.startDemo(id));
    await waitFor(() => expect(result.current.status).toBe('demo'));
    titles.add(result.current.opportunities[0].title);
    expect(result.current.opportunities.every((opp) => opp.id.startsWith(`demo-${id}-`))).toBe(true);
  }
  expect(titles.size).toBe(3);
});
it('network failure uses the selected persona fallback', async () => {
  vi.mocked(loadDemoSession).mockRejectedValue(new Error('offline'));
  const { result } = await emptyHook();
  await act(async () => result.current.startDemo('james'));
  await waitFor(() => expect(result.current.status).toBe('demo'));
  expect(result.current.opportunities[0].title).toBe('Fleet & Logistics Coordinator');
});
it('demo tasks and selection remain local and survive switching personas', async () => {
  const { result } = await emptyHook();
  await act(async () => result.current.startDemo('james'));
  const opportunity = result.current.opportunities[0];
  for (const week of [2, 3, 4]) {
    const item = opportunity.planItems.find((item) => item.week === week)!;
    await act(async () => result.current.togglePlanItem(item.id, true));
    expect(result.current.opportunities[0].planItems.find((entry) => entry.id === item.id)?.isCompleted).toBe(true);
  }
  await act(async () => result.current.selectOpp(opportunity.id));
  await act(async () => result.current.startDemo('aisha'));
  await act(async () => result.current.startDemo('james'));
  expect(result.current.selectedOpportunityId).toBe(opportunity.id);
  expect(result.current.opportunities[0].planItems.filter((item) => item.isCompleted)).toHaveLength(6);
  expect(updateProgress).not.toHaveBeenCalled(); expect(selectOpportunity).not.toHaveBeenCalled();
});
it('out-of-order responses cannot show Maria under the James label', async () => {
  let resolveMaria!: (session: Session) => void;
  vi.mocked(loadDemoSession).mockImplementation((id) => id === 'maria'
    ? new Promise((resolve) => { resolveMaria = resolve; }) : Promise.resolve(makeSession('james')));
  const { result } = await emptyHook();
  act(() => result.current.startDemo('maria'));
  await act(async () => result.current.startDemo('james'));
  await act(async () => resolveMaria(makeSession('maria')));
  expect(result.current.activePersonaId).toBe('james');
  expect(result.current.opportunities[0].id).toContain('demo-james-');
});
it('exiting during a pending request cannot reactivate demo mode', async () => {
  let resolveDemo!: (session: Session) => void;
  vi.mocked(loadDemoSession).mockReturnValue(new Promise((resolve) => { resolveDemo = resolve; }));
  const { result } = await emptyHook();
  act(() => result.current.startDemo('aisha'));
  act(() => result.current.stopDemo());
  await act(async () => resolveDemo(makeSession('aisha')));
  expect(result.current.status).toBe('empty'); expect(result.current.activePersonaId).toBeNull();
});
it('demo edits and resets never delete or replace the saved live session', async () => {
  const live = { ...makeSession('maria'), id: 'live-session' };
  vi.mocked(restoreSession).mockResolvedValue(live);
  const { result } = renderHook(() => useSession());
  await waitFor(() => expect(result.current.status).toBe('ready'));
  await act(async () => result.current.startDemo('james'));
  await act(async () => result.current.startOver());
  act(() => result.current.stopDemo());
  expect(result.current.sessionId).toBe('live-session');
  expect(result.current.opportunities).toEqual(live.opportunities);
  expect(clearSession).not.toHaveBeenCalled();
});
it('live task updates still persist through the API', async () => {
  vi.mocked(restoreSession).mockResolvedValue(makeSession('james'));
  vi.mocked(updateProgress).mockResolvedValue(undefined);
  const { result } = renderHook(() => useSession());
  await waitFor(() => expect(result.current.status).toBe('ready'));
  const item = result.current.opportunities[0].planItems[3];
  await act(async () => result.current.togglePlanItem(item.id, true));
  expect(updateProgress).toHaveBeenCalledWith({ planItemId: item.id, isCompleted: true });
  expect(result.current.opportunities[0].planItems[3].completedAt).toBeInstanceOf(Date);
});
it('Plan View lets a demo visitor check weeks 2, 3 and 4 and updates the percentage', async () => {
  function Harness() {
    const state = useSession();
    return state.status === 'demo'
      ? <PlanView opportunity={state.opportunities[0]} onClose={() => {}} onToggleItem={state.togglePlanItem} />
      : <button onClick={() => state.startDemo('james')}>Open James demo</button>;
  }
  const user = userEvent.setup(); render(<Harness />);
  await user.click(screen.getByRole('button', { name: 'Open James demo' }));
  const opportunity = createDemoOpportunities('james')[0];
  for (const week of [2, 3, 4]) {
    const item = opportunity.planItems.find((entry) => entry.week === week)!;
    await user.click(await screen.findByRole('button', { name: `Mark "${item.title}" as complete` }));
    expect(screen.getByRole('button', { name: `Mark "${item.title}" as incomplete` })).toHaveAttribute('aria-pressed', 'true');
  }
  expect(screen.getByText('6/12 steps · 50% complete')).toBeInTheDocument();
  expect(updateProgress).not.toHaveBeenCalled();
});

it('a late live restore is stashed without replacing the active demo', async () => {
  let resolveRestore!: (session: Session) => void;
  vi.mocked(restoreSession).mockReturnValue(new Promise((resolve) => { resolveRestore = resolve; }));
  const { result } = renderHook(() => useSession());
  await act(async () => result.current.startDemo('james'));
  await act(async () => resolveRestore({ ...makeSession('maria'), id: 'restored-live' }));
  expect(result.current.status).toBe('demo');
  expect(result.current.activePersonaId).toBe('james');
  act(() => result.current.stopDemo());
  expect(result.current.sessionId).toBe('restored-live');
});
