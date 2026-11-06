/**
 * Server-side TypeScript feasibility scorer.
 *
 * Input: AI-supplied raw signals (verified bounds 0–100 / 1–10).
 * Output: deterministic integer 0–100.
 *
 * Formula (weighted sum):
 *   skill_fit       40%  – how well the person's skills match
 *   affordability   30%  – whether startup cost is within budget
 *   launch_speed    20%  – inverse of launch time (faster = higher)
 *   simplicity      10%  – inverse of complexity (simpler = higher)
 *
 * TypeScript controls the formula; AI-supplied signals still influence the score.
 */
import { calculateScoreBreakdown, type ScoringSignals } from '@restart-ai/shared';
export type { ScoringSignals } from '@restart-ai/shared';

export function computeFeasibilityScore(signals: ScoringSignals): number {
  return calculateScoreBreakdown(signals).total;
}

/**
 * Rank three opportunities by their computed feasibility scores (desc).
 * Returns rank 1 (highest) to 3 (lowest).
 */
export function assignRanks(scores: number[]): number[] {
  const indexed = scores.map((s, i) => ({ s, i }));
  indexed.sort((a, b) => b.s - a.s);
  const ranks = new Array<number>(scores.length);
  indexed.forEach(({ i }, rank) => { ranks[i] = rank + 1; });
  return ranks;
}
