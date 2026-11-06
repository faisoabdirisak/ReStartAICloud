import { expect, it } from 'vitest';
import { RawOpportunitySchema } from '@restart-ai/shared';
import { createExplanation, readExplanation } from './explanation';
const raw = RawOpportunitySchema.parse({
  title: 'Example', category: 'career-pivot', summary: 'Example', reasoning: 'Example',
  signals: { skillFitPct: 80, affordabilityPct: 50, launchTimeDays: 30, complexityScore: 4 },
  planItems: Array.from({ length: 12 }, (_, i) => ({ day: i + 1, week: 1, title: 'Example' })),
});
it('preserves missing estimates as unknown rather than zero or invented text', () => {
  const result = createExplanation(raw);
  expect(result.estimatedCostUSD).toBeNull(); expect(result.risks).toBeNull();
  expect(result.assumptions).toEqual([]); expect(result.questionsToVerify).toEqual([]);
});
it('round trips a genuine zero cost and supplied caveats', () => {
  const result = createExplanation({ ...raw, estimatedCostUSD: 0, risks: 'Time commitment', assumptions: ['Training time available'], questionsToVerify: ['What fees apply?'] });
  expect(readExplanation(JSON.stringify(result))).toEqual(result);
  expect(result.estimatedCostUSD).toBe(0);
});
it.each([null, undefined, '', '{broken', '{}', '{"version":2}', '{"signals":{"skillFitPct":999}}'])('old or invalid saved explanations safely return null: %s', (value) => {
  expect(readExplanation(value)).toBeNull();
});
