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
  /** ISO timestamp set when isCompleted becomes true; null when unchecked */
  completedAt: z.coerce.date().nullable().optional(),
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

// ---------------------------------------------------------------------------
// Streak counter (shared utility — pure function, easy to unit-test)
//
// Definition:
//   A "streak" is the length of the longest run of consecutive calendar days
//   (in the user's local timezone) ending on today or yesterday on which at
//   least one plan item was completed.
//
// Rules:
//   - Only items where isCompleted === true AND completedAt is a valid Date
//     are counted.
//   - Unchecking a task sets completedAt to null, removing that completion
//     from the streak calculation automatically.
//   - "Today" is determined by the `now` parameter (Date), defaulting to
//     new Date().  Passing `now` makes the function deterministically testable.
//   - If the most recent completion day is before yesterday the streak is 0
//     (the user broke their streak).
//   - Calendar-day boundaries are compared in UTC for consistency across
//     timezones (the server stores completedAt in UTC).
// ---------------------------------------------------------------------------
export function computeStreak(
  planItems: Pick<PlanItem, 'isCompleted' | 'completedAt'>[],
  now: Date = new Date(),
): number {
  // Collect unique UTC calendar days that have at least one completed item
  const completedDays = new Set<string>();
  for (const item of planItems) {
    if (item.isCompleted && item.completedAt) {
      const d = new Date(item.completedAt);
      // YYYY-MM-DD in UTC
      completedDays.add(d.toISOString().slice(0, 10));
    }
  }
  if (completedDays.size === 0) return 0;

  // Convert today to UTC date string
  const todayStr = now.toISOString().slice(0, 10);
  const yesterdayStr = new Date(now.getTime() - 86_400_000).toISOString().slice(0, 10);

  // Streak must include today or yesterday to be live
  const startsFromYesterday = !completedDays.has(todayStr) && completedDays.has(yesterdayStr);
  if (!completedDays.has(todayStr) && !startsFromYesterday) return 0;

  // Walk backwards from today (or yesterday if today has no completions)
  let streak = 0;
  const cursor = new Date(now);
  cursor.setUTCHours(0, 0, 0, 0);
  // If today has no completions, step back to yesterday as the starting point
  if (startsFromYesterday) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  while (true) {
    const dayStr = cursor.toISOString().slice(0, 10);
    if (!completedDays.has(dayStr)) break;
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  return streak;
}
