import type { Opportunity, PlanItem } from './index.js';

export const DEMO_PERSONA_IDS = ['maria', 'james', 'aisha'] as const;
export type DemoPersonaId = typeof DEMO_PERSONA_IDS[number];

const DEMO_DATA = [
  {
    id: 'maria',
    opportunities: [
      {
        id: 'demo-maria-opp-1',
        title: 'UX / Product Designer',
        category: 'career-pivot',
        summary: 'Your retail management experience translates directly into understanding user needs and designing intuitive products.',
        reasoning: 'Strong people skills, conflict resolution, and process optimisation are core to UX work. Build a research portfolio and compare training options before paying for a course. This fictional example does not predict earnings.',
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
    id: 'james',
    opportunities: [
      {
        id: 'demo-james-opp-1',
        title: 'Fleet & Logistics Coordinator',
        category: 'career-pivot',
        summary: 'Your hands-on driving and route-planning experience positions you perfectly to coordinate logistics operations from the office.',
        reasoning: 'Explore office-based logistics roles that may reduce driving demands; compare local job requirements and pay. Your practical knowledge of routing, vehicle maintenance, and time management is rare in desk candidates.',
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
    id: 'aisha',
    opportunities: [
      {
        id: 'demo-aisha-opp-1',
        title: 'Corporate Events & Travel Coordinator',
        category: 'career-pivot',
        summary: 'Your multilingual communication and event-planning background is highly sought after in corporate settings.',
        reasoning: 'Compare corporate event roles, schedules, and local entry requirements before choosing a training path. Multilingual coordinators command a premium in international firms.',
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
 ] as const;

/** One source for seeded and offline fictional demos. Every call returns fresh data. */
export function createDemoOpportunities(personaId: DemoPersonaId, now = new Date()): Opportunity[] {
  const persona = DEMO_DATA.find((entry) => entry.id === personaId)!;
  return [...persona.opportunities]
    .sort((a, b) => b.feasibilityScore - a.feasibilityScore)
    .map((entry, rank) => {
      const target = entry.title;
      const actions = entry.category === 'micro-business'
        ? [
          `Define the customer and offer for ${target}`,
          `Interview three possible customers about ${target}`,
          `Estimate a small test budget for ${target}`,
          `Compare local rules and practical requirements for ${target}`,
          `Draft a sample offer for ${target}`,
          `Ask potential customers for feedback on ${target}`,
          `Build one small pilot for ${target}`,
          `Compare pricing and costs for ${target}`,
          `Test a customer outreach message for ${target}`,
          `Record pilot feedback and risks for ${target}`,
          `Adjust the offer and workload for ${target}`,
          `Choose the next measurable milestone for ${target}`,
        ]
        : [
          `Compare three entry routes into ${target}`,
          `Map existing skills to ${target} requirements`,
          `Choose a free introduction to ${target}`,
          `Complete the first practice exercise for ${target}`,
          `Outline a small ${target} portfolio project`,
          `Ask a professional about day-to-day ${target} work`,
          `Build a first ${target} work sample`,
          `Check the sample against ${target} entry requirements`,
          `Get feedback on the ${target} sample`,
          `Update the resume with relevant ${target} evidence`,
          `Compare three realistic ${target} opportunities`,
          `Choose the next measurable ${target} learning or application goal`,
        ];
      const days = [1, 3, 5, 8, 10, 12, 15, 17, 19, 22, 26, 30];
      const planItems: PlanItem[] = actions.map((title, index) => ({
        id: `${entry.id}-item-${index + 1}`, day: days[index], week: Math.floor(index / 3) + 1,
        title, description: `Fictional ${personaId} demo action for ${target}; adapt it to real constraints.`,
        isCompleted: index < entry.completedCount,
        completedAt: index < entry.completedCount ? new Date(now) : null,
      }));
      return {
        id: entry.id, title: entry.title, category: entry.category,
        summary: entry.summary, reasoning: entry.reasoning, feasibilityScore: entry.feasibilityScore,
        rank: rank + 1, planItems,
      };
    });
}
