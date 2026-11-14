import { useState, useId, useRef } from 'react';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle, Sparkles, FileUp } from 'lucide-react';
import { AnalyzeRequestSchema, type AnalyzeRequest } from '@restart-ai/shared';

interface ProfileFormProps {
  /** Called with validated data when user submits */
  onSubmit: (data: AnalyzeRequest) => Promise<void>;
  /** Whether an API call is in-flight */
  loading: boolean;
  /** API or validation error message to display */
  error: string | null;
  /** Field-level errors from server 400 response */
  fieldErrors?: Partial<Record<keyof AnalyzeRequest, string[]>>;
  /** Preserve form values passed in (e.g. after an error) */
  initialValues?: Partial<AnalyzeRequest>;
}

const FIELD_LABEL: Record<string, string> = {
  currentRole: 'Current or most recent role *',
  skills: 'Key skills *',
  experience: 'Years / description of experience *',
  location: 'Location (city, state/country) *',
  education: 'Education and qualifications',
  urgency: 'How soon do you want to make a change?',
  startupBudget: 'Available startup budget (USD)',
  interests: 'Interests or passions',
  constraints: 'Constraints (time, mobility, etc.)',
  goals: 'What do you want to achieve? *',
};

const PLACEHOLDERS: Partial<Record<keyof AnalyzeRequest, string>> = {
  currentRole: 'e.g. Retail Manager, Delivery Driver, Hospitality Worker',
  skills: 'e.g. Customer service, team leadership, logistics',
  experience: 'e.g. 6 years managing a team of 15',
  location: 'e.g. Chicago, IL, USA',
  education: 'e.g. High school diploma, forklift certification',
  urgency: 'e.g. Within 30 days',
  interests: 'e.g. Cooking, technology, outdoors',
  constraints: 'e.g. Limited mobility, no startup capital, must work evenings',
  goals: 'e.g. Remote work, higher income, more meaningful work',
};

