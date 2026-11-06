import { expect, it } from 'vitest';
import { calculateScoreBreakdown, createDemoOpportunities, DEMO_PERSONA_IDS, OpportunityExplanationSchema } from './index';
it('explains the exact 40/30/20/10 weighted formula', () => {
  const breakdown = calculateScoreBreakdown({ skillFitPct: 100, affordabilityPct: 50, launchTimeDays: 365, complexityScore: 10 });
  expect(breakdown.factors.map((factor) => factor.points)).toEqual([40, 15, 0, 0]);
  expect(breakdown.total).toBe(55);
});
it('normalizes fast launch and simple work toward higher scores', () => {
  const result = calculateScoreBreakdown({ skillFitPct: 0, affordabilityPct: 0, launchTimeDays: 1, complexityScore: 1 });
  expect(result.total).toBe(30);
});
it('all fictional demo explanations reconcile with displayed scores', () => {
  for (const id of DEMO_PERSONA_IDS) for (const opp of createDemoOpportunities(id)) {
    expect(OpportunityExplanationSchema.safeParse(opp.explanation).success).toBe(true);
    expect(opp.explanation?.source).toBe('fictional-demo');
    expect(calculateScoreBreakdown(opp.explanation!.signals).total).toBe(opp.feasibilityScore);
  }
});
