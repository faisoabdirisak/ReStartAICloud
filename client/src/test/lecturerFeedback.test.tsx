import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { createDemoOpportunities, type PublicEvaluation } from '@restart-ai/shared';
import { LecturerFeedback } from '../components/LecturerFeedback';
import { listEvaluations, submitEvaluation } from '../lib/api';

vi.mock('../lib/api', () => ({ listEvaluations: vi.fn(), submitEvaluation: vi.fn() }));

it('opens a separate form and returns to the published list after submission', async () => {
  const [opportunity] = createDemoOpportunities('james');
  const previous: PublicEvaluation = {
    id: 'earlier',
    source: 'live',
    name: 'Earlier Reviewer',
    role: 'Lecturer',
    affiliation: '',
    opportunityTitle: opportunity.title,
    createdAt: '2026-11-13T12:00:00Z',
    fit: 'Well',
    reason: 'Relevant skills',
    firstStep: 'Review requirements',
    usefulness: 'Useful',
    reportChanges: '',
    friction: '',
  };
  const published = { ...previous, id: 'new', name: 'New Reviewer' };
  vi.mocked(listEvaluations).mockResolvedValue([previous]);
  vi.mocked(submitEvaluation).mockImplementation(async () => {
    vi.mocked(listEvaluations).mockResolvedValue([published, previous]);
    return published;
  });

  render(<LecturerFeedback opportunities={[opportunity]} focusedId={opportunity.id} />);
  const user = userEvent.setup();
  expect(await screen.findByRole('heading', { name: 'Earlier Reviewer' })).toBeVisible();
  expect(screen.queryByLabelText(/^Name$/)).not.toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: 'Write feedback' }));
  expect(screen.getByRole('heading', { name: 'Write feedback' })).toHaveFocus();
  expect(screen.queryByRole('heading', { name: 'Published feedback' })).not.toBeInTheDocument();
  await user.type(screen.getByLabelText(/^Name$/), 'New Reviewer');
  await user.selectOptions(screen.getByLabelText(/^Role$/), 'Lecturer');
  await user.selectOptions(screen.getByLabelText(/how well did the recommendation/i), 'Well');
  await user.type(screen.getByLabelText(/why did you choose/i), 'Relevant skills');
  await user.type(screen.getByLabelText(/what would you do first/i), 'Review requirements');
  await user.selectOptions(screen.getByLabelText(/how useful was the adviser report/i), 'Useful');
  await user.click(screen.getByRole('checkbox', { name: /agree to publish/i }));
  await user.click(screen.getByRole('button', { name: 'Publish feedback' }));

  expect(await screen.findByRole('heading', { name: 'New Reviewer' })).toBeVisible();
  expect(screen.getByRole('heading', { name: 'Earlier Reviewer' })).toBeVisible();
  expect(screen.getByRole('status')).toHaveTextContent('Your feedback is published below.');
  expect(screen.queryByLabelText(/^Name$/)).not.toBeInTheDocument();
});
