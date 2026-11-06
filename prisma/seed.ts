/**
 * Seed script — creates 3 fictional demo personas in the database.
 * Each persona has a full session with 3 opportunities and 12 plan items each.
 *
 * Run:  npx tsx --env-file=.env ../prisma/seed.ts   (from server/ dir)
 * Or:   npm run db:seed   (from server/ dir after adding the script)
 *
 * Safe to re-run — deletes existing demo sessions by token before re-seeding.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Stable tokens so judges can share/bookmark demo sessions
const DEMO_TOKENS = {
  maria: 'demo-token-maria-retail-manager',
  james: 'demo-token-james-delivery-driver',
  aisha: 'demo-token-aisha-hospitality',
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function planItems(opportunityId: string, completedCount: number) {
  const items = [
    { day: 1, week: 1, title: 'Research the field and identify the top 5 key skills required' },
    { day: 3, week: 1, title: 'Complete a free introductory course on Coursera or edX' },
    { day: 5, week: 1, title: 'Update LinkedIn headline and summary to reflect new direction' },
    { day: 7, week: 1, title: 'Join 2 relevant online communities (Reddit, Discord, Slack)' },
    { day: 10, week: 2, title: 'Complete first hands-on project or exercise' },
    { day: 12, week: 2, title: 'Connect with 5 professionals in the field via LinkedIn' },
    { day: 14, week: 2, title: 'Apply to 3 entry-level positions or first freelance clients' },
    { day: 16, week: 2, title: 'Attend a virtual meetup, webinar, or online event' },
    { day: 19, week: 3, title: 'Build a simple portfolio piece to demonstrate new skills' },
    { day: 21, week: 3, title: 'Get feedback from a mentor, peer, or online community' },
    { day: 24, week: 4, title: 'Refine your pitch or elevator story for the new role' },
    { day: 28, week: 4, title: 'Set a concrete long-term milestone for month 2 and commit to it' },
  ];
  return items.map((item, i) => ({
    id: `${opportunityId}-item-${i + 1}`,
    day: item.day,
    week: item.week,
    title: item.title,
    description: 'Concrete daily action to move your transition forward.',
    progressEntry:
      i < completedCount
        ? { create: { isCompleted: true, completedAt: new Date() } }
        : undefined,
  }));
}

// ── Persona data ──────────────────────────────────────────────────────────────

const PERSONAS = [
  {
    token: DEMO_TOKENS.maria,
    opportunities: [
      {
        id: 'demo-maria-opp-1',
        title: 'UX / Product Designer',
        category: 'career-pivot',
        summary: 'Your retail management experience translates directly into understanding user needs and designing intuitive products.',
        reasoning: 'Strong people skills, conflict resolution, and process optimisation are core to UX work. With a 12-week bootcamp investment you can enter a high-growth field paying 40% more than your current role.',
        feasibilityScore: 82,
        rank: 1,
        completedCount: 5,
      },
      {
        id: 'demo-maria-opp-2',
        title: 'E-commerce Store Owner',
        category: 'micro-business',
        summary: 'Launch a niche product store leveraging your supply-chain knowledge and customer service expertise.',
        reasoning: 'Low barrier to entry via Shopify. Your inventory management background gives you an edge most new sellers lack. Initial investment under $500.',
        feasibilityScore: 67,
        rank: 2,
        completedCount: 2,
      },
      {
        id: 'demo-maria-opp-3',
        title: 'Data Analytics Certificate',
        category: 'upskilling',
        summary: 'A 6-month Google or IBM Data Analytics certification opens doors in operations, finance, and marketing roles.',
        reasoning: 'Your reporting experience in retail gives you a head start. High demand, remote-friendly, and completable while job-searching.',
        feasibilityScore: 91,
        rank: 3,
        completedCount: 8,
      },
    ],
  },
  {
    token: DEMO_TOKENS.james,
    opportunities: [
      {
        id: 'demo-james-opp-1',
        title: 'Fleet & Logistics Coordinator',
        category: 'career-pivot',
        summary: 'Your hands-on driving and route-planning experience positions you perfectly to coordinate logistics operations from the office.',
        reasoning: 'Logistics coordinators earn 35% more than drivers and face less physical strain. Your practical knowledge of routing, vehicle maintenance, and time management is rare in desk candidates.',
        feasibilityScore: 88,
        rank: 1,
        completedCount: 3,
      },
      {
        id: 'demo-james-opp-2',
        title: 'Commercial Driver Training Instructor',
        category: 'career-pivot',
        summary: 'Share your expertise by becoming a certified CDL training instructor at a community college or driving school.',
        reasoning: 'High demand for experienced instructors, stable hours, and community impact. Certification typically takes 6–8 weeks.',
        feasibilityScore: 74,
        rank: 2,
        completedCount: 1,
      },
      {
        id: 'demo-james-opp-3',
        title: 'CompTIA IT Fundamentals Certificate',
        category: 'upskilling',
        summary: 'A 3-month IT certification opens doors to technical support, fleet telematics, and logistics-tech roles.',
        reasoning: 'The logistics industry is rapidly adopting telematics and route-optimisation software. Your field experience combined with IT skills creates a rare profile employers seek.',
        feasibilityScore: 69,
        rank: 3,
        completedCount: 0,
      },
    ],
  },
  {
    token: DEMO_TOKENS.aisha,
    opportunities: [
      {
        id: 'demo-aisha-opp-1',
        title: 'Corporate Events & Travel Coordinator',
        category: 'career-pivot',
        summary: 'Your multilingual communication and event-planning background is highly sought after in corporate settings.',
        reasoning: 'Corporate event roles pay 50% more than hospitality positions with less irregular hours. Multilingual coordinators command a premium in international firms.',
        feasibilityScore: 85,
        rank: 1,
        completedCount: 4,
      },
      {
        id: 'demo-aisha-opp-2',
        title: 'Language Tutoring Business',
        category: 'micro-business',
        summary: 'Launch a solo language tutoring practice — online platforms like iTalki or Preply let you start earning within a week.',
        reasoning: 'Zero upfront cost, flexible hours, and your multilingual fluency is the product. Experienced tutors earn $25–60/hr. Highly compatible with exploring other paths simultaneously.',
        feasibilityScore: 78,
        rank: 2,
        completedCount: 6,
      },
      {
        id: 'demo-aisha-opp-3',
        title: 'Digital Marketing Certificate',
        category: 'upskilling',
        summary: 'A Google or HubSpot digital marketing certification leverages your customer-facing skills for a fully remote career.',
        reasoning: 'Your communication strengths and cultural awareness are major assets in digital marketing, especially for brands targeting international audiences.',
        feasibilityScore: 80,
        rank: 3,
        completedCount: 2,
      },
    ],
  },
];

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Seeding demo personas…');

  for (const persona of PERSONAS) {
    // Remove stale demo session if it exists
    await prisma.session.deleteMany({
      where: { cookieToken: persona.token },
    });

    // Create fresh session with all nested data
    const session = await prisma.session.create({
      data: {
        cookieToken: persona.token,
        opportunities: {
          create: persona.opportunities.map((opp) => ({
            id: opp.id,
            title: opp.title,
            category: opp.category,
            summary: opp.summary,
            reasoning: opp.reasoning,
            feasibilityScore: opp.feasibilityScore,
            rank: opp.rank,
            planItems: {
              create: planItems(opp.id, opp.completedCount),
            },
          })),
        },
      },
    });

    const personaName = Object.entries(DEMO_TOKENS).find(([, t]) => t === persona.token)?.[0];
    console.log(`  ✓ ${personaName} → session ${session.id}`);
  }

  console.log('✅ Seed complete');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
