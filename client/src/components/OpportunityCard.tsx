import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import type { Opportunity } from '@restart-ai/shared';
import { FeasibilityRing } from './FeasibilityRing';
import { OpportunityExplanation } from './OpportunityExplanation';
import { CategoryBadge } from './CategoryBadge';

interface OpportunityCardProps {
  opportunity: Opportunity;
  index: number;
  onViewPlan: (id: string) => void;
}

export function OpportunityCard({ opportunity, index, onViewPlan }: OpportunityCardProps) {
  const { id, title, category, summary, feasibilityScore, planItems } = opportunity;
  const completedCount = planItems.filter((p) => p.isCompleted).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.1,
        duration: 0.4,
        ease: [0.4, 0, 0.2, 1],
      }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="
        group relative flex flex-col rounded-2xl border border-border-light dark:border-border-dark
        bg-surface-light dark:bg-surface-dark
        shadow-card hover:shadow-card-hover
        dark:hover:border-primary/40
        hover:border-primary/30
        transition-shadow duration-200
        overflow-hidden
      "
    >
      {/* Top accent bar */}
      <div
        className="h-0.5 w-full bg-gradient-to-r from-primary to-primary/40"
        aria-hidden="true"
      />

      <div className="p-6 flex flex-col gap-4 flex-1">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5 flex-1 min-w-0">
            <CategoryBadge category={category} />
            <h3 className="text-lg font-semibold text-app leading-snug">{title}</h3>
          </div>
          <FeasibilityRing score={feasibilityScore} />
        </div>

        {/* Summary */}
        <p className="text-sm text-muted leading-relaxed flex-1">{summary}</p>

        <OpportunityExplanation opportunity={opportunity} />

        {/* Progress indicator */}
        {completedCount > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted">
              <span>{completedCount}/{planItems.length} steps done</span>
              <span>{Math.round((completedCount / planItems.length) * 100)}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-surface-elevated-light dark:bg-surface-elevated-dark overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${(completedCount / planItems.length) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="px-6 pb-6">
        <button
          onClick={() => onViewPlan(id)}
          className="
            w-full flex items-center justify-center gap-2 px-4 py-2.5
            rounded-xl text-sm font-medium
            bg-primary/10 text-primary border border-primary/20
            hover:bg-primary hover:text-white hover:border-primary
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
            transition-all duration-200
          "
          aria-label={`View 30-day plan for ${title}`}
        >
          View 30-Day Plan
          <ChevronRight size={15} />
        </button>
      </div>

      {/* Rank badge */}
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-xs font-bold text-muted">#{opportunity.rank}</span>
      </div>
    </motion.div>
  );
}

interface OpportunityGridProps {
  opportunities: Opportunity[];
  onViewPlan: (id: string) => void;
}

export function OpportunityGrid({ opportunities, onViewPlan }: OpportunityGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {opportunities.map((opp, i) => (
        <OpportunityCard key={opp.id} opportunity={opp} index={i} onViewPlan={onViewPlan} />
      ))}
    </div>
  );
}
