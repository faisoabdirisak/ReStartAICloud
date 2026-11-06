import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FeasibilityRing } from '../components/FeasibilityRing';
import { OpportunityCard } from '../components/OpportunityCard';
import { MOCK_OPPORTUNITIES } from '../data/mockData';

describe('FeasibilityRing', () => {
  it('renders score text', () => {
    render(<FeasibilityRing score={82} />);
    expect(screen.getByText('82')).toBeInTheDocument();
  });

  it('has accessible label', () => {
    render(<FeasibilityRing score={67} />);
    expect(screen.getByRole('img', { name: /feasibility score 67/i })).toBeInTheDocument();
  });
});

describe('OpportunityCard', () => {
  const opp = MOCK_OPPORTUNITIES[0];

  it('renders title and category', () => {
    render(<OpportunityCard opportunity={opp} index={0} onViewPlan={vi.fn()} />);
    expect(screen.getByText(opp.title)).toBeInTheDocument();
    expect(screen.getByText('Career Pivot')).toBeInTheDocument();
  });

  it('calls onViewPlan when CTA clicked', async () => {
    const spy = vi.fn();
    render(<OpportunityCard opportunity={opp} index={0} onViewPlan={spy} />);
    await userEvent.click(screen.getByRole('button', { name: /view 30-day plan/i }));
    expect(spy).toHaveBeenCalledWith(opp.id);
  });

  it('renders feasibility score', () => {
    render(<OpportunityCard opportunity={opp} index={0} onViewPlan={vi.fn()} />);
    expect(screen.getByText(String(opp.feasibilityScore))).toBeInTheDocument();
  });
});
