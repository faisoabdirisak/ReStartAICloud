import { z } from 'zod';
import type { PlanItem } from './index.js';

export const RefinementConstraints = z.object({
  budget: z.number().int().min(0).max(1_000_000),
  hours: z.number().min(0.5).max(168),
});
export type RefinementConstraints = z.infer<typeof RefinementConstraints>;

const marker = '\n\nAdjusted plan: ';

export function refineRemainingTasks(
  items: PlanItem[],
  { budget, hours }: RefinementConstraints
): PlanItem[] {
  return items.map((item) => {
    if (item.isCompleted) return item;

    const remainingThisWeek = items.filter(
      (task) => task.week === item.week && !task.isCompleted
    ).length;
    const minutes = Math.floor((hours * 60) / remainingThisWeek);
    const original = (item.description ?? '').split(marker)[0];
    const time =
      minutes < 30
        ? `Use up to ${minutes} minutes for the smallest useful first step. Write down what to continue next time.`
        : `Use up to ${minutes} minutes of this week's time for this task. Split longer work into shorter blocks.`;
    const cost =
      budget === 0
        ? 'Use free resources. If this task requires payment, research a free alternative or defer the purchase.'
        : `Check the price before committing. Keep combined spending across the plan within your total $${budget} USD budget and use a free alternative when needed.`;

    const guidance = marker + time + ' ' + cost;
    return { ...item, description: original + guidance };
  });
}
