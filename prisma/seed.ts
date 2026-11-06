/** Refresh fictional demo records only; live guest sessions are never selected. */
import { PrismaClient } from '@prisma/client';
import { createDemoOpportunities, DEMO_PERSONA_IDS } from '../shared/src/demo.js';
const prisma = new PrismaClient();
const tokens = {
  maria: 'demo-token-maria-retail-manager', james: 'demo-token-james-delivery-driver', aisha: 'demo-token-aisha-hospitality',
};
async function main() {
  for (const personaId of DEMO_PERSONA_IDS) {
    const opportunities = createDemoOpportunities(personaId);
    await prisma.$transaction(async (tx) => {
      await tx.session.deleteMany({ where: { cookieToken: tokens[personaId] } });
      await tx.session.create({ data: {
        cookieToken: tokens[personaId],
        opportunities: { create: opportunities.map((opp) => ({
          id: opp.id, title: opp.title, category: opp.category, summary: opp.summary,
          reasoning: opp.reasoning, feasibilityScore: opp.feasibilityScore, rank: opp.rank,
          planItems: { create: opp.planItems.map((item) => ({
            id: item.id, day: item.day, week: item.week, title: item.title, description: item.description,
            progressEntry: item.isCompleted ? { create: { isCompleted: true, completedAt: item.completedAt } } : undefined,
          })) },
        })) },
      } });
    });
    console.log(`Refreshed fictional demo: ${personaId}`);
  }
}
main().catch(() => { console.error('Demo seed failed. Check local database configuration.'); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
