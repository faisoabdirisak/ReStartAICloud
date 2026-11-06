import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, Circle, ExternalLink, Calendar } from 'lucide-react';
import type { Opportunity } from '@restart-ai/shared';
import { FeasibilityRing } from './FeasibilityRing';
import { CategoryBadge } from './CategoryBadge';

interface PlanViewProps {
  opportunity: Opportunity;
  onClose: () => void;
  onToggleItem: (itemId: string, completed: boolean) => void;
}

export function PlanView({ opportunity, onClose, onToggleItem }: PlanViewProps) {
  const { title, category, feasibilityScore, reasoning, planItems } = opportunity;

  // Group by week
  const weeks = [1, 2, 3, 4];
  const byWeek = weeks.map((w) => planItems.filter((p) => p.week === w));

  const completedCount = planItems.filter((p) => p.isCompleted).length;
  const pct = Math.round((completedCount / planItems.length) * 100);

  return (
    <AnimatePresence>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 sm:p-8 overflow-y-auto"
        onClick={(e) => e.target === e.currentTarget && onClose()}
        aria-modal="true"
        role="dialog"
        aria-label={`30-day plan for ${title}`}
      >
        <motion.div
          key="panel"
          initial={{ opacity: 0, y: 32, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.98 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="w-full max-w-2xl rounded-2xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark shadow-xl my-4"
        >
          {/* Header */}
          <div className="flex items-start justify-between p-6 border-b border-border-light dark:border-border-dark">
            <div className="flex items-start gap-4 flex-1 min-w-0">
              <FeasibilityRing score={feasibilityScore} size={56} strokeWidth={5} />
              <div className="space-y-1 flex-1 min-w-0">
                <CategoryBadge category={category} />
                <h2 className="text-xl font-bold text-app">{title}</h2>
                <p className="text-xs text-muted">{completedCount}/{planItems.length} steps · {pct}% complete</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-muted hover:text-app hover:bg-surface-elevated-light dark:hover:bg-surface-elevated-dark transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Close plan"
            >
              <X size={18} />
            </button>
          </div>

          {/* Reasoning */}
          <div className="px-6 py-4 border-b border-border-light dark:border-border-dark bg-surface-elevated-light dark:bg-surface-elevated-dark">
            <p className="text-sm text-muted leading-relaxed">{reasoning}</p>
          </div>

          {/* Progress bar */}
          <div className="px-6 py-3 border-b border-border-light dark:border-border-dark">
            <div className="h-2 rounded-full bg-surface-elevated-light dark:bg-surface-elevated-dark overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
              />
            </div>
          </div>

          {/* Plan items by week */}
          <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
            {weeks.map((w, wi) => (
              <div key={w}>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar size={14} className="text-primary" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
                    Week {w} · Days {w * 7 - 6}–{w * 7}
                  </h3>
                </div>
                <ul className="space-y-2">
                  {byWeek[wi].map((item) => (
                    <motion.li
                      key={item.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: wi * 0.05 }}
                      className="flex items-start gap-3 group"
                    >
                      <button
                        onClick={() => onToggleItem(item.id, !item.isCompleted)}
                        className="mt-0.5 flex-shrink-0 text-muted hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded transition-colors"
                        aria-label={`Mark "${item.title}" as ${item.isCompleted ? 'incomplete' : 'complete'}`}
                      >
                        {item.isCompleted ? (
                          <CheckCircle2 size={18} className="text-success" />
                        ) : (
                          <Circle size={18} />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <span
                          className={`text-sm ${item.isCompleted ? 'line-through text-muted' : 'text-app'}`}
                        >
                          {item.title}
                        </span>
                        {item.resourceUrl && (
                          <a
                            href={item.resourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-2 inline-flex items-center gap-0.5 text-xs text-primary hover:underline"
                          >
                            Resource <ExternalLink size={10} />
                          </a>
                        )}
                      </div>
                    </motion.li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
