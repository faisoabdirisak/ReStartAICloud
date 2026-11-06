import { useState, useId } from 'react';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle, Sparkles } from 'lucide-react';
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

  const [values, setValues] = useState<
    Omit<AnalyzeRequest, 'startupBudget'> & { startupBudget: string }
  >({
    currentRole: initialValues?.currentRole ?? '',
    skills: initialValues?.skills ?? '',
    experience: initialValues?.experience ?? '',
    location: initialValues?.location ?? '',
    startupBudget: String(initialValues?.startupBudget ?? 0),
    interests: initialValues?.interests ?? '',
    constraints: initialValues?.constraints ?? '',
    goals: initialValues?.goals ?? '',
  });

  const [clientErrors, setClientErrors] = useState<Partial<Record<keyof AnalyzeRequest, string>>>(
    {}
  );

  const set = (field: keyof typeof values) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setValues((v) => ({ ...v, [field]: e.target.value }));
    // Clear error on change
    if (clientErrors[field as keyof AnalyzeRequest]) {
      setClientErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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

      <form onSubmit={handleSubmit} noValidate className="space-y-4" id={formId}>
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
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">$</span>
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

        <button
          type="submit"
          disabled={loading}
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
              Find My Opportunities
            </>
          )}
        </button>
      </form>
    </motion.section>
  );
}
