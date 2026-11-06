import { describe, it, expect } from 'vitest';
import {
  AnalyzeRequestSchema,
  getFeasibilityTier,
  OpportunitySchema,
  computeStreak,
} from './index.js';

describe('AnalyzeRequestSchema', () => {
  it('accepts valid input', () => {
    const result = AnalyzeRequestSchema.safeParse({
      currentRole: 'Retail Manager',
      skills: 'Customer service, inventory management',
      experience: '5 years managing a team of 12',
      location: 'Chicago, IL',
      startupBudget: 500,
      goals: 'Find a remote role with better work-life balance',
    });
    expect(result.success).toBe(true);
  });

  it('defaults startupBudget to 0 when omitted', () => {
    const result = AnalyzeRequestSchema.safeParse({
      currentRole: 'Driver',
      skills: 'Logistics',
      experience: '3 years',
      location: 'Houston',
      goals: 'New career',
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.startupBudget).toBe(0);
  });

  it('rejects empty currentRole', () => {
    const result = AnalyzeRequestSchema.safeParse({
      currentRole: '',
      skills: 'Something',
      experience: '1 year',
      location: 'Chicago',
      goals: 'Goal',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing required fields', () => {
    const result = AnalyzeRequestSchema.safeParse({ currentRole: 'Manager' });
    expect(result.success).toBe(false);
  });
});

describe('getFeasibilityTier', () => {
  it('returns green for score >= 75', () => {
    expect(getFeasibilityTier(75)).toBe('green');
    expect(getFeasibilityTier(100)).toBe('green');
  });

  it('returns amber for score 50–74', () => {
    expect(getFeasibilityTier(50)).toBe('amber');
    expect(getFeasibilityTier(74)).toBe('amber');
  });

  it('returns red for score < 50', () => {
    expect(getFeasibilityTier(0)).toBe('red');
    expect(getFeasibilityTier(49)).toBe('red');
  });
});

describe('OpportunitySchema', () => {
  it('accepts valid opportunity', () => {
    const result = OpportunitySchema.safeParse({
      id: 'opp-1',
      title: 'Project Manager',
      category: 'career-pivot',
      summary: 'Leverage your leadership skills.',
      reasoning: 'Strong transferable skills from retail management.',
      feasibilityScore: 82,
      rank: 1,
      planItems: [],
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid category', () => {
    const result = OpportunitySchema.safeParse({
      id: 'opp-1',
      title: 'Something',
      category: 'invalid-category',
      summary: 'Summary',
      reasoning: 'Reasoning',
      feasibilityScore: 50,
      rank: 1,
      planItems: [],
    });
    expect(result.success).toBe(false);
  });

  it('rejects feasibilityScore > 100', () => {
    const result = OpportunitySchema.safeParse({
      id: 'opp-1',
      title: 'Something',
      category: 'upskilling',
      summary: 'Summary',
      reasoning: 'Reasoning',
      feasibilityScore: 101,
      rank: 1,
      planItems: [],
    });
    expect(result.success).toBe(false);
  });
});

// ── Helpers ───────────────────────────────────────────────────────────────────
const completedItem = (completedAt: Date) => ({ isCompleted: true, completedAt });
const pendingItem = () => ({ isCompleted: false as const, completedAt: null });

// Fixed "now" for all streak tests: 2026-11-06T12:00:00Z
const NOW = new Date('2026-11-06T12:00:00Z');
const day = (iso: string) => new Date(iso);

describe('computeStreak', () => {
  it('returns 0 when no items exist', () => {
    expect(computeStreak([], NOW)).toBe(0);
  });

  it('returns 0 when all items are pending (isCompleted false)', () => {
    expect(computeStreak([pendingItem(), pendingItem()], NOW)).toBe(0);
  });

  it('returns 0 when isCompleted true but completedAt is null', () => {
    expect(computeStreak([{ isCompleted: true, completedAt: null }], NOW)).toBe(0);
  });

  it('returns 1 when only today has a completion', () => {
    expect(computeStreak([completedItem(day('2026-11-06T08:00:00Z'))], NOW)).toBe(1);
  });

  it('returns 1 when only yesterday has a completion (streak still alive)', () => {
    expect(computeStreak([completedItem(day('2026-11-05T23:00:00Z'))], NOW)).toBe(1);
  });

  it('returns 0 when last completion was two days ago (broken streak)', () => {
    expect(computeStreak([completedItem(day('2026-11-04T10:00:00Z'))], NOW)).toBe(0);
  });

  it('returns 3 for three consecutive days ending today', () => {
    const items = [
      completedItem(day('2026-11-04T09:00:00Z')),
      completedItem(day('2026-11-05T09:00:00Z')),
      completedItem(day('2026-11-06T09:00:00Z')),
    ];
    expect(computeStreak(items, NOW)).toBe(3);
  });

  it('counts only the tail run when there is a gap', () => {
    const items = [
      completedItem(day('2026-11-01T09:00:00Z')), // gap — isolated
      completedItem(day('2026-11-05T09:00:00Z')),
      completedItem(day('2026-11-06T09:00:00Z')),
    ];
    expect(computeStreak(items, NOW)).toBe(2);
  });

  it('deduplicates multiple completions on the same calendar day', () => {
    const items = [
      completedItem(day('2026-11-06T06:00:00Z')),
      completedItem(day('2026-11-06T14:00:00Z')), // same UTC day
    ];
    expect(computeStreak(items, NOW)).toBe(1);
  });

  it('unchecked items (completedAt null) do not contribute to the streak', () => {
    const items = [
      pendingItem(),
      completedItem(day('2026-11-06T09:00:00Z')),
    ];
    expect(computeStreak(items, NOW)).toBe(1);
  });
});
