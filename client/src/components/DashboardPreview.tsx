import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, TrendingUp, Users, BarChart3 } from 'lucide-react';
import type { Opportunity } from '@restart-ai/shared';
import { FeasibilityRing } from './FeasibilityRing';
import { CategoryBadge } from './CategoryBadge';

interface DashboardPreviewProps {
  opportunities: Opportunity[];
  onViewPlan: (id: string) => void;
}

const STATS = [
  { label: 'Opportunities', value: '3', icon: TrendingUp, color: 'text-primary' },
  { label: 'Steps Complete', value: '9/36', icon: CheckCircle2, color: 'text-success' },
  { label: 'Avg. Score', value: '80', icon: BarChart3, color: 'text-warning' },
  { label: 'Days Active', value: '1', icon: Users, color: 'text-primary' },
];

export function DashboardPreview({ opportunities, onViewPlan }: DashboardPreviewProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'progress'>('overview');

  const totalItems = opportunities.reduce((s, o) => s + o.planItems.length, 0);
  const completedItems = opportunities.reduce(
    (s, o) => s + o.planItems.filter((p) => p.isCompleted).length,
    0
  );
  const overallPct = Math.round((completedItems / totalItems) * 100);

  return (
    <section aria-labelledby="dashboard-heading" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 id="dashboard-heading" className="text-2xl font-bold text-app">Your Progress</h2>
          <p className="text-sm text-muted">Track your 30-day action plans</p>
        </div>
        {/* Tab switcher */}
        <div className="flex rounded-lg border border-border-light dark:border-border-dark overflow-hidden" role="tablist">
          {(['overview', 'progress'] as const).map((tab) => (
            <button
              key={tab}
              role="tab"
              aria-selected={activeTab === tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-xs font-medium capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary ${
                activeTab === tab
                  ? 'bg-primary text-white'
                  : 'text-muted hover:text-app hover:bg-surface-elevated-light dark:hover:bg-surface-elevated-dark'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {STATS.map(({ label, value, icon: Icon, color }) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark p-4 flex items-center gap-3"
          >
            <div className={`p-2 rounded-lg bg-surface-elevated-light dark:bg-surface-elevated-dark ${color}`}>
              <Icon size={16} />
            </div>
            <div>
              <div className="text-lg font-bold text-app leading-none">{value}</div>
              <div className="text-xs text-muted mt-0.5">{label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'overview' ? (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
          >
            {opportunities.map((opp) => {
              const done = opp.planItems.filter((p) => p.isCompleted).length;
              const pct = Math.round((done / opp.planItems.length) * 100);
              return (
                <div
                  key={opp.id}
                  className="rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <CategoryBadge category={opp.category} />
                    <FeasibilityRing score={opp.feasibilityScore} size={40} strokeWidth={4} />
                  </div>
                  <p className="text-sm font-semibold text-app leading-snug">{opp.title}</p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted">
                      <span>{done}/{opp.planItems.length} steps</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-surface-elevated-light dark:bg-surface-elevated-dark overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => onViewPlan(opp.id)}
                    className="w-full text-xs text-primary hover:underline text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                  >
                    Continue plan →
                  </button>
                </div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div
            key="progress"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark p-6 space-y-4"
          >
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 flex items-center justify-center">
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="34" fill="none" stroke="currentColor" strokeWidth="6" className="text-surface-elevated-light dark:text-surface-elevated-dark" />
                  <motion.circle
                    cx="40" cy="40" r="34" fill="none" stroke="#6366F1" strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={`${(overallPct / 100) * 2 * Math.PI * 34} ${2 * Math.PI * 34}`}
                    initial={{ strokeDasharray: `0 ${2 * Math.PI * 34}` }}
                    animate={{ strokeDasharray: `${(overallPct / 100) * 2 * Math.PI * 34} ${2 * Math.PI * 34}` }}
                    transition={{ duration: 1, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
                  />
                </svg>
                <span className="text-lg font-bold text-primary z-10">{overallPct}%</span>
              </div>
              <div>
                <div className="text-lg font-semibold text-app">Overall Completion</div>
                <div className="text-sm text-muted">{completedItems} of {totalItems} steps done</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
