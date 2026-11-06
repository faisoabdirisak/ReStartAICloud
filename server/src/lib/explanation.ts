import { OpportunityExplanationSchema, type RawOpportunity, type OpportunityExplanation } from '@restart-ai/shared';

export function createExplanation(raw: RawOpportunity): OpportunityExplanation {
  return OpportunityExplanationSchema.parse({
    version: 1, source: 'ai-estimate', estimatedCostUSD: raw.estimatedCostUSD ?? null,
    risks: raw.risks ?? null, assumptions: raw.assumptions, questionsToVerify: raw.questionsToVerify,
    signals: raw.signals,
  });
}

/** Old, damaged, or unsupported versions never receive invented explanations. */
export function readExplanation(serialized: string | null | undefined): OpportunityExplanation | null {
  if (!serialized) return null;
  try {
    const result = OpportunityExplanationSchema.safeParse(JSON.parse(serialized));
    return result.success ? result.data : null;
  } catch { return null; }
}
