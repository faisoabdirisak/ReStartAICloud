import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ThemeProvider } from './context/ThemeContext';
import { AppShell } from './components/AppShell';
import { Hero } from './components/Hero';
import { OpportunityGrid } from './components/OpportunityCard';
import { PlanView } from './components/PlanView';
import { SkeletonCards } from './components/SkeletonCards';
import { DashboardPreview } from './components/DashboardPreview';
import { OnboardingModal } from './components/OnboardingModal';
import { MOCK_OPPORTUNITIES, MOCK_PERSONAS } from './data/mockData';
import type { Opportunity } from '@restart-ai/shared';

type NavPage = 'home' | 'opportunities' | 'dashboard';

const ONBOARDING_KEY = 'restart-ai-onboarding-done';

function AppContent() {
  const [page, setPage] = useState<NavPage>('home');
  const [opportunities, setOpportunities] = useState<Opportunity[]>(MOCK_OPPORTUNITIES);
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [demoActive, setDemoActive] = useState(true);
  const [activePersonaId, setActivePersonaId] = useState<string | null>('maria');

  // Show onboarding on first visit
  useEffect(() => {
    const done = localStorage.getItem(ONBOARDING_KEY);
    if (!done) setShowOnboarding(true);
  }, []);

  const handleCloseOnboarding = () => {
    localStorage.setItem(ONBOARDING_KEY, '1');
    setShowOnboarding(false);
  };

  // Simulate async AI load when switching to opportunities page
  const handleGetStarted = () => {
    setPage('opportunities');
    if (opportunities.length === 0) {
      setLoading(true);
      setTimeout(() => {
        setOpportunities(MOCK_OPPORTUNITIES);
        setLoading(false);
      }, 1800);
    }
  };

  const handleSelectPersona = (id: string) => {
    setActivePersonaId(id);
    const persona = MOCK_PERSONAS.find((p) => p.id === id);
    if (!persona) return;
    // Reset to mock data with a brief loading state
    setPage('opportunities');
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
    // Update locally — in future milestones this will call PATCH /api/sessions/:id/progress
    setOpportunities((prev) =>
      prev.map((opp) => ({
        ...opp,
        planItems: opp.planItems.map((item) =>
          item.id === itemId ? { ...item, isCompleted: completed } : item
        ),
      }))
    );
  };

  return (
    <>
      <AppShell
        currentPage={page}
        onNavigate={setPage}
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
              <div>
                <h1 className="text-2xl font-bold text-app">Your Opportunities</h1>
                <p className="text-sm text-muted mt-1">
                  {activePersonaId
                    ? `Showing results for ${MOCK_PERSONAS.find((p) => p.id === activePersonaId)?.name ?? 'Demo'} · `
                    : ''}
                  Feasibility scores computed by server-side analysis
                </p>
              </div>
              {loading ? (
                <SkeletonCards />
              ) : (
                <OpportunityGrid
                  opportunities={opportunities}
                  onViewPlan={(id) => setActivePlanId(id)}
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
              <DashboardPreview
                opportunities={opportunities}
                onViewPlan={(id) => { setActivePlanId(id); }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </AppShell>

      {/* Plan modal */}
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

      {/* Onboarding */}
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
