/**
 * Session routes — restore, update progress, select opportunity, clear.
 *
 * All state-changing routes validate the cookie token for guest isolation.
 * A guest can only access sessions tied to their own cookie.
 */
import { Router } from 'express';
import { Prisma } from '@prisma/client';
import {
  ProgressUpdateSchema,
  SelectOpportunitySchema,
  type Opportunity,
  type PlanItem,
  type Session,
} from '@restart-ai/shared';
import { prisma } from '../lib/db.js';
import { getSessionToken, clearSessionCookie } from '../lib/session.js';

type SessionWithRelations = Prisma.SessionGetPayload<{
  include: { opportunities: { include: { planItems: { include: { progressEntry: true } } } } };
}>;

export const sessionsRouter = Router();

// ── Helper: load session + verify it belongs to this guest ──────────────────
async function loadOwnSession(cookieToken: string): Promise<SessionWithRelations | null> {
  return prisma.session.findUnique({
    where: { cookieToken },
    include: {
      opportunities: {
        include: { planItems: { include: { progressEntry: true } } },
      },
    },
  });
}

function buildSessionResponse(dbSession: SessionWithRelations | null): Session | null {
  if (!dbSession) return null;
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
      })),
    }))
    .sort((a, b) => a.rank - b.rank);

  return {
    id: dbSession.id,
    createdAt: dbSession.createdAt,
    updatedAt: dbSession.updatedAt,
    selectedOpportunityId: dbSession.selectedOpportunityId ?? null,
    opportunities,
  };
}

// ── GET /api/sessions/me — restore session from cookie ──────────────────────
sessionsRouter.get('/me', async (req, res) => {
  const token = getSessionToken(req);
  if (!token) {
    res.status(204).end(); // no session — client should show empty state
    return;
  }

  const dbSession = await loadOwnSession(token).catch(() => null);
  if (!dbSession) {
    res.status(204).end();
    return;
  }

  res.json(buildSessionResponse(dbSession));
});

// ── PATCH /api/sessions/me/progress — toggle a plan item ────────────────────
sessionsRouter.patch('/me/progress', async (req, res) => {
  const token = getSessionToken(req);
  if (!token) {
    res.status(401).json({ error: 'No session cookie.' });
    return;
  }

  const parsed = ProgressUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid request', details: parsed.error.flatten().fieldErrors });
    return;
  }
  const { planItemId, isCompleted } = parsed.data;

  // Verify the plan item belongs to this guest's session
  const item = await prisma.planItem.findUnique({
    where: { id: planItemId },
    include: { opportunity: { include: { session: true } } },
  });

  if (!item || item.opportunity.session.cookieToken !== token) {
    res.status(403).json({ error: 'Access denied.' });
    return;
  }

  // Upsert the progress entry
  await prisma.progressEntry.upsert({
    where: { planItemId },
    create: {
      planItemId,
      isCompleted,
      completedAt: isCompleted ? new Date() : null,
    },
    update: {
      isCompleted,
      completedAt: isCompleted ? new Date() : null,
    },
  });

  // Update session updatedAt
  await prisma.session.update({
    where: { id: item.opportunity.sessionId },
    data: { updatedAt: new Date() },
  });

  res.status(204).end();
});

// ── PATCH /api/sessions/me/select — set selected opportunity ────────────────
sessionsRouter.patch('/me/select', async (req, res) => {
  const token = getSessionToken(req);
  if (!token) {
    res.status(401).json({ error: 'No session cookie.' });
    return;
  }

  const parsed = SelectOpportunitySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid request', details: parsed.error.flatten().fieldErrors });
    return;
  }
  const { opportunityId } = parsed.data;

  // If selecting a specific opportunity, verify it belongs to this guest
  if (opportunityId !== null) {
    const opp = await prisma.opportunity.findUnique({
      where: { id: opportunityId },
      include: { session: true },
    });
    if (!opp || opp.session.cookieToken !== token) {
      res.status(403).json({ error: 'Access denied.' });
      return;
    }
    await prisma.session.update({
      where: { cookieToken: token },
      data: { selectedOpportunityId: opportunityId },
    });
  } else {
    await prisma.session.update({
      where: { cookieToken: token },
      data: { selectedOpportunityId: null },
    });
  }

  res.status(204).end();
});

// ── DELETE /api/sessions/me — clear session (start over) ────────────────────
sessionsRouter.delete('/me', async (req, res) => {
  const token = getSessionToken(req);
  if (!token) {
    res.status(204).end(); // nothing to clear
    return;
  }

  const dbSession = await prisma.session.findUnique({ where: { cookieToken: token } });
  if (dbSession) {
    // Cascade delete removes opportunities, plan items, progress entries
    await prisma.session.delete({ where: { id: dbSession.id } });
  }

  clearSessionCookie(res);
  res.status(204).end();
});
