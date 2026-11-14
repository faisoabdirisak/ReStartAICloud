import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { createDemoOpportunities, EvaluationInputSchema } from '@restart-ai/shared';
import { asyncHandler } from '../lib/asyncHandler.js';
import { prisma } from '../lib/db.js';
import { getSessionToken } from '../lib/session.js';

export const evaluationsRouter = Router();
const publicFields = {
  source: true,
  id: true,
  createdAt: true,
  opportunityTitle: true,
  name: true,
  role: true,
  affiliation: true,
  fit: true,
  reason: true,
  firstStep: true,
  usefulness: true,
  reportChanges: true,
  friction: true,
} as const;

evaluationsRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    res.json(
      await prisma.evaluation.findMany({
        select: publicFields,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: 100,
      })
    );
  })
);

evaluationsRouter.post(
  '/',
  rateLimit({
    windowMs: 15 * 60_000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many feedback submissions. Please try again later.' },
  }),
  asyncHandler(async (req, res) => {
    const parsed = EvaluationInputSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Check the required fields and publication consent.' });
      return;
    }
    const { opportunityId, demoPersona, publish, ...answers } = parsed.data;
    const token = getSessionToken(req);
    if (!demoPersona && !token) {
      res.status(401).json({ error: 'Run a live analysis before submitting live feedback.' });
      return;
    }
    const opportunity = demoPersona
      ? createDemoOpportunities(demoPersona).find((item) => item.id === opportunityId)
      : await prisma.opportunity.findFirst({
          where: { id: opportunityId, session: { cookieToken: token! } },
          select: { title: true },
        });
    if (!opportunity || !publish) {
      res.status(404).json({ error: 'This recommendation is unavailable for review.' });
      return;
    }
    res.status(201).json(
      await prisma.evaluation.create({
        data: { ...answers, source: demoPersona ?? 'live', opportunityTitle: opportunity.title },
        select: publicFields,
      })
    );
  })
);
