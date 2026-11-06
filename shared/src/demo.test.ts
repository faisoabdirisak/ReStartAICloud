import { describe, expect, it } from 'vitest';
import { createDemoOpportunities, DEMO_PERSONA_IDS, OpportunitySchema } from './index';
describe('fictional demo datasets', () => {
  it('provides distinct validated results and four-week plans for all three personas', () => {
    const titles = new Set<string>(); const ids = new Set<string>();
    for (const persona of DEMO_PERSONA_IDS) {
      const opportunities = createDemoOpportunities(persona);
      expect(opportunities).toHaveLength(3);
      opportunities.forEach((opp, index) => {
        expect(OpportunitySchema.safeParse(opp).success).toBe(true);
        expect(opp.rank).toBe(index + 1);
        if (index > 0) expect(opp.feasibilityScore).toBeLessThanOrEqual(opportunities[index - 1].feasibilityScore);
        titles.add(opp.title); ids.add(opp.id);
        expect(new Set(opp.planItems.map((item) => item.week))).toEqual(new Set([1, 2, 3, 4]));
        expect(opp.planItems).toHaveLength(12);
        expect(opp.planItems.at(-1)?.day).toBe(30);
      });
    }
    expect(titles.size).toBe(9); expect(ids.size).toBe(9);
  });
  it('returns fresh data so changes never leak into another demo instance', () => {
    const first = createDemoOpportunities('james'); first[0].planItems[11].isCompleted = true;
    expect(createDemoOpportunities('james')[0].planItems[11].isCompleted).toBe(false);
  });
});
