import { describe, it, expect } from 'vitest';
import { AnalyzeRequestSchema, getFeasibilityTier, OpportunitySchema } from './index.js';

describe('AnalyzeRequestSchema', () => {
  it('accepts valid input', () => {
    const result = AnalyzeRequestSchema.safeParse({
      currentRole: 'Retail Manager',
      skills: 'Customer service, inventory management',
      location: 'Chicago, IL',
      goals: 'Find a remote role with better work-life balance',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty currentRole', () => {
    const result = AnalyzeRequestSchema.safeParse({
      currentRole: '',
      skills: 'Something',
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
