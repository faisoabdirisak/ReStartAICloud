import { useRef, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { SlidersHorizontal } from 'lucide-react';
import { RefinementConstraints, refineRemainingTasks, type Opportunity } from '@restart-ai/shared';
import { ApiError, refinePlan } from '../lib/api';

export function PlanRefinement({
  opportunity,
  demo,
  onApply,
}: {
  opportunity: Opportunity;
  demo: boolean;
  onApply: (opportunity: Opportunity) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [budget, setBudget] = useState('0');
  const [hours, setHours] = useState('5');
  const [proposal, setProposal] = useState<Awaited<ReturnType<typeof refinePlan>> | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function preview(event: FormEvent) {
    event.preventDefault();
    const input = RefinementConstraints.safeParse({ budget: Number(budget), hours: Number(hours) });
    if (!input.success || !budget.trim() || !hours.trim()) {
      setError('Enter a budget and between 0.5 and 168 hours per week.');
      return;
    }
    setBusy(true);
    setError('');
    setProposal(null);
    try {
      setProposal(
        demo
          ? {
              original: opportunity,
              refined: {
                ...opportunity,
                planItems: refineRemainingTasks(opportunity.planItems, input.data),
              },
              revision: '',
            }
          : await refinePlan(opportunity.id, input.data)
      );
    } catch {
      setError('Could not load a preview. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function apply() {
    if (!proposal) return;
    setBusy(true);
    setError('');
    try {
      const result = demo
        ? proposal
        : await refinePlan(
            opportunity.id,
            { budget: Number(budget), hours: Number(hours) },
            proposal.revision
          );
      onApply(result.refined);
      dialog.current?.close();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setProposal(null);
        setError('The saved plan changed. Generate a new preview.');
      } else {
        setError('Could not save the revised plan. Please try again.');
      }
    } finally {
      setBusy(false);
    }
  }

  const changes = proposal?.refined.planItems.filter(
    (item) =>
      proposal.original.planItems.find((previous) => previous.id === item.id)?.description !==
      item.description
  );

  return (
    <>
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-xl border border-primary/30 px-4 py-2 text-sm font-semibold text-primary"
        onClick={() => {
          setProposal(null);
          setError('');
          dialog.current?.showModal();
        }}
      >
        <SlidersHorizontal size={16} aria-hidden="true" /> Refine this plan
      </button>
      {createPortal(
        <dialog
          ref={dialog}
          aria-label="Refine this plan"
          onCancel={(event) => {
            if (busy) event.preventDefault();
          }}
          className="max-h-[90dvh] w-[calc(100%-2rem)] max-w-3xl overflow-y-auto rounded-2xl bg-surface-light p-5 text-app backdrop:bg-black/60 dark:bg-surface-dark sm:p-7"
        >
          <h2 className="text-xl font-bold">Refine this plan</h2>
          <p className="mt-1 text-sm text-muted">
            Set a total budget and weekly time. Review new guidance for your remaining tasks before
            applying it.
          </p>
          {demo && (
            <p className="mt-2 text-sm text-muted">Fictional demo · Changes stay in this tab.</p>
          )}
          <form onSubmit={preview} className="mt-4 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1 text-sm">
                Total budget (USD)
                <input
                  type="number"
                  min="0"
                  max="1000000"
                  step="1"
                  required
                  disabled={busy}
                  value={budget}
                  onChange={(event) => {
                    setBudget(event.target.value);
                    setProposal(null);
                  }}
                  className="rounded-lg border border-border-light bg-transparent p-2 dark:border-border-dark"
                />
              </label>
              <label className="grid gap-1 text-sm">
                Hours available each week
                <input
                  type="number"
                  min="0.5"
                  max="168"
                  step="0.5"
                  required
                  disabled={busy}
                  value={hours}
                  onChange={(event) => {
                    setHours(event.target.value);
                    setProposal(null);
                  }}
                  className="rounded-lg border border-border-light bg-transparent p-2 dark:border-border-dark"
                />
              </label>
            </div>
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              Preview changes
            </button>
          </form>
          {busy && (
            <p role="status" className="mt-3 text-sm">
              Working…
            </p>
          )}
          {error && (
            <p role="alert" className="mt-3 text-sm text-danger">
              {error}
            </p>
          )}
          {proposal && (
            <section className="mt-5 space-y-3">
              <h3 className="font-semibold">Proposed changes</h3>
              <p className="text-sm text-muted">
                {proposal.original.planItems.filter((item) => item.isCompleted).length} completed
                tasks carried forward.
              </p>
              {changes?.length ? (
                changes.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-xl border border-border-light p-3 text-sm dark:border-border-dark"
                  >
                    <h4 className="font-semibold">
                      Week {item.week} · {item.title}
                    </h4>
                    <p className="mt-2 text-xs font-semibold">Current guidance</p>
                    <p className="whitespace-pre-line text-muted">
                      {proposal.original.planItems.find((task) => task.id === item.id)
                        ?.description || 'No additional guidance.'}
                    </p>
                    <p className="mt-2 text-xs font-semibold text-primary">Revised guidance</p>
                    <p className="whitespace-pre-line text-muted">{item.description}</p>
                  </article>
                ))
              ) : (
                <p className="text-sm">
                  This plan has no remaining guidance changes for these settings.
                </p>
              )}
            </section>
          )}
          <div className="sticky bottom-0 mt-5 flex justify-end gap-2 bg-surface-light py-3 dark:bg-surface-dark">
            <button
              type="button"
              disabled={busy}
              onClick={() => dialog.current?.close()}
              className="rounded-lg border px-4 py-2 text-sm"
            >
              Cancel
            </button>
            {changes && changes.length > 0 && (
              <button
                type="button"
                disabled={busy}
                onClick={apply}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                Apply revised plan
              </button>
            )}
          </div>
        </dialog>,
        document.body
      )}
    </>
  );
}
