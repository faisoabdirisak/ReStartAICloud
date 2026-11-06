// Mock data for ST-1B UI preview — no server calls, no real API
import type { Opportunity, PlanItem } from '@restart-ai/shared';

const makePlanItems = (opportunityId: string): PlanItem[] =>
  Array.from({ length: 12 }, (_, i) => ({
    id: `${opportunityId}-item-${i + 1}`,
    day: (i + 1) * 2,
    week: Math.ceil((i + 1) / 3),
    title: [
      'Research the field and identify key skills',
      'Complete a free introductory course (Coursera/edX)',
      'Update LinkedIn headline and summary',
      'Join 2 relevant online communities',
      'Complete first hands-on project',
      'Connect with 5 professionals in the field',
      'Apply to 3 entry-level positions or clients',
      'Attend a virtual meetup or webinar',
      'Build a simple portfolio piece',
      'Get feedback from a mentor or peer',
      'Refine your pitch / elevator story',
      'Set long-term milestone for month 2',
    ][i],
    description: 'Concrete daily action to move your transition forward.',
    isCompleted: i < 3,
  }));

export const MOCK_OPPORTUNITIES: Opportunity[] = [
  {
    id: 'opp-1',
    title: 'UX / Product Designer',
    category: 'career-pivot',
    summary:
      'Your retail management experience translates directly into understanding user needs and designing intuitive products.',
    reasoning:
      'Strong people skills, conflict resolution, and process optimisation are core to UX work. With a 12-week bootcamp investment you can enter a high-growth field paying 40% more than your current role.',
    feasibilityScore: 82,
    rank: 1,
    planItems: makePlanItems('opp-1'),
  },
  {
    id: 'opp-2',
    title: 'E-commerce Store Owner',
    category: 'micro-business',
    summary:
      'Launch a niche product store leveraging your supply-chain knowledge and customer service expertise.',
    reasoning:
      'Low barrier to entry via Shopify. Your inventory management background gives you an edge most new sellers lack. Initial investment under $500.',
    feasibilityScore: 67,
    rank: 2,
    planItems: makePlanItems('opp-2'),
  },
  {
    id: 'opp-3',
    title: 'Data Analytics Certificate',
    category: 'upskilling',
    summary:
      'A 6-month Google or IBM Data Analytics certification opens doors in operations, finance, and marketing roles.',
    reasoning:
      'Your reporting experience in retail gives you a head start. High demand, remote-friendly, and completable while job-searching.',
    feasibilityScore: 91,
    rank: 3,
    planItems: makePlanItems('opp-3'),
  },
];

export const MOCK_PERSONAS = [
  {
    id: 'maria',
    name: 'Maria',
    role: 'Former Retail Manager',
    skills: 'Team leadership, inventory, customer service',
    location: 'Chicago, IL',
    goals: 'Remote role, better work-life balance, growth potential',
  },
  {
    id: 'james',
    name: 'James',
    role: 'Laid-off Delivery Driver',
    skills: 'Route planning, vehicle maintenance, logistics',
    location: 'Houston, TX',
    goals: 'Stable income, learn new skills, less physical strain',
  },
  {
    id: 'aisha',
    name: 'Aisha',
    role: 'Ex-Hospitality Worker',
    skills: 'Communication, event planning, multilingual',
    location: 'Miami, FL',
    goals: 'Use languages, creative work, entrepreneurship',
  },
];
