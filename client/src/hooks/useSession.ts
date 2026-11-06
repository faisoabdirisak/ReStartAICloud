/**
 * useSession — single source of truth for the live session state.
 *
 * On mount: attempts to restore from the server via the HttpOnly cookie.
 * Provides typed actions for all session mutations.
 *
 * Demo sessions are held in separate, non-persisted state: switching to demo
 * does NOT replace the live session, and returning from demo restores it.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import type { Opportunity, AnalyzeRequest } from '@restart-ai/shared';
import {
  analyzeProfile,
  restoreSession,
  updateProgress,
  selectOpportunity,
  clearSession,
  ApiError,
} from '../lib/api';
import { MOCK_OPPORTUNITIES, MOCK_PERSONAS } from '../data/mockData';

export type SessionStatus =
  | 'restoring'   // checking cookie on mount
  | 'empty'       // no saved session
  | 'loading'     // AI call in-flight
  | 'ready'       // session loaded
  | 'demo'        // showing fictional demo data
  | 'error';      // last action failed

export interface UseSessionReturn {
  status: SessionStatus;
  sessionId: string | null;
  opportunities: Opportunity[];
  selectedOpportunityId: string | null;
  activePersonaId: string | null;
  apiError: string | null;
  fieldErrors: Partial<Record<keyof AnalyzeRequest, string[]>> | undefined;
  lastFormValues: Partial<AnalyzeRequest> | undefined;
  submitProfile: (data: AnalyzeRequest) => Promise<void>;
  togglePlanItem: (itemId: string, completed: boolean) => Promise<void>;
  selectOpp: (id: string | null) => Promise<void>;
  startDemo: (personaId: string) => void;
  stopDemo: () => void;
  startOver: () => Promise<void>;
}

export function useSession(): UseSessionReturn {
  const [status, setStatus] = useState<SessionStatus>('restoring');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [selectedOpportunityId, setSelectedOpportunityId] = useState<string | null>(null);
  const [activePersonaId, setActivePersonaId] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof AnalyzeRequest, string[]>> | undefined>(undefined);
  const [lastFormValues, setLastFormValues] = useState<Partial<AnalyzeRequest> | undefined>(undefined);

  // Saved live session (to restore after demo)
  const liveSessionRef = useRef<{
    sessionId: string;
    opportunities: Opportunity[];
    selectedOpportunityId: string | null;
  } | null>(null);

  // ── Restore on mount ──────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    restoreSession()
      .then((session) => {
        if (cancelled) return;
        if (session) {
          setSessionId(session.id);
          setOpportunities(session.opportunities);
          setSelectedOpportunityId(session.selectedOpportunityId ?? null);
          setStatus('ready');
        } else {
          setStatus('empty');
        }
      })
      .catch(() => {
        if (!cancelled) setStatus('empty'); // network error on restore → start fresh
      });
    return () => { cancelled = true; };
  }, []);

  // ── Submit profile to Gemini ──────────────────────────────────────────────
  const submitProfile = useCallback(async (data: AnalyzeRequest) => {
    setStatus('loading');
    setApiError(null);
    setFieldErrors(undefined);
    setLastFormValues(data);

    try {
      const session = await analyzeProfile(data);
      setSessionId(session.id);
      setOpportunities(session.opportunities);
      setSelectedOpportunityId(null);
      setLastFormValues(undefined);
      setStatus('ready');
    } catch (err) {
      if (err instanceof ApiError) {
        setApiError(err.message);
        setFieldErrors(err.details as Partial<Record<keyof AnalyzeRequest, string[]>> | undefined);
      } else {
        setApiError('An unexpected error occurred. Please try again.');
      }
      setStatus('error');
    }
  }, []);

  // ── Toggle plan item ──────────────────────────────────────────────────────
  const togglePlanItem = useCallback(async (itemId: string, completed: boolean) => {
    // Optimistic update
    setOpportunities((prev) =>
      prev.map((opp) => ({
        ...opp,
        planItems: opp.planItems.map((item) =>
          item.id === itemId ? { ...item, isCompleted: completed } : item
        ),
      }))
    );

    try {
      await updateProgress({ planItemId: itemId, isCompleted: completed });
    } catch {
      // Revert on failure
      setOpportunities((prev) =>
        prev.map((opp) => ({
          ...opp,
          planItems: opp.planItems.map((item) =>
            item.id === itemId ? { ...item, isCompleted: !completed } : item
          ),
        }))
      );
    }
  }, []);

  // ── Select opportunity ────────────────────────────────────────────────────
  const selectOpp = useCallback(async (id: string | null) => {
    setSelectedOpportunityId(id);
    try {
      await selectOpportunity({ opportunityId: id });
    } catch {
      // non-critical — selection reverts on next restore
    }
  }, []);

  // ── Demo ──────────────────────────────────────────────────────────────────
  const startDemo = useCallback((personaId: string) => {
    if (!MOCK_PERSONAS.find((p) => p.id === personaId)) return;

    // Stash live session before overwriting state
    if (status === 'ready' && sessionId) {
      liveSessionRef.current = { sessionId, opportunities, selectedOpportunityId };
    }

    setActivePersonaId(personaId);
    setStatus('loading');
    setTimeout(() => {
      setOpportunities(MOCK_OPPORTUNITIES);
      setSelectedOpportunityId(null);
      setStatus('demo');
    }, 1000);
  }, [status, sessionId, opportunities, selectedOpportunityId]);

  const stopDemo = useCallback(() => {
    setActivePersonaId(null);
    const live = liveSessionRef.current;
    if (live) {
      setSessionId(live.sessionId);
      setOpportunities(live.opportunities);
      setSelectedOpportunityId(live.selectedOpportunityId);
      setStatus('ready');
    } else {
      setOpportunities([]);
      setSelectedOpportunityId(null);
      setStatus('empty');
    }
  }, []);

  // ── Start over (with confirmation in UI layer) ────────────────────────────
  const startOver = useCallback(async () => {
    try {
      await clearSession();
    } catch {
      // best-effort — even if server call fails, reset local state
    }
    liveSessionRef.current = null;
    setSessionId(null);
    setOpportunities([]);
    setSelectedOpportunityId(null);
    setApiError(null);
    setFieldErrors(undefined);
    setLastFormValues(undefined);
    setActivePersonaId(null);
    setStatus('empty');
  }, []);

  return {
    status,
    sessionId,
    opportunities,
    selectedOpportunityId,
    activePersonaId,
    apiError,
    fieldErrors,
    lastFormValues,
    submitProfile,
    togglePlanItem,
    selectOpp,
    startDemo,
    stopDemo,
    startOver,
  };
}
