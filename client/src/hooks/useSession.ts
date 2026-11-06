/**
 * useSession — single source of truth for the live session state.
 *
 * On mount: attempts to restore from the server via the HttpOnly cookie.
 * Provides typed actions for all session mutations.
 *
 * Demo sessions are held in separate, non-persisted state: switching to demo
 * does NOT replace the live session, and returning from demo restores it.
 */
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { Opportunity, AnalyzeRequest } from '@restart-ai/shared';
import { computeStreak, createDemoOpportunities, type DemoPersonaId } from '@restart-ai/shared';
import {
  analyzeProfile,
  restoreSession,
  updateProgress,
  selectOpportunity,
  clearSession,
  loadDemoSession,
  ApiError,
} from '../lib/api';
import { MOCK_PERSONAS } from '../data/mockData';

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
  /** Consecutive-day streak from completedAt timestamps across all plan items */
  streak: number;
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

  const demoRequestRef = useRef(0);
  const activeDemoRef = useRef<DemoPersonaId | null>(null);
  const demoCacheRef = useRef<Partial<Record<DemoPersonaId, {
    opportunities: Opportunity[]; selectedOpportunityId: string | null;
  }>>>({});

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
        if (activeDemoRef.current) {
          if (session) liveSessionRef.current = { sessionId: session.id, opportunities: session.opportunities, selectedOpportunityId: session.selectedOpportunityId ?? null };
          return;
        }
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
        if (!cancelled && !activeDemoRef.current) {
          setApiError('Could not restore your saved session. Please refresh to retry.');
          setStatus('error');
        }
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

  // Demo interactions stay in memory; only live items are written to the API.
  const togglePlanItem = useCallback(async (itemId: string, completed: boolean) => {
    const previous = opportunities.flatMap((opp) => opp.planItems).find((item) => item.id === itemId);
    if (!previous) return;
    const timestamp = completed ? new Date() : null;
    setOpportunities((prev) => prev.map((opp) => ({ ...opp, planItems: opp.planItems.map((item) =>
      item.id === itemId ? { ...item, isCompleted: completed, completedAt: timestamp } : item),
    })));
    if (activeDemoRef.current) return;
    setApiError(null);
    try {
      await updateProgress({ planItemId: itemId, isCompleted: completed });
    } catch {
      if (activeDemoRef.current) return;
      setOpportunities((prev) => prev.map((opp) => ({ ...opp, planItems: opp.planItems.map((item) =>
        item.id === itemId ? previous : item),
      })));
      setApiError('Could not save this task. Please try again.');
    }
  }, [opportunities]);

  const selectOpp = useCallback(async (id: string | null) => {
    const previous = selectedOpportunityId;
    setSelectedOpportunityId(id);
    if (activeDemoRef.current) return;
    try {
      await selectOpportunity({ opportunityId: id });
    } catch {
      if (activeDemoRef.current) return;
      setSelectedOpportunityId(previous);
      setApiError('Could not save your selection. Please try again.');
    }
  }, [selectedOpportunityId]);

  // ── Streak (memoised — recomputed only when opportunities change) ─────────
  const streak = useMemo(() => {
    const allItems = opportunities.flatMap((o) => o.planItems);
    return computeStreak(allItems);
  }, [opportunities]);

  // Keep persona edits separate and ignore stale requests after switching/exiting.
  const startDemo = useCallback((personaId: string) => {
    if (!MOCK_PERSONAS.some((persona) => persona.id === personaId)) return;
    const id = personaId as DemoPersonaId;
    if (activeDemoRef.current && status === 'demo') {
      demoCacheRef.current[activeDemoRef.current] = { opportunities, selectedOpportunityId };
    } else if (!activeDemoRef.current && status === 'ready' && sessionId) {
      liveSessionRef.current = { sessionId, opportunities, selectedOpportunityId };
    }
    activeDemoRef.current = id;
    const requestId = ++demoRequestRef.current;
    setApiError(null);
    setActivePersonaId(id);
    const cached = demoCacheRef.current[id];
    if (cached) {
      setOpportunities(cached.opportunities);
      setSelectedOpportunityId(cached.selectedOpportunityId);
      setStatus('demo');
      return;
    }
    setStatus('loading');
    const show = (items: Opportunity[], selection: string | null) => {
      if (demoRequestRef.current !== requestId || activeDemoRef.current !== id) return;
      setOpportunities(items);
      setSelectedOpportunityId(selection);
      setStatus('demo');
    };
    loadDemoSession(id)
      .then((session) => show(session?.opportunities ?? createDemoOpportunities(id), session?.selectedOpportunityId ?? null))
      .catch(() => show(createDemoOpportunities(id), null));
  }, [status, sessionId, opportunities, selectedOpportunityId]);

  const stopDemo = useCallback(() => {
    if (activeDemoRef.current && status === 'demo') {
      demoCacheRef.current[activeDemoRef.current] = { opportunities, selectedOpportunityId };
    }
    ++demoRequestRef.current;
    activeDemoRef.current = null;
    setActivePersonaId(null);
    setApiError(null);
    const live = liveSessionRef.current;
    setSessionId(live?.sessionId ?? null);
    setOpportunities(live?.opportunities ?? []);
    setSelectedOpportunityId(live?.selectedOpportunityId ?? null);
    setStatus(live ? 'ready' : 'empty');
  }, [status, opportunities, selectedOpportunityId]);

  // ── Start over (with confirmation in UI layer) ────────────────────────────
  const startOver = useCallback(async () => {
    if (activeDemoRef.current) {
      ++demoRequestRef.current;
      const id = activeDemoRef.current;
      delete demoCacheRef.current[id];
      setOpportunities(createDemoOpportunities(id));
      setSelectedOpportunityId(null);
      setStatus('demo');
      return;
    }
    try {
      await clearSession();
    } catch {
      setApiError('Could not clear your saved session. Please try again.');
      return; // Preserve the session until the server confirms deletion.
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
    streak,
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
