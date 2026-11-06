import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeft,
  ArrowUpRight,
  X,
  Sparkles,
  Target,
  Wallet,
  Clock3,
  Layers3,
  ShieldAlert,
  Lightbulb,
  CircleHelp,
  CheckCircle2,
  BarChart3,
  ChevronRight,
  Info,
} from 'lucide-react';
import { FeasibilityRing } from './FeasibilityRing';
import { CategoryBadge } from './CategoryBadge';
import type { Opportunity } from '@restart-ai/shared';
import { calculateScoreBreakdown } from '@restart-ai/shared';

export function OpportunityExplanation({ opportunity }: { opportunity: Opportunity }) {
  const [open, setOpen] = useState(false);
  const overviewRef = useRef<HTMLElement>(null);
  const scoreRef = useRef<HTMLElement>(null);
  const verifyRef = useRef<HTMLElement>(null);
  const [section, setSection] = useState('overview');
  const jump = (name: string) => {
    setSection(name);
    const target =
      name === 'scores'
        ? scoreRef.current
        : name === 'verify'
          ? verifyRef.current
          : overviewRef.current;
    target?.scrollIntoView?.({
      behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'start',
    });
  };
  const triggerRef = useRef<HTMLButtonElement>(null);
  const backRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const root = document.getElementById('root');
    const previousHidden = root?.getAttribute('aria-hidden');
    document.body.style.overflow = 'hidden';
    root?.setAttribute('aria-hidden', 'true');
    backRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      if (root) {
        if (previousHidden === null) root.removeAttribute('aria-hidden');
        else if (previousHidden !== undefined) root.setAttribute('aria-hidden', previousHidden);
      }
      triggerRef.current?.focus();
    };
  }, [open]);
  const explanation = opportunity.explanation;
  const breakdown = explanation ? calculateScoreBreakdown(explanation.signals) : null;
  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          setSection('overview');
          setOpen(true);
        }}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="w-full rounded-xl border border-border-light dark:border-border-dark p-3 text-left text-sm font-medium text-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <span className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-2">
            <Sparkles size={16} aria-hidden="true" /> Explain My Opportunity
          </span>
          <ArrowUpRight size={16} aria-hidden="true" />
        </span>
      </button>
      {open &&
        createPortal(
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={`Explanation for ${opportunity.title}`}
            className="fixed inset-0 z-[100] flex flex-col bg-background-light dark:bg-background-dark text-app"
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.stopPropagation();
                setOpen(false);
              }
              if (event.key === 'Tab') {
                const buttons = dialogRef.current?.querySelectorAll<HTMLButtonElement>('button');
                const first = buttons?.[0];
                const last = buttons?.[buttons.length - 1];
                if (event.shiftKey && document.activeElement === first) {
                  event.preventDefault();
                  last?.focus();
                } else if (!event.shiftKey && document.activeElement === last) {
                  event.preventDefault();
                  first?.focus();
                }
              }
            }}
          >
            <header className="flex shrink-0 items-center gap-4 border-b border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark px-4 py-3 sm:px-8">
              <button
                ref={backRef}
                type="button"
                onClick={() => setOpen(false)}
                className="flex shrink-0 items-center gap-2 rounded-lg p-2 text-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <ArrowLeft size={18} aria-hidden="true" /> Back
              </button>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted">Explain My Opportunity</p>
                <h2 className="text-lg font-semibold sm:text-xl">{opportunity.title}</h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close explanation"
                className="rounded-lg p-2 text-muted hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <X size={22} aria-hidden="true" />
              </button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              <div className="mx-auto w-full max-w-6xl px-4 py-5 text-sm leading-relaxed sm:px-8 sm:py-8">
                <section
                  ref={overviewRef}
                  className="scroll-mt-6 relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-surface-light to-indigo-50 p-6 dark:via-surface-dark dark:to-primary/5 sm:p-8"
                >
                  <div
                    className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl"
                    aria-hidden="true"
                  />
                  <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
                    <div className="max-w-2xl space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <CategoryBadge category={opportunity.category} />
                        <span className="inline-flex items-center gap-1 rounded-full bg-surface-light/80 px-2.5 py-1 text-xs text-primary dark:bg-surface-dark">
                          <Sparkles size={12} aria-hidden="true" /> Opportunity insights
                        </span>
                      </div>
                      <h3 className="text-2xl font-bold tracking-tight sm:text-3xl">
                        A clearer path forward.
                      </h3>
                      <p className="text-muted">
                        Understand the fit, weigh the trade-offs, and know what to check before
                        taking your next step.
                      </p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => jump('scores')}
                          disabled={!breakdown}
                          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 font-medium text-white shadow-sm hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                        >
                          <BarChart3 size={16} aria-hidden="true" /> Review score{' '}
                          <ChevronRight size={14} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => jump('verify')}
                          disabled={!breakdown}
                          className="inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-surface-light px-4 py-2.5 font-medium text-primary hover:bg-primary/5 dark:bg-surface-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                          <CircleHelp size={16} aria-hidden="true" /> What should I verify?
                        </button>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-4 self-start rounded-2xl border border-primary/10 bg-surface-light/80 p-5 dark:bg-surface-dark/80 sm:flex-col sm:self-auto">
                      <FeasibilityRing
                        score={opportunity.feasibilityScore}
                        size={104}
                        strokeWidth={8}
                      />
                      <div className="text-center">
                        <p className="font-semibold">Fit score / 100</p>
                        <p className="text-xs text-muted">Not a success probability</p>
                      </div>
                    </div>
                  </div>
                </section>
                <nav
                  aria-label="Explanation sections"
                  className="my-5 flex gap-2 overflow-x-auto py-1"
                >
                  {[
                    { id: 'overview', label: 'Overview', icon: Target },
                    { id: 'scores', label: 'Score breakdown', icon: BarChart3 },
                    { id: 'verify', label: 'Risks & next checks', icon: ShieldAlert },
                  ].map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => jump(id)}
                      disabled={id !== 'overview' && !breakdown}
                      aria-pressed={section === id}
                      className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${section === id ? 'bg-primary text-white' : 'border border-border-light bg-surface-light text-muted hover:text-primary dark:border-border-dark dark:bg-surface-dark'}`}
                    >
                      <Icon size={14} aria-hidden="true" />
                      {label}
                    </button>
                  ))}
                </nav>
                {!explanation || !breakdown ? (
                  <div className="rounded-2xl border border-border-light bg-surface-light p-6 dark:border-border-dark dark:bg-surface-dark">
                    <Info size={24} className="mb-3 text-primary" aria-hidden="true" />
                    <p className="text-muted">
                      Explanation unavailable for this saved result. Its original score and plan are
                      preserved. New analyses include saved explanation details.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="flex items-start gap-3 rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3 text-xs text-muted">
                      <Info size={17} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
                      <p>
                        {explanation.source === 'fictional-demo'
                          ? 'Fictional demo estimates for illustration only.'
                          : 'AI estimates, not independently verified.'}{' '}
                        A fit score is not a probability of success.
                      </p>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <article className="rounded-2xl border border-border-light bg-surface-light p-5 dark:border-border-dark dark:bg-surface-dark">
                        <span className="mb-4 inline-flex rounded-xl bg-emerald-500/10 p-2.5 text-emerald-600 dark:text-emerald-400">
                          <Wallet size={21} aria-hidden="true" />
                        </span>
                        <h4 className="text-xs font-medium uppercase tracking-wider text-muted">
                          Estimated startup cost
                        </h4>
                        <p className="mt-2 text-lg font-bold">
                          {explanation.estimatedCostUSD === null
                            ? 'Not provided'
                            : new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: 'USD',
                                maximumFractionDigits: 0,
                              }).format(explanation.estimatedCostUSD)}{' '}
                          · unverified estimate
                        </p>
                      </article>
                      <article className="rounded-2xl border border-border-light bg-surface-light p-5 dark:border-border-dark dark:bg-surface-dark">
                        <span className="mb-4 inline-flex rounded-xl bg-sky-500/10 p-2.5 text-sky-600 dark:text-sky-400">
                          <Clock3 size={21} aria-hidden="true" />
                        </span>
                        <h4 className="text-xs font-medium uppercase tracking-wider text-muted">
                          Estimated launch time
                        </h4>
                        <p className="mt-2 text-2xl font-bold">
                          {explanation.signals.launchTimeDays}{' '}
                          <span className="text-sm font-normal text-muted">days</span>
                        </p>
                        <p className="mt-1 text-xs text-muted">Planning estimate, not a deadline</p>
                      </article>
                      <article className="rounded-2xl border border-border-light bg-surface-light p-5 dark:border-border-dark dark:bg-surface-dark">
                        <span className="mb-4 inline-flex rounded-xl bg-violet-500/10 p-2.5 text-violet-600 dark:text-violet-400">
                          <Layers3 size={21} aria-hidden="true" />
                        </span>
                        <h4 className="text-xs font-medium uppercase tracking-wider text-muted">
                          Complexity
                        </h4>
                        <p className="mt-2 text-2xl font-bold">
                          {explanation.signals.complexityScore}
                          <span className="text-sm font-normal text-muted"> / 10</span>
                        </p>
                        <p className="mt-1 text-xs text-muted">Lower means simpler to start</p>
                      </article>
                    </div>
                    <article className="rounded-2xl border border-border-light bg-surface-light p-6 dark:border-border-dark dark:bg-surface-dark">
                      <div className="mb-3 flex items-center gap-3">
                        <span className="rounded-xl bg-primary/10 p-2 text-primary">
                          <Target size={20} aria-hidden="true" />
                        </span>
                        <h4 className="text-lg font-semibold">Why this fits</h4>
                      </div>
                      <p className="leading-7 text-muted">{opportunity.reasoning}</p>
                    </article>
                    <section
                      ref={scoreRef}
                      className="scroll-mt-6 rounded-2xl border border-border-light bg-surface-light p-5 dark:border-border-dark dark:bg-surface-dark sm:p-6"
                    >
                      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="rounded-xl bg-primary/10 p-2 text-primary">
                            <BarChart3 size={20} aria-hidden="true" />
                          </span>
                          <div>
                            <h4 className="text-lg font-semibold">Score factors</h4>
                            <p className="text-xs text-muted">
                              Four factors. One transparent calculation.
                            </p>
                          </div>
                        </div>
                        <span className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
                          Rounded total: {breakdown.total}/100
                        </span>
                      </div>
                      <dl className="grid gap-3 sm:grid-cols-2">
                        {breakdown.factors.map((factor, index) => {
                          const FactorIcon = [Target, Wallet, Clock3, Layers3][index];
                          return (
                            <div
                              key={factor.key}
                              className="rounded-xl border border-border-light bg-background-light p-4 dark:border-border-dark dark:bg-background-dark"
                            >
                              <div className="mb-3 flex items-center justify-between gap-2">
                                <dt className="flex items-center gap-2 font-medium">
                                  <FactorIcon
                                    size={16}
                                    className="text-primary"
                                    aria-hidden="true"
                                  />
                                  {factor.label} · {factor.weight}% weight
                                </dt>
                                <span className="text-xs font-semibold tabular-nums text-primary">
                                  {factor.value}/100
                                </span>
                              </div>
                              <div
                                role="progressbar"
                                aria-label={`${factor.label} factor rating`}
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-valuenow={factor.value}
                                className="mb-2 h-2 overflow-hidden rounded-full bg-primary/10"
                              >
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-primary to-violet-400"
                                  style={{ width: `${factor.value}%` }}
                                />
                              </div>
                              <dd className="text-xs text-muted">
                                {factor.value}/100 factor rating → {factor.points.toFixed(1)} of{' '}
                                {factor.weight} points
                              </dd>
                            </div>
                          );
                        })}
                      </dl>
                      {breakdown.total !== opportunity.feasibilityScore && (
                        <p className="mt-4 text-warning">
                          The saved score differs from this breakdown; verify before relying on it.
                        </p>
                      )}
                      <p className="mt-4 text-xs leading-5 text-muted">
                        Faster launch and lower complexity contribute more points.{' '}
                        {explanation.source === 'fictional-demo'
                          ? 'These factor inputs are synthetic demo values.'
                          : 'TypeScript applies fixed weights to AI-estimated inputs.'}
                      </p>
                    </section>
                    <section
                      ref={verifyRef}
                      className="scroll-mt-6 grid items-start gap-5 lg:grid-cols-2"
                    >
                      <article className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-6">
                        <div className="mb-3 flex items-center gap-3">
                          <span className="rounded-xl bg-amber-500/10 p-2 text-amber-600 dark:text-amber-400">
                            <ShieldAlert size={20} aria-hidden="true" />
                          </span>
                          <h4 className="text-lg font-semibold">Risks</h4>
                        </div>
                        <p className="leading-7 text-muted">
                          {explanation.risks ||
                            'Not provided. Discuss practical risks before acting.'}
                        </p>
                      </article>
                      <article className="rounded-2xl border border-border-light bg-surface-light p-6 dark:border-border-dark dark:bg-surface-dark">
                        <div className="mb-4 flex items-center gap-3">
                          <span className="rounded-xl bg-violet-500/10 p-2 text-violet-600 dark:text-violet-400">
                            <Lightbulb size={20} aria-hidden="true" />
                          </span>
                          <h4 className="text-lg font-semibold">Assumptions to check</h4>
                        </div>
                        {explanation.assumptions.length ? (
                          <ul className="space-y-3">
                            {explanation.assumptions.map((item, index) => (
                              <li key={index} className="flex items-start gap-2.5 text-muted">
                                <CheckCircle2
                                  size={17}
                                  className="mt-1 shrink-0 text-primary"
                                  aria-hidden="true"
                                />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-muted">No assumptions were supplied.</p>
                        )}
                      </article>
                      <article className="rounded-2xl border border-primary/20 bg-primary/5 p-6 lg:col-span-2">
                        <div className="mb-4 flex items-center gap-3">
                          <span className="rounded-xl bg-primary/10 p-2 text-primary">
                            <CircleHelp size={20} aria-hidden="true" />
                          </span>
                          <div>
                            <h4 className="text-lg font-semibold">Questions to verify</h4>
                            <p className="text-xs text-muted">
                              Bring these to your research or a conversation with an adviser.
                            </p>
                          </div>
                        </div>
                        {explanation.questionsToVerify.length ? (
                          <ol className="grid gap-3 sm:grid-cols-2">
                            {explanation.questionsToVerify.map((item, index) => (
                              <li
                                key={index}
                                className="flex items-start gap-3 rounded-xl border border-primary/10 bg-surface-light p-4 dark:bg-surface-dark"
                              >
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                  {index + 1}
                                </span>
                                <span className="text-muted">{item}</span>
                              </li>
                            ))}
                          </ol>
                        ) : (
                          <p className="text-muted">No verification questions were supplied.</p>
                        )}
                      </article>
                    </section>
                  </div>
                )}
                <footer className="mt-7 flex flex-col items-start justify-between gap-4 border-t border-border-light pt-5 dark:border-border-dark sm:flex-row sm:items-center">
                  <p className="flex items-center gap-2 text-xs text-muted">
                    <Info size={14} aria-hidden="true" /> You choose the next step. These insights
                    support your decision.
                  </p>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  >
                    <ArrowLeft size={16} aria-hidden="true" />
                    Back to previous view
                  </button>
                </footer>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
