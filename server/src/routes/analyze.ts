import { Router } from 'express';
import { Prisma } from '@prisma/client';
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
import { prisma } from '../lib/db.js';
import { setSessionCookie } from '../lib/session.js';

type SessionWithRelations = Prisma.SessionGetPayload<{
  include: { opportunities: { include: { planItems: { include: { progressEntry: true } } } } };
}>;

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
  const scores = rawOpportunities.map((o) => computeFeasibilityScore(o.signals));
  const ranks = assignRanks(scores);

  // 5. Persist to database
  let dbSession: SessionWithRelations;
  try {
    dbSession = await prisma.session.create({
      data: {
        opportunities: {
          create: rawOpportunities.map((raw, i) => ({
            title: raw.title,
            category: raw.category,
            summary: raw.summary,
            reasoning: raw.reasoning,
            feasibilityScore: scores[i],
            rank: ranks[i],
            planItems: {
              create: raw.planItems.map((item) => ({
                day: item.day,
                week: item.week,
                title: item.title,
                description: item.description ?? null,
                resourceUrl: item.resourceUrl ?? null,
              })),
            },
          })),
        },
      },
      include: {
        opportunities: {
          include: { planItems: { include: { progressEntry: true } } },
        },
      },
    });
  } catch {
    res.status(500).json({ error: 'Failed to save your results. Please try again.' });
    return;
  }

  // 6. Build typed response — cookieToken is NEVER sent to the client
  const opportunities: Opportunity[] = dbSession.opportunities
    .map((opp) => ({
      id: opp.id,
      title: opp.title,
      category: opp.category as Opportunity['category'],
      summary: opp.summary,
      reasoning: opp.reasoning,
      feasibilityScore: opp.feasibilityScore,
      rank: opp.rank,
      planItems: opp.planItems.map((item): PlanItem => ({
        id: item.id,
        day: item.day,
        week: item.week,
        title: item.title,
        description: item.description ?? undefined,
        resourceUrl: item.resourceUrl ?? undefined,
        isCompleted: item.progressEntry?.isCompleted ?? false,
        completedAt: item.progressEntry?.completedAt ?? null,
      })),
    }))
    .sort((a, b) => a.rank - b.rank);

  const session: Session = {
    id: dbSession.id,
    createdAt: dbSession.createdAt,
    updatedAt: dbSession.updatedAt,
    selectedOpportunityId: null,
    opportunities,
  };

  // 7. Set HttpOnly cookie with the opaque token (guest isolation)
  setSessionCookie(res, dbSession.cookieToken);

  res.status(200).json(session);
});
