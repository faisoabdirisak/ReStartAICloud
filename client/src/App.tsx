import { AboutPage } from './components/AboutPage';
import { OpportunityComparison } from './components/OpportunityComparison';
import { LecturerFeedback } from './components/LecturerFeedback';
import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ThemeProvider } from './context/ThemeContext';
import { AppShell } from './components/AppShell';
import { Hero } from './components/Hero';
import { ProfileForm } from './components/ProfileForm';
import { OpportunityGrid } from './components/OpportunityCard';
import { PlanView } from './components/PlanView';
import { SkeletonCards } from './components/SkeletonCards';
import { DashboardPreview } from './components/DashboardPreview';
import { OnboardingModal } from './components/OnboardingModal';
import { MOCK_PERSONAS } from './data/mockData';
import { useSession } from './hooks/useSession';

type NavPage = 'home' | 'opportunities' | 'dashboard' | 'evaluation' | 'about';

const ONBOARDING_KEY = 'restart-ai-onboarding-done';

function AppContent() {
  const [page, setPage] = useState<NavPage>('home');
  const [startWritingFeedback, setStartWritingFeedback] = useState(false);
  const [comparisonBudget, setComparisonBudget] = useState<number>();
  const [planView, setPlanView] = useState<{ id: string; taskId?: string } | null>(null);

  function openPlan(id: string, taskId?: string) {
    setPlanView({ id, taskId });
  }
  const [showOnboarding, setShowOnboarding] = useState(false);

  const {
    status,
    opportunities,
    selectedOpportunityId,
    activePersonaId,
    streak,
    apiError,
    fieldErrors,
    lastFormValues,
    submitProfile,
    togglePlanItem,
    applyRefinement,
    selectOpp,
    startDemo,
    stopDemo,
    startOver,
  } = useSession();

  useEffect(() => {
    const done = localStorage.getItem(ONBOARDING_KEY);
    if (!done) setShowOnboarding(true);
  }, []);

  const handleCloseOnboarding = () => {
    localStorage.setItem(ONBOARDING_KEY, '1');
    setShowOnboarding(false);
  };

  const handleGetStarted = () => {
    setPage('opportunities');
  };

  const handleTryDemo = () => {
    startDemo('maria');
    setPage('opportunities');
  };

  const handleSelectPersona = (id: string) => {
    setPlanView(null);
    startDemo(id);
    setPage('opportunities');
  };

  const handleDismissDemo = () => {
    stopDemo();
  };

  const activePlan = opportunities.find((item) => item.id === planView?.id);

  const demoActive = status === 'demo' || (status === 'loading' && activePersonaId !== null);

  // What to show on the opportunities page
  const showLoading =
    page === 'opportunities' &&
    status === 'loading';

  const showRestoring =
    page === 'opportunities' &&
    status === 'restoring';

  const showEvaluationOptions = status === 'ready' || status === 'demo';

  const showResults =
    page === 'opportunities' &&
    (status === 'ready' || status === 'demo') &&
    opportunities.length > 0;

  return (
    <>
      <AppShell
        currentPage={page}
        onNavigate={(destination) => { setStartWritingFeedback(false); setPage(destination); }}
        demoActive={demoActive}
        activePersonaId={activePersonaId}
        onSelectPersona={handleSelectPersona}
        onDismissDemo={handleDismissDemo}
      >
        <AnimatePresence mode="wait">
          {page === 'about' && <AboutPage key="about" onTryDemo={handleTryDemo} />}
          {page === 'evaluation' && <LecturerFeedback key="evaluation" opportunities={showEvaluationOptions ? opportunities : []} focusedId={selectedOpportunityId} demoPersona={demoActive ? activePersonaId ?? undefined : undefined} startWriting={startWritingFeedback} />}
          {page === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Hero onGetStarted={handleGetStarted} onTryDemo={handleTryDemo} />
            </motion.div>
          )}

          {page === 'opportunities' && (
            <motion.div
              key="opportunities"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              {showRestoring ? (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-2xl font-bold text-app">Restoring your session…</h1>
                    <p className="text-sm text-muted mt-1">Checking for saved results.</p>
                  </div>
                  <SkeletonCards />
                </div>
              ) : showLoading ? (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-2xl font-bold text-app">
                      {activePersonaId ? 'Loading demo…' : 'Finding Your Opportunities…'}
                    </h1>
                    <p className="text-sm text-muted mt-1">
                      {activePersonaId
                        ? 'Preparing fictional demo data.'
                        : 'AI is analysing your profile and building your 30-day plans. This can take up to a minute.'}
                    </p>
                  </div>
                  <SkeletonCards />
                </div>
              ) : showResults ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <h1 className="text-2xl font-bold text-app">Your Opportunities</h1>
                      <p className="text-sm text-muted mt-1">
                        {demoActive && activePersonaId
                          ? `Demo results for ${MOCK_PERSONAS.find((p) => p.id === activePersonaId)?.name} · `
                          : ''}
                        {demoActive ? 'Fictional fit scores · Demo progress stays in this tab' : 'Fit scores out of 100 · Plan progress is tracked separately'}
                      </p>
                    </div>
                    <button type="button" onClick={() => { setStartWritingFeedback(true); setPage('evaluation'); }}
                      className="rounded-lg border border-primary/25 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/10">
                      Give feedback
                    </button>
                    {!demoActive && (
                      <button
                        onClick={() => startOver()}
                        className="text-xs text-muted hover:text-danger transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger rounded"
                      >
                        ← Start over
                      </button>
                    )}
                  </div>
                  {opportunities.length >= 2 && (
                    <OpportunityComparison
                      key={opportunities.map((item) => item.id).join(':')}
                      opportunities={opportunities}
                      budget={demoActive ? undefined : comparisonBudget}
                      focusedId={selectedOpportunityId}
                      onFocus={selectOpp}
                      error={apiError}
                    />
                  )}
                  <OpportunityGrid
                    opportunities={opportunities}
                    onViewPlan={openPlan}
                  />
                </div>
              ) : (status === 'empty' || status === 'error') && !demoActive ? (
                <ProfileForm
                  onSubmit={async (profile) => {
                    setComparisonBudget(profile.startupBudget);
                    await submitProfile(profile);
                  }}
                  loading={false}
                  error={apiError}
                  fieldErrors={fieldErrors}
                  initialValues={lastFormValues}
                />
              ) : (
                /* restoring or transitioning — show nothing */
                <div />
              )}
            </motion.div>
          )}

          {page === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {status === 'restoring' ? (
                <div className="space-y-4">
                  <div className="h-8 w-48 rounded-lg bg-surface-elevated-light dark:bg-surface-elevated-dark animate-pulse" />
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[0,1,2,3].map(i => (
                      <div key={i} className="h-20 rounded-xl bg-surface-elevated-light dark:bg-surface-elevated-dark animate-pulse" />
                    ))}
                  </div>
                </div>
              ) : opportunities.length > 0 ? (
                <DashboardPreview
                  opportunities={opportunities}
                  selectedOpportunityId={selectedOpportunityId}
                  demo={demoActive}
                  streak={streak}
                  onViewPlan={openPlan}
                  onSelectOpp={selectOpp}
                  onStartOver={startOver}
                />
              ) : (
                <div className="text-center py-20 space-y-3">
                  <p className="text-muted">No active session yet.</p>
                  <button
                    onClick={handleGetStarted}
                    className="text-sm text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                  >
                    Get started →
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </AppShell>

      <AnimatePresence>
        {activePlan && (
          <PlanView
            key={activePlan.id}
            opportunity={activePlan}
            initialTaskId={planView?.taskId}
            onClose={() => setPlanView(null)}
            onToggleItem={togglePlanItem}
            demo={demoActive}
            onRefine={applyRefinement}
          />
        )}
      </AnimatePresence>

      {showOnboarding && <OnboardingModal onClose={handleCloseOnboarding} />}
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
