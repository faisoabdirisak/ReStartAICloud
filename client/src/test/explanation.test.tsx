import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import { createDemoOpportunities } from '@restart-ai/shared';
import { OpportunityExplanation } from '../components/OpportunityExplanation';
it('opens with keyboard and explains weights, costs, risks and uncertainty', async () => {
  const opp = createDemoOpportunities('james')[0];
  render(<OpportunityExplanation opportunity={opp} />);
  const user = userEvent.setup();
  await user.tab();
  await user.keyboard('{Enter}');
  expect(screen.getByText('Score factors')).toBeVisible();
  expect(screen.getByText('Skill fit · 40% weight')).toBeVisible();
  expect(screen.getByText(`Rounded total: ${opp.feasibilityScore}/100`)).toBeVisible();
  expect(screen.getByText(/Fictional demo estimates/)).toBeVisible();
  expect(screen.getByText(opp.explanation!.risks!)).toBeVisible();
  expect(screen.getByText(opp.explanation!.questionsToVerify[0])).toBeVisible();
});
it('does not manufacture an explanation for older results', async () => {
  const opp = { ...createDemoOpportunities('maria')[0], explanation: null };
  render(<OpportunityExplanation opportunity={opp} />);
  await userEvent.click(screen.getByText('Explain My Opportunity'));
  expect(screen.getByText(/Explanation unavailable for this saved result/)).toBeVisible();
  expect(screen.queryByText('Score factors')).not.toBeInTheDocument();
});
it('distinguishes missing cost from a zero cost estimate', async () => {
  const opp = createDemoOpportunities('aisha')[0];
  const { rerender } = render(
    <OpportunityExplanation
      opportunity={{ ...opp, explanation: { ...opp.explanation!, estimatedCostUSD: null } }}
    />
  );
  await userEvent.click(screen.getByText('Explain My Opportunity'));
  expect(screen.getByText(/Not provided · unverified estimate/)).toBeVisible();
  rerender(
    <OpportunityExplanation
      opportunity={{ ...opp, explanation: { ...opp.explanation!, estimatedCostUSD: 0 } }}
    />
  );
  expect(screen.getByText(/\$0 · unverified estimate/)).toBeVisible();
});

it('opens outside the card, traps focus, and Back restores focus and page scrolling', async () => {
  const opp = createDemoOpportunities('james')[0];
  const { container } = render(<OpportunityExplanation opportunity={opp} />);
  const trigger = screen.getByRole('button', { name: 'Explain My Opportunity' });
  const user = userEvent.setup();
  await user.click(trigger);
  const dialog = screen.getByRole('dialog', { name: `Explanation for ${opp.title}` });
  expect(container.contains(dialog)).toBe(false);
  expect(document.body.style.overflow).toBe('hidden');
  const back = screen.getByRole('button', { name: 'Back' });
  const last = screen.getByRole('button', { name: 'Back to previous view' });
  expect(back).toHaveFocus();
  await user.tab({ shift: true });
  expect(last).toHaveFocus();
  await user.tab();
  expect(back).toHaveFocus();
  await user.click(back);
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(trigger).toHaveFocus();
  expect(document.body.style.overflow).not.toBe('hidden');
});
it('Escape and Close both dismiss the explanation', async () => {
  render(<OpportunityExplanation opportunity={createDemoOpportunities('aisha')[0]} />);
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Explain My Opportunity' }));
  await user.keyboard('{Escape}');
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Explain My Opportunity' }));
  await user.click(screen.getByRole('button', { name: 'Close explanation' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

it('renders accessible score bars and working section buttons', async () => {
  const opp = createDemoOpportunities('james')[0];
  render(<OpportunityExplanation opportunity={opp} />);
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Explain My Opportunity' }));
  expect(screen.getAllByRole('progressbar')).toHaveLength(4);
  await user.click(screen.getByRole('button', { name: 'Review score' }));
  expect(screen.getByRole('button', { name: 'Score breakdown' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  await user.click(screen.getByRole('button', { name: 'What should I verify?' }));
  expect(screen.getByRole('button', { name: 'Risks & next checks' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
});
