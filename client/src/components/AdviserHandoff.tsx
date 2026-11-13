import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Printer, X } from 'lucide-react';
import { calculateScoreBreakdown, type Opportunity } from '@restart-ai/shared';
import { restoreSession } from '../lib/api';
import './adviserHandoff.css';

const categories = {
  'career-pivot': 'Career pivot',
  upskilling: 'Upskilling',
  'micro-business': 'Micro-business',
};

export function AdviserHandoff({ opportunity, demo }: { opportunity: Opportunity; demo: boolean }) {
  const trigger = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const [report, setReport] = useState<Opportunity | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function preview() {
    setLoading(true);
    setError('');
    try {
      const saved = demo
        ? opportunity
        : await restoreSession().then((session) =>
            session?.selectedOpportunityId === opportunity.id
              ? session.opportunities.find((item) => item.id === opportunity.id)
              : undefined
          );
      if (!saved) {
        setError('Could not confirm the saved opportunity. Check your connection and try again.');
        return;
      }
      setReport(saved);
      dialog.current?.showModal();
    } catch {
      setError('Could not load saved progress. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        ref={trigger}
        type="button"
        onClick={preview}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
      >
        <Printer size={16} aria-hidden="true" />
        {loading ? 'Loading saved plan…' : 'Print / Save as PDF'}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}
      {createPortal(
        <dialog
          ref={dialog}
          aria-label="Adviser handoff preview"
          className="handoff-dialog"
          onClose={() => {
            setReport(null);
            trigger.current?.focus();
          }}
        >
          <div className="handoff-toolbar">
            <button
              type="button"
              onClick={() => dialog.current?.close()}
              aria-label="Close preview"
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-slate-100"
            >
              <X size={16} aria-hidden="true" /> Close
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-semibold text-white"
            >
              <Printer size={16} aria-hidden="true" /> Print / Save as PDF
            </button>
          </div>
          {report && <TransitionReport opportunity={report} demo={demo} />}
        </dialog>,
        document.body
      )}
    </div>
  );
}

function TransitionReport({ opportunity, demo }: { opportunity: Opportunity; demo: boolean }) {
  const { explanation, planItems } = opportunity;
  const breakdown = explanation && calculateScoreBreakdown(explanation.signals);
  const completed = planItems.filter((item) => item.isCompleted).length;
  const remaining = planItems.length - completed;
  const progress = planItems.length ? Math.round((100 * completed) / planItems.length) : 0;
  const cost = explanation?.estimatedCostUSD;
  const questions = explanation?.questionsToVerify.length
    ? explanation.questionsToVerify
    : [
        'Which first step fits my situation?',
        'What local requirements, costs, or support should I check?',
      ];

  return (
    <article className="handoff-report">
      <header>
        <p className="handoff-kicker">ReStart AI Cloud · Adviser handoff</p>
        <h1>{opportunity.title}</h1>
        <p>{categories[opportunity.category]} · 30-day transition plan</p>
        <p className="handoff-note">
          {demo || explanation?.source === 'fictional-demo'
            ? 'Fictional demo · Illustrative estimates and temporary demo progress.'
            : 'AI-generated recommendation · Estimates and assumptions need independent verification.'}
        </p>
      </header>

      <section>
        <h2>Why this fits</h2>
        <p>{opportunity.reasoning}</p>
        <p className="handoff-stat">
          <strong>{opportunity.feasibilityScore}/100 fit score</strong> · {completed} of{' '}
          {planItems.length} tasks completed ({progress}%) · {remaining} remaining
        </p>
      </section>

      <section>
        <h2>Fit-score breakdown</h2>
        {breakdown ? (
          <>
            <table>
              <thead>
                <tr>
                  <th scope="col">Factor</th>
                  <th scope="col">Rating</th>
                  <th scope="col">Weight</th>
                  <th scope="col">Points</th>
                </tr>
              </thead>
              <tbody>
                {breakdown.factors.map((factor) => (
                  <tr key={factor.key}>
                    <th scope="row">{factor.label}</th>
                    <td>{factor.value}/100</td>
                    <td>{factor.weight}%</td>
                    <td>{factor.points.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p>
              Rounded total: {breakdown.total}/100. Review the underlying estimates with your
              adviser.
            </p>
            {breakdown.total !== opportunity.feasibilityScore && (
              <p>The saved fit score differs from this breakdown.</p>
            )}
          </>
        ) : (
          <p>Detailed score factors are unavailable for this saved result.</p>
        )}
      </section>

      <section>
        <h2>Costs, risks, and assumptions</h2>
        <p>
          <strong>Estimated startup cost:</strong>{' '}
          {cost == null
            ? 'Not provided'
            : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cost)}
        </p>
        {explanation && (
          <p>
            <strong>Estimated launch:</strong> {explanation.signals.launchTimeDays} days ·{' '}
            <strong>Complexity:</strong> {explanation.signals.complexityScore}/10
          </p>
        )}
        <p>
          <strong>Risks:</strong> {explanation?.risks || 'Not provided'}
        </p>
        <h3>Assumptions to check</h3>
        {explanation?.assumptions.length ? (
          <ul>
            {explanation.assumptions.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        ) : (
          <p>No assumptions supplied.</p>
        )}
      </section>

      <section>
        <h2>30-day plan and milestones</h2>
        {planItems.length === 0 && <p>No plan tasks are available.</p>}
        {[1, 2, 3, 4].map((week) => {
          const tasks = planItems
            .filter((item) => item.week === week)
            .sort((a, b) => a.day - b.day);
          if (!tasks.length) return null;
          const pending = tasks.filter((item) => !item.isCompleted).length;
          return (
            <div key={week} className="handoff-week">
              <h3>
                Week {week} · {pending ? `${pending} remaining` : 'Milestone complete'}
              </h3>
              <ul>
                {tasks.map((item) => (
                  <li key={item.id}>
                    <strong>
                      {item.isCompleted ? 'Complete' : 'To do'} · Day {item.day}
                    </strong>{' '}
                    — {item.title}
                    {item.description && <p>{item.description}</p>}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </section>

      <section>
        <h2>Questions to discuss with an adviser</h2>
        <ol>
          {questions.map((question, index) => (
            <li key={index}>{question}</li>
          ))}
        </ol>
      </section>
    </article>
  );
}
