import { z } from 'zod';

export const ScoringSignalsSchema = z.object({
  skillFitPct: z.number().int().min(0).max(100),
  affordabilityPct: z.number().int().min(0).max(100),
  launchTimeDays: z.number().int().min(1).max(365),
  complexityScore: z.number().int().min(1).max(10),
});
export type ScoringSignals = z.infer<typeof ScoringSignalsSchema>;

export const OpportunityExplanationSchema = z.object({
  version: z.literal(1),
  source: z.enum(['ai-estimate', 'fictional-demo']),
  estimatedCostUSD: z.number().int().min(0).nullable(),
  risks: z.string().max(500).nullable(),
  assumptions: z.array(z.string().min(1).max(300)).max(6),
  questionsToVerify: z.array(z.string().min(1).max(300)).max(6),
  signals: ScoringSignalsSchema,
});
export type OpportunityExplanation = z.infer<typeof OpportunityExplanationSchema>;

const clamp = (value: number, min: number, max: number) => Math.round(Math.max(min, Math.min(max, value)));
/** Version-1 formula; shared so displayed points and server scores cannot drift. */
export function calculateScoreBreakdown(signals: ScoringSignals) {
  const factors = [
    { key: 'skillFit', label: 'Skill fit', weight: 40, value: clamp(signals.skillFitPct, 0, 100) },
    { key: 'affordability', label: 'Affordability', weight: 30, value: clamp(signals.affordabilityPct, 0, 100) },
    { key: 'launchSpeed', label: 'Launch speed', weight: 20, value: Math.round(((365 - clamp(signals.launchTimeDays, 1, 365)) / 364) * 100) },
    { key: 'simplicity', label: 'Simplicity', weight: 10, value: Math.round((1 - (clamp(signals.complexityScore, 1, 10) - 1) / 9) * 100) },
  ].map((factor) => ({ ...factor, points: factor.value * (factor.weight / 100) }));
  return { factors, total: clamp(factors.reduce((sum, factor) => sum + factor.points, 0), 0, 100) };
}
