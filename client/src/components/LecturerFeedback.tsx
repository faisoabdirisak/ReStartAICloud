import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowLeft, ClipboardList, PenLine, RefreshCw } from 'lucide-react';
import { EvaluationInputSchema, type Opportunity, type PublicEvaluation } from '@restart-ai/shared';
import { listEvaluations, submitEvaluation } from '../lib/api';

const field =
  'w-full rounded-lg border border-border-light bg-surface-light p-2.5 dark:border-border-dark dark:bg-surface-dark';

export function LecturerFeedback({
  opportunities,
  focusedId,
  demoPersona,
  startWriting = false,
}: {
  opportunities: Opportunity[];
  focusedId: string | null;
  demoPersona?: string;
  startWriting?: boolean;
}) {
  const [reviews, setReviews] = useState<PublicEvaluation[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(startWriting);
  const heading = useRef<HTMLHeadingElement>(null);
  const viewChanged = useRef(startWriting);

  useEffect(() => {
    if (viewChanged.current) heading.current?.focus();
  }, [showForm]);

  function openForm() {
    viewChanged.current = true;
    setMessage('');
    setError('');
    setShowForm(true);
  }

  function backToFeedback() {
    setError('');
    setShowForm(false);
  }

  useEffect(() => {
    let active = true;
    listEvaluations()
      .then((entries) => {
        if (active) {
          setReviews(entries);
          setLoadError(false);
        }
      })
      .catch(() => {
        if (active) setLoadError(true);
      });
    return () => {
      active = false;
    };
  }, [refresh]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = Object.fromEntries(new FormData(form));
    const input = EvaluationInputSchema.safeParse({
      ...fields,
      demoPersona,
      publish: fields.publish === 'on',
    });
    setMessage('');
    if (!input.success) {
      setError('Complete the required answers and confirm what you want to publish.');
      return;
    }
    setError('');
    setBusy(true);
    try {
      const entry = await submitEvaluation(input.data);
      setReviews((current) => [entry, ...current.filter((review) => review.id !== entry.id)]);
      setRefresh((value) => value + 1);
      backToFeedback();
      setMessage('Your feedback is published below.');
    } catch {
      setError(
        'Could not publish feedback. Check that your recommendation is still open and try again.'
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8 text-app">
      {showForm ? (
        <section className="space-y-5" aria-labelledby="feedback-form-heading">
          <button
            type="button"
            onClick={backToFeedback}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-medium text-primary hover:underline"
          >
            <ArrowLeft size={16} aria-hidden="true" /> Back to published feedback
          </button>
          <h1 id="feedback-form-heading" ref={heading} tabIndex={-1} className="text-2xl font-bold">
            Write feedback
          </h1>
          {opportunities.length > 0 ? (
            <form
              key={opportunities[0].id}
              onSubmit={submit}
              className="rounded-2xl border border-border-light bg-surface-light p-5 dark:border-border-dark dark:bg-surface-dark sm:p-6"
            >
              <fieldset disabled={busy} className="space-y-4">
                <legend className="mb-4 text-lg font-semibold">
                  {demoPersona
                    ? 'Review a fictional demo recommendation'
                    : 'Review a live recommendation'}
                </legend>
                <label className="grid gap-1 text-sm">
                  Recommendation
                  <select
                    name="opportunityId"
                    defaultValue={
                      opportunities.find((item) => item.id === focusedId)?.id ?? opportunities[0].id
                    }
                    className={field}
                  >
                    {opportunities.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.title}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-1 text-sm">
                    Name <input name="name" required maxLength={100} className={field} />
                  </label>
                  <label className="grid gap-1 text-sm">
                    Role{' '}
                    <select name="role" required defaultValue="" className={field}>
                      <option value="" disabled>
                        Select your role
                      </option>
                      {['Lecturer', 'Career adviser', 'Worker', 'Other'].map((role) => (
                        <option key={role}>{role}</option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-1 text-sm">
                    Institution or organisation (optional){' '}
                    <input name="affiliation" maxLength={150} className={field} />
                  </label>
                  <label className="grid gap-1 text-sm">
                    Reviewer code (optional, private){' '}
                    <input name="reviewerCode" maxLength={40} className={field} />
                  </label>
                </div>
                <label className="grid gap-1 text-sm">
                  How well did the recommendation fit the profile?
                  <select name="fit" required defaultValue="" className={field}>
                    <option value="" disabled>
                      Choose a rating
                    </option>
                    <option>Well</option>
                    <option>Partly</option>
                    <option>Poorly</option>
                  </select>
                </label>
                <label className="grid gap-1 text-sm">
                  Why did you choose that rating?{' '}
                  <textarea name="reason" required maxLength={1000} rows={2} className={field} />
                </label>
                <label className="grid gap-1 text-sm">
                  What would you do first after reviewing or refining the plan?{' '}
                  <textarea name="firstStep" required maxLength={1000} rows={2} className={field} />
                </label>
                <label className="grid gap-1 text-sm">
                  How useful was the adviser report?
                  <select name="usefulness" required defaultValue="" className={field}>
                    <option value="" disabled>
                      Choose a rating
                    </option>
                    <option>Useful</option>
                    <option>Somewhat useful</option>
                    <option>Not useful</option>
                  </select>
                </label>
                <label className="grid gap-1 text-sm">
                  What would you change in the report? (optional){' '}
                  <textarea name="reportChanges" maxLength={1000} rows={2} className={field} />
                </label>
                <label className="grid gap-1 text-sm">
                  Where did you get stuck? (optional){' '}
                  <textarea name="friction" maxLength={1000} rows={2} className={field} />
                </label>
                <label className="flex items-start gap-2 text-sm">
                  <input type="checkbox" name="publish" required className="mt-1" /> I agree to
                  publish my name, role, affiliation, recommendation title, and feedback on this
                  page. Please leave private information out of your answers.
                </label>
                <button
                  type="submit"
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {busy ? 'Publishing…' : 'Publish feedback'}
                </button>
              </fieldset>
            </form>
          ) : (
            <p className="rounded-xl bg-primary/10 p-4 text-sm">
              Run a live analysis or open a fictional demo in Opportunities to leave feedback on a
              recommendation.
            </p>
          )}
          {error && (
            <p role="alert" className="text-danger">
              {error}
            </p>
          )}
        </section>
      ) : (
        <>
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1
                ref={heading}
                tabIndex={-1}
                className="flex items-center gap-3 text-2xl font-bold"
              >
                <ClipboardList className="text-primary" aria-hidden="true" /> Lecturer Evaluation
              </h1>
              <p className="mt-2 text-sm text-muted">
                Read published feedback on live and fictional demo recommendations.
              </p>
            </div>
            <button
              type="button"
              onClick={openForm}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white"
            >
              <PenLine size={16} aria-hidden="true" /> Write feedback
            </button>
          </header>
          {message && (
            <p role="status" className="font-semibold">
              {message}
            </p>
          )}
          <section aria-labelledby="published-evaluations" className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 id="published-evaluations" className="text-xl font-semibold">
                Published feedback
              </h2>
              <button
                type="button"
                onClick={() => setRefresh((value) => value + 1)}
                className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"
              >
                <RefreshCw size={15} aria-hidden="true" /> Refresh
              </button>
            </div>
            {loadError ? (
              <p role="alert" className="text-danger">
                Feedback could not be loaded. Try Refresh.
              </p>
            ) : (
              reviews.length === 0 && (
                <p className="text-muted">Published responses will appear here.</p>
              )
            )}
            {reviews.map((review) => (
              <article
                key={review.id}
                className="space-y-3 break-words rounded-xl border border-border-light bg-surface-light p-5 dark:border-border-dark dark:bg-surface-dark"
              >
                <header>
                  <h3 className="font-semibold">{review.name}</h3>
                  <p className="text-sm text-muted">
                    {review.role}
                    {review.affiliation && ` · ${review.affiliation}`} · Self-reported
                  </p>
                  <p className="mt-1 text-sm">
                    {review.source === 'live'
                      ? 'Live analysis'
                      : `Fictional demo · ${review.source.charAt(0).toUpperCase() + review.source.slice(1)}`}{' '}
                    · {review.opportunityTitle} · {new Date(review.createdAt).toLocaleDateString()}
                  </p>
                </header>
                <dl className="space-y-2 text-sm">
                  <div>
                    <dt className="font-semibold">Recommendation fit · {review.fit}</dt>
                    <dd className="whitespace-pre-wrap">{review.reason}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold">First step</dt>
                    <dd className="whitespace-pre-wrap">{review.firstStep}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold">Adviser report · {review.usefulness}</dt>
                    {review.reportChanges && (
                      <dd className="whitespace-pre-wrap">{review.reportChanges}</dd>
                    )}
                  </div>
                  {review.friction && (
                    <div>
                      <dt className="font-semibold">Where they got stuck</dt>
                      <dd className="whitespace-pre-wrap">{review.friction}</dd>
                    </div>
                  )}
                </dl>
              </article>
            ))}
          </section>
        </>
      )}
    </div>
  );
}
