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
import { MOCK_OPPORTUNITIES, MOCK_PERSONAS } from './data/mockData';
import { analyzeProfile, ApiError } from './lib/api';
import type { Opportunity, AnalyzeRequest } from '@restart-ai/shared';

type NavPage = 'home' | 'opportunities' | 'dashboard';

const ONBOARDING_KEY = 'restart-ai-onboarding-done';

function AppContent() {
  const [page, setPage] = useState<NavPage>('home');
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof AnalyzeRequest, string[]>> | undefined
  >(undefined);
  // Preserve form data across failed submissions
  const [lastFormValues, setLastFormValues] = useState<Partial<AnalyzeRequest> | undefined>(
    undefined
  );
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [demoActive, setDemoActive] = useState(false);
  const [activePersonaId, setActivePersonaId] = useState<string | null>(null);

  useEffect(() => {
    const done = localStorage.getItem(ONBOARDING_KEY);
    if (!done) setShowOnboarding(true);
  }, []);

  const handleCloseOnboarding = () => {
    localStorage.setItem(ONBOARDING_KEY, '1');
    setShowOnboarding(false);
  };

  /** Navigate to the form page */
  const handleGetStarted = () => {
    setPage('opportunities');
    setOpportunities([]);
    setApiError(null);
    setFieldErrors(undefined);
    setLastFormValues(undefined);
    setDemoActive(false);
    setActivePersonaId(null);
  };

  /** Submit profile to real API */
  const handleFormSubmit = async (data: AnalyzeRequest) => {
    setLoading(true);
    setApiError(null);
    setFieldErrors(undefined);
    setLastFormValues(data);

    try {
      const session = await analyzeProfile(data);
      setOpportunities(session.opportunities);
      setApiError(null);
      setLastFormValues(undefined);
    } catch (err) {
      if (err instanceof ApiError) {
        setApiError(err.message);
        setFieldErrors(err.details as Partial<Record<keyof AnalyzeRequest, string[]>> | undefined);
      } else {
        setApiError('An unexpected error occurred. Please try again.');
      }
      // Keep opportunities empty — never silently show demo data on real failure
    } finally {
      setLoading(false);
    }
  };

  /** Demo persona — loads mock data without a real API call */
  const handleSelectPersona = (id: string) => {
    const persona = MOCK_PERSONAS.find((p) => p.id === id);
    if (!persona) return;
    setActivePersonaId(id);
    setDemoActive(true);
    setPage('opportunities');
    setApiError(null);
    setFieldErrors(undefined);
    setLastFormValues(undefined);
    setLoading(true);
    setTimeout(() => {
      setOpportunities(MOCK_OPPORTUNITIES);
      setLoading(false);
    }, 1200);
  };

  const activePlan = activePlanId
    ? opportunities.find((o) => o.id === activePlanId) ?? null
    : null;

  const handleTogglePlanItem = (itemId: string, completed: boolean) => {
    setOpportunities((prev) =>
      prev.map((opp) => ({
        ...opp,
        planItems: opp.planItems.map((item) =>
          item.id === itemId ? { ...item, isCompleted: completed } : item
        ),
      }))
    );
  };

  /** Whether to show the form (no results and not loading) */
  const showForm = page === 'opportunities' && opportunities.length === 0 && !loading && !demoActive;

  return (
    <>
      <AppShell
        currentPage={page}
        onNavigate={(p) => {
          setPage(p);
          if (p === 'opportunities' && !demoActive) {
            setOpportunities([]);
            setApiError(null);
            setFieldErrors(undefined);
          }
        }}
        demoActive={demoActive}
        activePersonaId={activePersonaId}
        onSelectPersona={handleSelectPersona}
        onDismissDemo={() => setDemoActive(false)}
      >
        <AnimatePresence mode="wait">
          {page === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Hero onGetStarted={handleGetStarted} onTryDemo={() => handleSelectPersona('maria')} />
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
              {showForm ? (
                <ProfileForm
                  onSubmit={handleFormSubmit}
                  loading={loading}
                  error={apiError}
                  fieldErrors={fieldErrors}
                  initialValues={lastFormValues}
                />
              ) : loading ? (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-2xl font-bold text-app">Finding Your Opportunities…</h1>
                    <p className="text-sm text-muted mt-1">
                      Gemini is analysing your profile. This takes 10–20 seconds.
                    </p>
                  </div>
                  <SkeletonCards />
                </div>
              ) : opportunities.length > 0 ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <h1 className="text-2xl font-bold text-app">Your Opportunities</h1>
                      <p className="text-sm text-muted mt-1">
                        {demoActive && activePersonaId
                          ? `Demo results for ${MOCK_PERSONAS.find((p) => p.id === activePersonaId)?.name} · `
                          : ''}
                        Feasibility scores computed by server-side TypeScript analysis
                      </p>
                    </div>
                    <button
                      onClick={handleGetStarted}
                      className="text-xs text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                    >
                      ← Start over
                    </button>
                  </div>
                  <OpportunityGrid
                    opportunities={opportunities}
                    onViewPlan={(id) => setActivePlanId(id)}
                  />
                </div>
              ) : (
                /* Error with no previous results — show form again with error preserved */
                <ProfileForm
                  onSubmit={handleFormSubmit}
                  loading={loading}
                  error={apiError}
                  fieldErrors={fieldErrors}
                  initialValues={lastFormValues}
                />
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
              {opportunities.length > 0 ? (
                <DashboardPreview
                  opportunities={opportunities}
                  onViewPlan={(id) => setActivePlanId(id)}
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
            onClose={() => setActivePlanId(null)}
            onToggleItem={handleTogglePlanItem}
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
