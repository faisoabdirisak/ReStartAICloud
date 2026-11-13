import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { createDemoOpportunities } from '@restart-ai/shared';
import { DashboardPreview } from '../components/DashboardPreview';
import { restoreSession } from '../lib/api';

vi.mock('../lib/api', () => ({ restoreSession: vi.fn() }));
afterEach(() => {
  Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal');
  vi.restoreAllMocks();
});

it('prints confirmed saved progress for the focused opportunity', async () => {
  const [focused, other] = createDemoOpportunities('james');
  const saved = {
    ...focused,
    planItems: focused.planItems.map((item, i) => ({ ...item, isCompleted: i === 0 })),
  };
  vi.mocked(restoreSession).mockResolvedValue({
    id: 'saved',
    createdAt: new Date(),
    updatedAt: new Date(),
    selectedOpportunityId: focused.id,
    opportunities: [saved, other],
  });
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
    configurable: true,
    value(this: HTMLDialogElement) {
      this.setAttribute('open', '');
    },
  });
  const print = vi.spyOn(window, 'print').mockImplementation(() => {});
  render(
    <DashboardPreview
      opportunities={[focused, other]}
      selectedOpportunityId={focused.id}
      streak={0}
      onViewPlan={vi.fn()}
      onSelectOpp={vi.fn()}
      onStartOver={vi.fn()}
    />
  );
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Print / Save as PDF' }));
  const report = within(await screen.findByRole('dialog', { name: 'Adviser handoff preview' }));
  expect(report.getByRole('heading', { name: focused.title })).toBeVisible();
  expect(report.getByText(/1 of 12 tasks completed \(8%\) · 11 remaining/)).toBeVisible();
  expect(report.queryByRole('heading', { name: other.title })).not.toBeInTheDocument();
  await user.click(report.getByRole('button', { name: 'Print / Save as PDF' }));
  expect(print).toHaveBeenCalledOnce();
});
