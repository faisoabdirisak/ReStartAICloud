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
  opportunities: z.array(OpportunitySchema),
});
export type Session = z.infer<typeof SessionSchema>;

// ---------------------------------------------------------------------------
// Analyze Request (client → server)
// ---------------------------------------------------------------------------
export const AnalyzeRequestSchema = z.object({
  currentRole: z.string().min(1).max(200),
  skills: z.string().min(1).max(1000),
  location: z.string().min(1).max(200),
  constraints: z.string().max(1000).optional(),
  goals: z.string().min(1).max(1000),
});
export type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;

// ---------------------------------------------------------------------------
// Progress Update (client → server)
// ---------------------------------------------------------------------------
export const ProgressUpdateSchema = z.object({
  planItemId: z.string(),
  isCompleted: z.boolean(),
});
export type ProgressUpdate = z.infer<typeof ProgressUpdateSchema>;

// ---------------------------------------------------------------------------
// Feasibility score tiers (shared utility — deterministic, not AI)
// ---------------------------------------------------------------------------
export type FeasibilityTier = 'green' | 'amber' | 'red';

export function getFeasibilityTier(score: number): FeasibilityTier {
  if (score >= 75) return 'green';
  if (score >= 50) return 'amber';
  return 'red';
}
