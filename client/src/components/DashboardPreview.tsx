import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, TrendingUp, Target, AlertTriangle, Flame } from 'lucide-react';
import type { Opportunity } from '@restart-ai/shared';
import { FeasibilityRing } from './FeasibilityRing';
import { AdviserHandoff } from './AdviserHandoff';
import { CategoryBadge } from './CategoryBadge';

interface DashboardPreviewProps {
  opportunities: Opportunity[];
  selectedOpportunityId: string | null;
  demo?: boolean;
  /** Consecutive-day streak computed from completedAt timestamps */
  streak: number;
  onViewPlan: (id: string) => void;
  onSelectOpp: (id: string | null) => void;
  onStartOver: () => void;
}

export function DashboardPreview({
  opportunities,
  selectedOpportunityId,
  demo = false,
  streak,
  onViewPlan,
  onSelectOpp,
  onStartOver,
}: DashboardPreviewProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'progress'>('overview');
  const [confirmClear, setConfirmClear] = useState(false);

  const focused = opportunities.find((opportunity) => opportunity.id === selectedOpportunityId);
  const totalItems = opportunities.reduce((s, o) => s + o.planItems.length, 0);
  const completedItems = opportunities.reduce(
    (s, o) => s + o.planItems.filter((p) => p.isCompleted).length,
    0
  );
  const overallPct = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  const STATS = [
    { label: 'Opportunities', value: String(opportunities.length), icon: TrendingUp, color: 'text-primary' },
    { label: 'Steps Complete', value: `${completedItems}/${totalItems}`, icon: CheckCircle2, color: 'text-success' },
    { label: 'Day Streak', value: streak > 0 ? `${streak}🔥` : '0', icon: Flame, color: streak > 0 ? 'text-warning' : 'text-muted' },
    { label: 'Overall', value: `${overallPct}%`, icon: Target, color: 'text-primary' },
  ];

  return (
    <section aria-labelledby="dashboard-heading" className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 id="dashboard-heading" className="text-2xl font-bold text-app">Your Progress</h2>
          <p className="text-sm text-muted">Track your 30-day action plans</p>
        </div>
        <div className="flex items-center gap-2">
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
          {/* Start over */}
          {!confirmClear ? (
            <button
              onClick={() => setConfirmClear(true)}
              className="text-xs text-muted hover:text-danger transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger rounded px-2 py-1.5"
              aria-label="Start over — clear session"
            >
              Start over
            </button>
          ) : (
            <div className="flex items-center gap-1.5 text-xs">
              <AlertTriangle size={12} className="text-danger" />
              <span className="text-danger font-medium">Clear session?</span>
              <button
                onClick={() => { setConfirmClear(false); onStartOver(); }}
                className="px-2 py-0.5 rounded bg-danger text-white hover:bg-danger/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger"
              >
                Yes
              </button>
              <button
                onClick={() => setConfirmClear(false)}
                className="px-2 py-0.5 rounded border border-border-light dark:border-border-dark text-muted hover:text-app transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {focused && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/25 bg-primary/5 p-4">
          <div>
            <p className="text-sm font-semibold text-app">Adviser handoff</p>
            <p className="text-sm text-muted">{focused.title}</p>
          </div>
          <AdviserHandoff key={focused.id} opportunity={focused} demo={demo} />
        </div>
      )}

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
              const pct = opp.planItems.length > 0
                ? Math.round((done / opp.planItems.length) * 100)
                : 0;
              const isSelected = selectedOpportunityId === opp.id;
              return (
                <div
                  key={opp.id}
                  className={`rounded-xl border bg-surface-light dark:bg-surface-dark p-4 space-y-3 transition-colors ${
                    isSelected
                      ? 'border-primary/50 ring-1 ring-primary/30'
                      : 'border-border-light dark:border-border-dark'
                  }`}
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
                  <div className="flex gap-2">
                    <button
                      onClick={() => onViewPlan(opp.id)}
                      className="flex-1 text-xs text-primary hover:underline text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                    >
                      View plan →
                    </button>
                    <button
                      onClick={() => onSelectOpp(isSelected ? null : opp.id)}
                      className={`text-xs px-2 py-0.5 rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                        isSelected
                          ? 'bg-primary text-white border-primary'
                          : 'border-border-light dark:border-border-dark text-muted hover:border-primary/40 hover:text-primary'
                      }`}
                      aria-pressed={isSelected}
                    >
                      {isSelected ? 'Focused' : 'Focus'}
                    </button>
                  </div>
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
