import { Router } from 'express';
import { randomUUID } from 'crypto';
import {
  AnalyzeRequestSchema,
  RawAIResponseSchema,
  type Opportunity,
  type PlanItem,
  type Session,
} from '@restart-ai/shared';
import { generateContent, GeminiError } from '../lib/gemini.js';
import { computeFeasibilityScore, assignRanks } from '../lib/scoring.js';
import { buildAnalyzePrompt } from '../prompts/analyze.js';

export const analyzeRouter = Router();

analyzeRouter.post('/', async (req, res) => {
  // 1. Validate request body
  const parsed = AnalyzeRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: 'Invalid request',
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }
  const profile = parsed.data;

  // 2. Build prompt and call Gemini
  let rawText: string;
  try {
    rawText = await generateContent(buildAnalyzePrompt(profile));
  } catch (err) {
    if (err instanceof GeminiError) {
      res.status(502).json({ error: 'AI service unavailable. Please try again shortly.' });
    } else {
      res.status(502).json({ error: 'AI service error. Please try again shortly.' });
    }
    return;
  }

  // 3. Extract JSON from the response (strip any accidental code fences)
  const jsonText = rawText
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  let parsed2: ReturnType<typeof RawAIResponseSchema.safeParse>;
  try {
    parsed2 = RawAIResponseSchema.safeParse(JSON.parse(jsonText));
  } catch {
    res.status(502).json({ error: 'AI returned malformed data. Please try again.' });
    return;
  }

  if (!parsed2.success) {
    res.status(502).json({ error: 'AI response did not match expected format. Please try again.' });
    return;
  }

  const rawOpportunities = parsed2.data.opportunities;

  // 4. Compute feasibility scores in TypeScript (never from AI)
  const scores = rawOpportunities.map((o) =>
    computeFeasibilityScore(o.signals)
  );
  const ranks = assignRanks(scores);

  // 5. Build typed Opportunity objects with server-generated IDs
  const now = new Date();
  const sessionId = randomUUID();

  const opportunities: Opportunity[] = rawOpportunities.map((raw, i) => {
    const oppId = randomUUID();
    const planItems: PlanItem[] = raw.planItems.map((item) => ({
      id: randomUUID(),
      day: item.day,
      week: item.week,
      title: item.title,
      description: item.description,
      resourceUrl: item.resourceUrl,
      isCompleted: false,
    }));

    return {
      id: oppId,
      title: raw.title,
      category: raw.category,
      summary: raw.summary,
      reasoning: raw.reasoning,
      feasibilityScore: scores[i],
      rank: ranks[i],
      planItems,
    };
  });

  // Sort by rank ascending for the response
  opportunities.sort((a, b) => a.rank - b.rank);

  // 6. Return session (DB persistence comes in ST-4)
  const session: Session = {
    id: sessionId,
    createdAt: now,
    updatedAt: now,
    opportunities,
  };

  res.status(200).json(session);
});
