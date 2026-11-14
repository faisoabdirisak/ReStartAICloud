import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { createDemoOpportunities } from '@restart-ai/shared';
import { OpportunityComparison } from '../components/OpportunityComparison';

it('compares estimates against the budget and lets the worker focus a lower-cost option', async () => {
  const [first, second, third] = createDemoOpportunities('james');
  const higher = { ...first, explanation: { ...first.explanation!, estimatedCostUSD: 450 } };
  const lower = { ...second, explanation: { ...second.explanation!, estimatedCostUSD: 50 } };
  const unknown = { ...third, explanation: null };
  const onFocus = vi.fn().mockResolvedValue(undefined);
  const { container } = render(
    <OpportunityComparison
      opportunities={[higher, lower, unknown]}
      budget={200}
      focusedId={null}
      onFocus={onFocus}
      error={null}
    />
  );
  const dialog = document.body.querySelector('dialog')!;
  dialog.showModal = () => {
    dialog.setAttribute('open', '');
  };
  const user = userEvent.setup();
  await user.click(within(container).getByRole('button', { name: 'Compare My Options' }));
  expect(screen.getByText('$250.00 over budget')).toBeVisible();
  expect(screen.getByText('Within budget')).toBeVisible();
  await user.click(screen.getByRole('button', { name: `Focus on ${lower.title}` }));
  expect(onFocus).toHaveBeenCalledWith(lower.id);
  await user.selectOptions(screen.getByLabelText('Second opportunity'), unknown.id);
  expect(screen.getByText('Cost unknown')).toBeVisible();
});
