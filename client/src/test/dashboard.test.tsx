/**
 * DashboardPreview tests — progress calculations, streak display,
 * selected opportunity highlight, empty state, and start-over confirmation.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DashboardPreview } from '../components/DashboardPreview';
import type { Opportunity } from '@restart-ai/shared';

// ── Fixtures ──────────────────────────────────────────────────────────────────
const makePlanItem = (
  id: string,
  isCompleted: boolean,
  completedAt: Date | null = null,
) => ({
  id,
  day: 1,
  week: 1,
  title: `Step ${id}`,
  isCompleted,
  completedAt,
});

const makeOpp = (
  id: string,
  rank: number,
  completedIds: string[] = [],
  totalItems = 4,
): Opportunity => ({
  id,
  title: `Opportunity ${id}`,
  category: 'career-pivot' as const,
  summary: 'A great opportunity',
  reasoning: 'Strong fit',
  feasibilityScore: 80,
  rank,
  planItems: Array.from({ length: totalItems }, (_, i) => {
    const itemId = `${id}-item-${i + 1}`;
    return makePlanItem(itemId, completedIds.includes(itemId));
  }),
});

const DEFAULT_PROPS = {
  selectedOpportunityId: null,
  streak: 0,
  onViewPlan: vi.fn(),
  onSelectOpp: vi.fn(),
  onStartOver: vi.fn(),
};

// ── Tests ─────────────────────────────────────────────────────────────────────
// Helper: find a stat card value by its label
function getStatValue(label: string) {
  // The label text is in a sibling div — find the container and read the value div
  const labelEl = screen.getByText(label);
  const valueEl = labelEl.closest('div')?.previousElementSibling;
  return valueEl?.textContent ?? '';
}

describe('DashboardPreview — empty state', () => {
  it('renders heading and tracker subtitle', () => {
    render(<DashboardPreview {...DEFAULT_PROPS} opportunities={[]} />);
    expect(screen.getByRole('region', { name: /your progress/i })).toBeInTheDocument();
    expect(screen.getByText(/track your 30-day action plans/i)).toBeInTheDocument();
  });

  it('shows 0 steps complete and 0% overall with no opportunities', () => {
    render(<DashboardPreview {...DEFAULT_PROPS} opportunities={[]} />);
    expect(getStatValue('Steps Complete')).toBe('0/0');
    expect(getStatValue('Overall')).toBe('0%');
  });

  it('shows streak label and Day Streak stat card', () => {
    render(<DashboardPreview {...DEFAULT_PROPS} opportunities={[]} streak={0} />);
    expect(screen.getByText('Day Streak')).toBeInTheDocument();
    expect(getStatValue('Day Streak')).toBe('0');
  });
});

describe('DashboardPreview — progress calculations', () => {
  it('shows correct steps-complete count', () => {
    const opps = [makeOpp('opp-1', 1, ['opp-1-item-1', 'opp-1-item-2'])];
    render(<DashboardPreview {...DEFAULT_PROPS} opportunities={opps} />);
    expect(getStatValue('Steps Complete')).toBe('2/4');
  });

  it('shows correct overall percentage', () => {
    const opps = [makeOpp('opp-1', 1, ['opp-1-item-1', 'opp-1-item-2'])];
    render(<DashboardPreview {...DEFAULT_PROPS} opportunities={opps} />);
    expect(getStatValue('Overall')).toBe('50%');
  });

  it('sums completed items across multiple opportunities', () => {
    const opps = [
      makeOpp('opp-1', 1, ['opp-1-item-1']),
      makeOpp('opp-2', 2, ['opp-2-item-1', 'opp-2-item-2', 'opp-2-item-3']),
    ];
    render(<DashboardPreview {...DEFAULT_PROPS} opportunities={opps} />);
    expect(getStatValue('Steps Complete')).toBe('4/8');
  });

  it('shows 100% when all items are completed', () => {
    const opps = [makeOpp('opp-1', 1, ['opp-1-item-1', 'opp-1-item-2', 'opp-1-item-3', 'opp-1-item-4'])];
    render(<DashboardPreview {...DEFAULT_PROPS} opportunities={opps} />);
    expect(getStatValue('Overall')).toBe('100%');
  });
});

describe('DashboardPreview — streak display', () => {
  it('shows streak value with fire emoji when > 0', () => {
    const opps = [makeOpp('opp-1', 1)];
    render(<DashboardPreview {...DEFAULT_PROPS} opportunities={opps} streak={3} />);
    expect(getStatValue('Day Streak')).toBe('3🔥');
  });

  it('shows plain 0 when streak is 0', () => {
    const opps = [makeOpp('opp-1', 1)];
    render(<DashboardPreview {...DEFAULT_PROPS} opportunities={opps} streak={0} />);
    expect(getStatValue('Day Streak')).toBe('0');
  });
});

describe('DashboardPreview — selected opportunity', () => {
  it('highlights the selected opportunity card', () => {
    const opps = [makeOpp('opp-1', 1), makeOpp('opp-2', 2)];
    render(
      <DashboardPreview
        {...DEFAULT_PROPS}
        opportunities={opps}
        selectedOpportunityId="opp-1"
      />,
    );
    const focusedBtn = screen.getByRole('button', { name: /focused/i });
    expect(focusedBtn).toHaveAttribute('aria-pressed', 'true');
  });

  it('calls onSelectOpp with the opportunity id when Focus is clicked', async () => {
    const onSelectOpp = vi.fn();
    const opps = [makeOpp('opp-1', 1)];
    render(
      <DashboardPreview
        {...DEFAULT_PROPS}
        opportunities={opps}
        onSelectOpp={onSelectOpp}
        selectedOpportunityId={null}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /^focus$/i }));
    expect(onSelectOpp).toHaveBeenCalledWith('opp-1');
  });

  it('calls onSelectOpp with null when Focused (deselect) is clicked', async () => {
    const onSelectOpp = vi.fn();
    const opps = [makeOpp('opp-1', 1)];
    render(
      <DashboardPreview
        {...DEFAULT_PROPS}
        opportunities={opps}
        onSelectOpp={onSelectOpp}
        selectedOpportunityId="opp-1"
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /focused/i }));
    expect(onSelectOpp).toHaveBeenCalledWith(null);
  });
});

describe('DashboardPreview — start over', () => {
  it('shows confirmation dialog before calling onStartOver', async () => {
    const onStartOver = vi.fn();
    render(
      <DashboardPreview
        {...DEFAULT_PROPS}
        opportunities={[makeOpp('opp-1', 1)]}
        onStartOver={onStartOver}
      />,
    );
    // First click reveals the confirmation
    await userEvent.click(screen.getByRole('button', { name: /start over/i }));
    expect(screen.getByText(/clear session\?/i)).toBeInTheDocument();
    expect(onStartOver).not.toHaveBeenCalled();

    // Confirming "Yes" calls the handler
    await userEvent.click(screen.getByRole('button', { name: /^yes$/i }));
    expect(onStartOver).toHaveBeenCalledOnce();
  });

  it('cancels without calling onStartOver', async () => {
    const onStartOver = vi.fn();
    render(
      <DashboardPreview
        {...DEFAULT_PROPS}
        opportunities={[makeOpp('opp-1', 1)]}
        onStartOver={onStartOver}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /start over/i }));
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onStartOver).not.toHaveBeenCalled();
  });
});
