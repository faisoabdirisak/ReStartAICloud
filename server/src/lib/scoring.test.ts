import { describe, it, expect } from 'vitest';
import { computeFeasibilityScore, assignRanks } from '../lib/scoring.js';

describe('computeFeasibilityScore', () => {
  it('returns 100 for perfect signals', () => {
    const score = computeFeasibilityScore({
      skillFitPct: 100,
      affordabilityPct: 100,
      launchTimeDays: 7,
      complexityScore: 1,
    });
    expect(score).toBe(100);
  });

  it('returns 0 for worst signals', () => {
    const score = computeFeasibilityScore({
      skillFitPct: 0,
      affordabilityPct: 0,
      launchTimeDays: 365,
      complexityScore: 10,
    });
    expect(score).toBe(0);
  });

  it('applies 40/30/20/10 weighting correctly', () => {
    // skillFit=100 only → 40 pts
    const s1 = computeFeasibilityScore({
      skillFitPct: 100,
      affordabilityPct: 0,
      launchTimeDays: 365,
      complexityScore: 10,
    });
    expect(s1).toBe(40);

    // affordability=100 only → 30 pts
    const s2 = computeFeasibilityScore({
      skillFitPct: 0,
      affordabilityPct: 100,
      launchTimeDays: 365,
      complexityScore: 10,
    });
    expect(s2).toBe(30);
  });

  it('clamps output to 0–100', () => {
    const s = computeFeasibilityScore({
      skillFitPct: 150, // out of range — should clamp
      affordabilityPct: 150,
      launchTimeDays: 0,
      complexityScore: 0,
    });
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThanOrEqual(100);
  });
});

describe('assignRanks', () => {
  it('assigns rank 1 to highest score', () => {
    const ranks = assignRanks([60, 90, 75]);
    expect(ranks[1]).toBe(1); // 90 → rank 1
    expect(ranks[2]).toBe(2); // 75 → rank 2
    expect(ranks[0]).toBe(3); // 60 → rank 3
  });

  it('handles equal scores without throwing', () => {
    const ranks = assignRanks([70, 70, 70]);
    expect(ranks).toHaveLength(3);
    expect(new Set(ranks).size).toBe(3); // all distinct ranks
  });
});
