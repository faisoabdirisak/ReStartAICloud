import { useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Columns2, Target, X } from 'lucide-react';
import type { Opportunity } from '@restart-ai/shared';
import { CategoryBadge } from './CategoryBadge';

const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});

export function OpportunityComparison({
  opportunities,
  budget,
  focusedId,
  onFocus,
  error,
}: {
  opportunities: Opportunity[];
  budget?: number;
  focusedId: string | null;
  onFocus: (id: string) => Promise<void>;
  error: string | null;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const headingId = useId();
  const [left, setLeft] = useState(opportunities[0].id);
  const [right, setRight] = useState(opportunities[1].id);
  const [budgetText, setBudgetText] = useState(budget?.toString() ?? '');
  const [saving, setSaving] = useState(false);
  const comparisonBudget =
    budgetText.trim() && Number.isFinite(Number(budgetText)) && Number(budgetText) >= 0
      ? Number(budgetText)
      : undefined;

  function optionSelect(label: string, value: string, other: string, update: (id: string) => void) {
    return (
      <label className="grid gap-1 text-sm font-medium">
        {label}
        <select
          value={value}
          onChange={(event) => update(event.target.value)}
          className="min-w-0 rounded-lg border border-border-light bg-surface-light p-2 dark:border-border-dark dark:bg-surface-dark"
        >
          {opportunities.map((item) => (
            <option key={item.id} value={item.id} disabled={item.id === other}>
              {item.title}
            </option>
          ))}
        </select>
      </label>
    );
  }

  async function focus(id: string) {
    setSaving(true);
    try {
      await onFocus(id);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-white hover:bg-primary-hover"
      >
        <Columns2 size={16} aria-hidden="true" /> Compare My Options
      </button>
      {createPortal(
        <dialog
          ref={dialog}
          aria-labelledby={headingId}
          className="max-h-[90dvh] w-[calc(100%-2rem)] max-w-4xl overflow-y-auto rounded-2xl bg-surface-light p-5 text-app backdrop:bg-black/60 dark:bg-surface-dark sm:p-7"
        >
          <header className="mb-5 flex items-start justify-between gap-3">
            <div>
              <h2 id={headingId} className="text-xl font-bold">
                Compare My Options
              </h2>
              <p className="mt-1 text-sm text-muted">
                Compare two recommendations and focus the plan that fits your situation.
              </p>
            </div>
            <button
              type="button"
              aria-label="Close comparison"
              onClick={() => dialog.current?.close()}
              className="rounded-lg p-2 hover:bg-primary/10"
            >
              <X size={20} aria-hidden="true" />
            </button>
          </header>
          <div className="grid gap-3 sm:grid-cols-2">
            {optionSelect('First opportunity', left, right, setLeft)}
            {optionSelect('Second opportunity', right, left, setRight)}
          </div>
          <label className="my-4 grid max-w-xs gap-1 text-sm font-medium">
            Budget for this comparison (USD)
            <input
              type="number"
              min="0"
              step="0.01"
              value={budgetText}
              placeholder="Enter a budget"
              onChange={(event) => setBudgetText(event.target.value)}
              className="rounded-lg border border-border-light bg-transparent p-2 dark:border-border-dark"
            />
          </label>
          <p className="mb-4 text-xs text-muted">
            Costs and launch times are estimates. Check actual expenses and requirements before
            choosing.
          </p>
          {error && (
            <p role="alert" className="mb-3 text-sm text-danger">
              {error}
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            {[left, right].map((id) => {
              const item = opportunities.find((entry) => entry.id === id);
              if (!item) return null;
              const cost = item.explanation?.estimatedCostUSD;
              const next = [...item.planItems]
                .sort((a, b) => a.day - b.day)
                .find((task) => !task.isCompleted);
              const question = item.explanation?.questionsToVerify[0];
              const focused = focusedId === id;
              return (
                <article
                  key={id}
                  className="flex min-w-0 flex-col gap-3 break-words rounded-xl border border-border-light p-4 dark:border-border-dark"
                >
                  <div>
                    <CategoryBadge category={item.category} />
                    <h3 className="mt-2 font-semibold">{item.title}</h3>
                  </div>
                  <dl className="flex-1 space-y-3 text-sm">
                    <div>
                      <dt className="font-semibold">Fit score · {item.feasibilityScore}/100</dt>
                      <dd className="text-muted">{item.reasoning}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold">Estimated startup cost</dt>
                      <dd className="text-muted">
                        {cost == null ? 'Cost unknown' : usd.format(cost)}
                      </dd>
                      {cost != null && comparisonBudget !== undefined && (
                        <dd
                          className={
                            cost <= comparisonBudget
                              ? 'font-medium text-app'
                              : 'font-medium text-danger'
                          }
                        >
                          {cost <= comparisonBudget
                            ? 'Within budget'
                            : `${usd.format(cost - comparisonBudget)} over budget`}
                        </dd>
                      )}
                    </div>
                    <div>
                      <dt className="font-semibold">Estimated launch time</dt>
                      <dd className="text-muted">
                        {item.explanation
                          ? `${item.explanation.signals.launchTimeDays} days`
                          : 'Unknown'}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-semibold">First unfinished task</dt>
                      <dd className="text-muted">
                        {next
                          ? `Day ${next.day} · ${next.title}`
                          : item.planItems.length
                            ? 'Plan complete'
                            : 'No tasks available'}
                      </dd>
                    </div>
                    {item.explanation?.risks && (
                      <div>
                        <dt className="font-semibold">Risk to consider</dt>
                        <dd className="text-muted">{item.explanation.risks}</dd>
                      </div>
                    )}
                    {question && (
                      <div>
                        <dt className="font-semibold">Question for an adviser</dt>
                        <dd className="text-muted">{question}</dd>
                      </div>
                    )}
                  </dl>
                  <button
                    type="button"
                    disabled={saving || focused}
                    onClick={() => void focus(id)}
                    aria-label={focused ? `Focused on ${item.title}` : `Focus on ${item.title}`}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-primary/30 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10 disabled:opacity-60"
                  >
                    <Target size={16} aria-hidden="true" />{' '}
                    {focused ? 'Focused' : 'Focus on this plan'}
                  </button>
                </article>
              );
            })}
          </div>
        </dialog>,
        document.body
      )}
    </>
  );
}
