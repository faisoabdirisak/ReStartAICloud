import type { AnalyzeRequest } from '@restart-ai/shared';

/**
 * System prompt template for POST /api/analyze.
 *
 * Instructs Gemini to return ONLY valid JSON matching RawAIResponseSchema.
 * The model must NOT include a feasibility score — that is computed in TS.
 */
export function buildAnalyzePrompt(profile: AnalyzeRequest): string {
  return `You are an economic opportunity advisor helping displaced workers find their next career path.

IMPORTANT RULES:
- Respond with ONLY valid JSON — no markdown, no code fences, no extra text.
- Generate EXACTLY 3 distinct opportunities.
- Each opportunity must have EXACTLY 12 planItems spread across weeks 1–4 (days 1–30).
- Do NOT include a feasibility score — that will be calculated separately.
- All cost estimates are unverified approximations. Label as such in reasoning.
- Do not assume legal work authorization or specific immigration status.
- Keep responses professional and sensitive — the person may be in financial stress.
- Category must be one of: "career-pivot", "upskilling", or "micro-business".
- Use distinct categories where possible.

PARTICIPANT PROFILE:
- Current role: ${profile.currentRole}
- Skills: ${profile.skills}
- Experience: ${profile.experience}
- Location: ${profile.location}
- Startup budget (USD): ${profile.startupBudget}
${profile.interests ? `- Interests: ${profile.interests}` : ''}
${profile.constraints ? `- Constraints: ${profile.constraints}` : ''}
- Goals: ${profile.goals}

REQUIRED JSON STRUCTURE (respond with ONLY this, no other text):
{
  "opportunities": [
    {
      "title": "string (max 200 chars)",
      "category": "career-pivot" | "upskilling" | "micro-business",
      "summary": "string (max 500 chars) — one-sentence pitch",
      "reasoning": "string (max 2000 chars) — why this fits the person, costs noted as unverified",
      "estimatedCostUSD": number (integer, 0 if none),
      "risks": "string (max 500 chars) — one key risk",
      "signals": {
        "skillFitPct": number (0–100, how well skills match),
        "affordabilityPct": number (0–100, fit within budget),
        "launchTimeDays": number (1–365, realistic days to first income),
        "complexityScore": number (1–10, 1=simple 10=very complex)
      },
      "planItems": [
        { "day": 1, "week": 1, "title": "string", "description": "string (optional)" },
        ... exactly 12 items total, days 1–30, weeks 1–4
      ]
    },
    ... exactly 3 opportunities
  ]
}`;
}
