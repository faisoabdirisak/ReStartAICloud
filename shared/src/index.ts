import { z } from 'zod';

// ---------------------------------------------------------------------------
// Plan Item
// ---------------------------------------------------------------------------
export const PlanItemSchema = z.object({
  id: z.string(),
  day: z.number().int().min(1).max(30),
  week: z.number().int().min(1).max(4),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  resourceUrl: z.string().url().optional(),
  isCompleted: z.boolean().default(false),
});
export type PlanItem = z.infer<typeof PlanItemSchema>;

// ---------------------------------------------------------------------------
// Opportunity
// NOTE: feasibilityScore is computed server-side in TypeScript — never trusted
//       from AI output. The AI returns raw signals; scoring is deterministic.
// ---------------------------------------------------------------------------
export const OpportunitySchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(200),
  category: z.enum(['career-pivot', 'upskilling', 'micro-business']),
  summary: z.string().max(500),
  reasoning: z.string().max(2000),
  /** 0–100 integer computed by server-side TypeScript, not AI */
  feasibilityScore: z.number().int().min(0).max(100),
  rank: z.number().int().min(1).max(3),
  planItems: z.array(PlanItemSchema),
});
export type Opportunity = z.infer<typeof OpportunitySchema>;

// ---------------------------------------------------------------------------
// Session
// ---------------------------------------------------------------------------
export const SessionSchema = z.object({
  id: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  /** cookieToken is NEVER included in API responses — server-side only */
  selectedOpportunityId: z.string().nullable().optional(),
  opportunities: z.array(OpportunitySchema),
});
export type Session = z.infer<typeof SessionSchema>;

// ---------------------------------------------------------------------------
// Analyze Request (client → server)
// ---------------------------------------------------------------------------
export const AnalyzeRequestSchema = z.object({
  currentRole: z.string().min(1).max(200),
  skills: z.string().min(1).max(1000),
  experience: z.string().min(1).max(500),
  location: z.string().min(1).max(200),
  /** USD, 0 = no budget / bootstrapping */
  startupBudget: z.number().int().min(0).max(1_000_000).default(0),
  interests: z.string().max(500).optional(),
  constraints: z.string().max(1000).optional(),
  goals: z.string().min(1).max(1000),
});
export type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;

// ---------------------------------------------------------------------------
// Raw AI opportunity shape (what Gemini returns — scores NOT included/trusted)
// ---------------------------------------------------------------------------
export const RawPlanItemSchema = z.object({
  day: z.number().int().min(1).max(30),
  week: z.number().int().min(1).max(4),
  title: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  resourceUrl: z.string().url().optional(),
});

export const RawOpportunitySchema = z.object({
  title: z.string().min(1).max(200),
  category: z.enum(['career-pivot', 'upskilling', 'micro-business']),
  summary: z.string().max(500),
  reasoning: z.string().max(2000),
  estimatedCostUSD: z.number().int().min(0).optional(),
  risks: z.string().max(500).optional(),
  /** AI signals used only as inputs to server-side scoring */
  signals: z.object({
    skillFitPct: z.number().int().min(0).max(100),
    affordabilityPct: z.number().int().min(0).max(100),
    launchTimeDays: z.number().int().min(1).max(365),
    complexityScore: z.number().int().min(1).max(10),
  }),
  planItems: z.array(RawPlanItemSchema).length(12),
});
export type RawOpportunity = z.infer<typeof RawOpportunitySchema>;

export const RawAIResponseSchema = z.object({
  opportunities: z.array(RawOpportunitySchema).length(3),
});
export type RawAIResponse = z.infer<typeof RawAIResponseSchema>;

// ---------------------------------------------------------------------------
// Progress Update (client → server)
// ---------------------------------------------------------------------------
export const ProgressUpdateSchema = z.object({
  planItemId: z.string(),
  isCompleted: z.boolean(),
});
export type ProgressUpdate = z.infer<typeof ProgressUpdateSchema>;

// ---------------------------------------------------------------------------
// Select Opportunity (client → server)
// ---------------------------------------------------------------------------
export const SelectOpportunitySchema = z.object({
  opportunityId: z.string().nullable(),
});
export type SelectOpportunity = z.infer<typeof SelectOpportunitySchema>;

// ---------------------------------------------------------------------------
// Feasibility score tiers (shared utility — deterministic, not AI)
// ---------------------------------------------------------------------------
export type FeasibilityTier = 'green' | 'amber' | 'red';

export function getFeasibilityTier(score: number): FeasibilityTier {
  if (score >= 75) return 'green';
  if (score >= 50) return 'amber';
  return 'red';
}
