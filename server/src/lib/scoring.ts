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
export interface ScoringSignals {
  skillFitPct: number;       // 0–100
  affordabilityPct: number;  // 0–100
  launchTimeDays: number;    // 1–365
  complexityScore: number;   // 1–10
}

/** Clamp a value between min and max, then round */
const clamp = (v: number, min: number, max: number) =>
  Math.round(Math.max(min, Math.min(max, v)));

export function computeFeasibilityScore(signals: ScoringSignals): number {
  const skillFit = clamp(signals.skillFitPct, 0, 100);
  const affordability = clamp(signals.affordabilityPct, 0, 100);

  // Normalise launch time: 1 day → 100, 365 days → 0
  const launchDays = clamp(signals.launchTimeDays, 1, 365);
  const launchSpeed = Math.round(((365 - launchDays) / 364) * 100);

  // Normalise complexity: score 1 → 100, score 10 → 0
  const complexity = clamp(signals.complexityScore, 1, 10);
  const simplicity = Math.round((1 - (complexity - 1) / 9) * 100);

  const score =
    skillFit * 0.4 +
    affordability * 0.3 +
    launchSpeed * 0.2 +
    simplicity * 0.1;

  return clamp(score, 0, 100);
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