export function ProfileForm({
  onSubmit,
  loading,
  error,
  fieldErrors,
  initialValues,
}: ProfileFormProps) {
  const formId = useId();
  const upload = useRef<HTMLInputElement>(null);
  const [entryMode, setEntryMode] = useState<'resume' | 'manual' | null>(
    initialValues ? 'manual' : null
  );
  const [resumeReviewed, setResumeReviewed] = useState(false);
  const [resumeReady, setResumeReady] = useState(false);
  const reviewNotice = useRef<HTMLDivElement>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importNote, setImportNote] = useState('');
  const [importError, setImportError] = useState(false);

  function selectResume(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const extension = file.name.split('.').pop()?.toLowerCase();
    const valid =
      ['pdf', 'docx'].includes(extension ?? '') && file.size > 0 && file.size <= 5 * 1024 * 1024;
    setResumeFile(valid ? file : null);
    setResumeReady(false);
    setResumeReviewed(false);
    setImportError(!valid);
    setImportNote(valid ? '' : 'Choose a PDF or DOCX file up to 5 MB.');
  }

  async function analyzeResume() {
    if (!resumeFile || importing || loading) return;
    const file = resumeFile;
    const extension = file.name.split('.').pop()?.toLowerCase();
    setImporting(true);
    setResumeReady(false);
    setResumeReviewed(false);
    setImportNote('');
    setImportError(false);
    try {
      const response = await fetch('/api/resume?interpret=true', {
        method: 'POST',
        headers: {
          'Content-Type':
            extension === 'pdf'
              ? 'application/pdf'
              : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        },
        body: file,
      });
      if (!response.ok) {
        const messages: Partial<Record<number, string>> = {
          400: 'Choose a valid PDF or DOCX file.',
          413: 'Choose a file up to 5 MB.',
          429: 'Too many import attempts. Wait a few minutes or enter your profile manually.',
          422: 'Choose a readable DOCX or a PDF with selectable text. Scanned PDFs need a text version.',
        };
        setImportError(true);
        setImportNote(
          messages[response.status] ??
            'Résumé import failed. Enter your profile manually or try again later.'
        );
        return;
      }
      const { draft, interpreted } = (await response.json()) as {
        draft: Partial<
          Pick<
            AnalyzeRequest,
            'currentRole' | 'skills' | 'experience' | 'education' | 'location' | 'interests'
          >
        >;
        interpreted: boolean;
      };
      setResumeReady(true);
      setResumeReviewed(false);
      requestAnimationFrame(() => reviewNotice.current?.focus());
      setValues((current) => ({
        ...current,
        currentRole: draft.currentRole ?? current.currentRole,
        skills: draft.skills ?? current.skills,
        experience: draft.experience ?? current.experience,
        location: draft.location ?? current.location,
        interests: draft.interests ?? current.interests,
        education: draft.education ?? current.education,
      }));
      const missing = (
        ['currentRole', 'location', 'skills', 'experience', 'education', 'interests'] as const
      )
        .filter((field) => !draft[field])
        .map(
          (field) =>
            ({
              currentRole: 'role',
              location: 'location',
              skills: 'skills',
              experience: 'experience',
              education: 'education',
              interests: 'interests',
            })[field]
        );
      setImportNote(
        (interpreted ? 'Résumé analyzed.' : 'Document processed.') +
          (missing.length
            ? ` The draft could not identify ${missing.join(', ')}. Add or verify those details below.`
            : '')
      );
    } catch {
      setImportError(true);
      setImportNote(
        'Could not complete résumé import. Enter your profile manually or try again later.'
      );
    } finally {
      setImporting(false);
    }
  }

  const [values, setValues] = useState<
    Omit<AnalyzeRequest, 'startupBudget'> & { startupBudget: string }
  >({
    currentRole: initialValues?.currentRole ?? '',
    skills: initialValues?.skills ?? '',
    experience: initialValues?.experience ?? '',
    education: initialValues?.education ?? '',
    urgency: initialValues?.urgency ?? '',
    location: initialValues?.location ?? '',
    startupBudget: String(initialValues?.startupBudget ?? 0),
    interests: initialValues?.interests ?? '',
    constraints: initialValues?.constraints ?? '',
    goals: initialValues?.goals ?? '',
  });

  const [clientErrors, setClientErrors] = useState<Partial<Record<keyof AnalyzeRequest, string>>>(
    {}
  );

  const set =
    (field: keyof typeof values) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setValues((v) => ({ ...v, [field]: e.target.value }));
      // Clear error on change
      if (clientErrors[field as keyof AnalyzeRequest]) {
        setClientErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (importing || (entryMode === 'resume' && !resumeReviewed)) return;

    const toValidate = {
      ...values,
      startupBudget: parseInt(values.startupBudget || '0', 10),
    };

    const result = AnalyzeRequestSchema.safeParse(toValidate);
    if (!result.success) {
      const errs: Partial<Record<keyof AnalyzeRequest, string>> = {};
      for (const [key, msgs] of Object.entries(result.error.flatten().fieldErrors)) {
        if (msgs?.[0]) errs[key as keyof AnalyzeRequest] = msgs[0];
      }
      setClientErrors(errs);
      return;
    }

    setClientErrors({});
    await onSubmit(result.data);
  };

  const inputBase =
    'w-full rounded-xl border px-3 py-2.5 text-sm text-app bg-surface-light dark:bg-surface-dark placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors';
  const inputNormal = 'border-border-light dark:border-border-dark';
  const inputError = 'border-danger focus-visible:ring-danger';

  const fieldError = (field: keyof AnalyzeRequest): string | undefined =>
    clientErrors[field] ?? fieldErrors?.[field]?.[0];

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      aria-labelledby={`${formId}-heading`}
      className="max-w-2xl mx-auto space-y-6"
    >
      <div>
        <h1 id={`${formId}-heading`} className="text-2xl font-bold text-app">
          Your Profile
        </h1>
        <p className="text-sm text-muted mt-1">
          Tell us about yourself. All fields marked <span aria-hidden>*</span>
          <span className="sr-only">required</span> are required.
        </p>
      </div>

      <section
        className="space-y-2 rounded-xl border border-primary/20 bg-primary/5 p-4"
        aria-label="Résumé import"
      >
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={importing || loading}
            aria-pressed={entryMode === 'resume'}
            onClick={() => {
              setEntryMode('resume');
              upload.current?.click();
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            <FileUp size={16} aria-hidden="true" />{' '}
            {entryMode === 'resume' && resumeFile ? 'Change résumé' : 'Upload Résumé'}
          </button>
          <button
            type="button"
            disabled={importing || loading}
            aria-pressed={entryMode === 'manual'}
            onClick={() => {
              setEntryMode('manual');
              setResumeFile(null);
              setResumeReady(false);
              setResumeReviewed(false);
              setImportNote('');
            }}
            className="rounded-lg border border-primary/30 px-3 py-2 text-sm font-semibold text-primary"
          >
            Enter Manually
          </button>
        </div>
        <input ref={upload} type="file" hidden accept=".pdf,.docx" onChange={selectResume} />
        {entryMode === 'resume' && (
          <>
            <p className="text-xs text-muted">
              PDF or DOCX up to 5 MB. When you analyze the file, configured services may process it
              and its text to suggest profile details.
            </p>
            {resumeFile && (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary/20 p-3">
                <span className="min-w-0 break-all text-sm text-app">{resumeFile.name}</span>
                <button
                  type="button"
                  onClick={() => void analyzeResume()}
                  disabled={importing || loading}
                  className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {importing ? 'Analyzing résumé…' : 'Analyze My Résumé'}
                </button>
              </div>
            )}
            {importNote && !resumeReady && (
              <p role={importError ? 'alert' : 'status'} className="text-sm text-app">
                {importNote}
              </p>
            )}
          </>
        )}
      </section>

      {entryMode === 'resume' && resumeReady && (
        <div
          ref={reviewNotice}
          tabIndex={-1}
          role="status"
          className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm text-app"
        >
          <p className="font-semibold">Confirm your résumé details</p>
          <p>
            {importNote} Check your location, role, skills, education, experience, and interests.
            Fill in any missing details.
          </p>
        </div>
      )}

      {/* API-level error banner */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          role="alert"
          className="flex items-start gap-3 p-4 rounded-xl border border-danger/30 bg-danger/5 text-danger text-sm"
        >
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </motion.div>
      )}

      {(entryMode === 'manual' || (entryMode === 'resume' && resumeReady)) && (
        <form onSubmit={handleSubmit} noValidate className="space-y-4" id={formId}>
          <h2 className="text-lg font-semibold text-app">Review and Complete Profile</h2>
          {/* Row: role + location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(['currentRole', 'location'] as const).map((field) => (
              <div key={field} className="space-y-1">
                <label htmlFor={`${formId}-${field}`} className="text-xs font-medium text-app">
                  {FIELD_LABEL[field]}
                </label>
                <input
                  id={`${formId}-${field}`}
                  type="text"
                  value={values[field]}
                  onChange={set(field)}
                  placeholder={PLACEHOLDERS[field]}
                  aria-invalid={!!fieldError(field)}
                  aria-describedby={fieldError(field) ? `${formId}-${field}-err` : undefined}
                  className={`${inputBase} ${fieldError(field) ? inputError : inputNormal}`}
                />
                {fieldError(field) && (
                  <p id={`${formId}-${field}-err`} role="alert" className="text-xs text-danger">
                    {fieldError(field)}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Skills */}
          <div className="space-y-1">
            <label htmlFor={`${formId}-skills`} className="text-xs font-medium text-app">
              {FIELD_LABEL.skills}
            </label>
            <input
              id={`${formId}-skills`}
              type="text"
              value={values.skills}
              onChange={set('skills')}
              placeholder={PLACEHOLDERS.skills}
              aria-invalid={!!fieldError('skills')}
              aria-describedby={fieldError('skills') ? `${formId}-skills-err` : undefined}
              className={`${inputBase} ${fieldError('skills') ? inputError : inputNormal}`}
            />
            {fieldError('skills') && (
              <p id={`${formId}-skills-err`} role="alert" className="text-xs text-danger">
                {fieldError('skills')}
              </p>
            )}
          </div>

          {/* Row: experience + budget */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor={`${formId}-experience`} className="text-xs font-medium text-app">
                {FIELD_LABEL.experience}
              </label>
              <input
                id={`${formId}-experience`}
                type="text"
                value={values.experience}
                onChange={set('experience')}
                placeholder={PLACEHOLDERS.experience}
                aria-invalid={!!fieldError('experience')}
                className={`${inputBase} ${fieldError('experience') ? inputError : inputNormal}`}
              />
              {fieldError('experience') && (
                <p role="alert" className="text-xs text-danger">
                  {fieldError('experience')}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <label htmlFor={`${formId}-budget`} className="text-xs font-medium text-app">
                {FIELD_LABEL.startupBudget}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">
                  $
                </span>
                <input
                  id={`${formId}-budget`}
                  type="number"
                  min={0}
                  max={1_000_000}
                  value={values.startupBudget}
                  onChange={set('startupBudget')}
                  placeholder="0"
                  className={`${inputBase} pl-7 ${fieldError('startupBudget') ? inputError : inputNormal}`}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {(['education', 'urgency'] as const).map((field) => (
              <div key={field} className="space-y-1">
                <label htmlFor={`${formId}-${field}`} className="text-xs font-medium text-app">
                  {FIELD_LABEL[field]}
                </label>
                <input
                  id={`${formId}-${field}`}
                  value={values[field]}
                  onChange={set(field)}
                  placeholder={PLACEHOLDERS[field]}
                  maxLength={field === 'education' ? 500 : 200}
                  className={`${inputBase} ${inputNormal}`}
                />
              </div>
            ))}
          </div>

          {/* Interests */}
          <div className="space-y-1">
            <label htmlFor={`${formId}-interests`} className="text-xs font-medium text-app">
              {FIELD_LABEL.interests}
            </label>
            <input
              id={`${formId}-interests`}
              type="text"
              value={values.interests}
              onChange={set('interests')}
              placeholder={PLACEHOLDERS.interests}
              className={`${inputBase} ${inputNormal}`}
            />
          </div>

          {/* Goals */}
          <div className="space-y-1">
            <label htmlFor={`${formId}-goals`} className="text-xs font-medium text-app">
              {FIELD_LABEL.goals}
            </label>
            <textarea
              id={`${formId}-goals`}
              rows={3}
              value={values.goals}
              onChange={set('goals')}
              placeholder={PLACEHOLDERS.goals}
              aria-invalid={!!fieldError('goals')}
              aria-describedby={fieldError('goals') ? `${formId}-goals-err` : undefined}
              className={`${inputBase} resize-none ${fieldError('goals') ? inputError : inputNormal}`}
            />
            {fieldError('goals') && (
              <p id={`${formId}-goals-err`} role="alert" className="text-xs text-danger">
                {fieldError('goals')}
              </p>
            )}
          </div>

          {/* Constraints */}
          <div className="space-y-1">
            <label htmlFor={`${formId}-constraints`} className="text-xs font-medium text-app">
              {FIELD_LABEL.constraints}
            </label>
            <textarea
              id={`${formId}-constraints`}
              rows={2}
              value={values.constraints}
              onChange={set('constraints')}
              placeholder={PLACEHOLDERS.constraints}
              className={`${inputBase} resize-none ${inputNormal}`}
            />
          </div>

          {entryMode === 'resume' && (
            <label className="flex items-start gap-2 rounded-lg border border-primary/30 p-3 text-sm text-app">
              <input
                type="checkbox"
                checked={resumeReviewed}
                onChange={(event) => setResumeReviewed(event.target.checked)}
              />
              <span>I’ve reviewed and confirmed my profile details.</span>
            </label>
          )}

          <button
            type="submit"
            disabled={loading || importing || (entryMode === 'resume' && !resumeReviewed)}
            className="
            w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl
            font-semibold text-sm bg-primary text-white
            hover:bg-primary-hover disabled:opacity-60 disabled:cursor-not-allowed
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
            transition-all duration-200
          "
            aria-busy={loading}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Analysing with AI…
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Generate My Opportunities
              </>
            )}
          </button>
        </form>
      )}
    </motion.section>
  );
}
