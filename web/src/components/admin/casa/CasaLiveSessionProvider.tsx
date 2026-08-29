"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  CasaLiveSessionContext,
  type CasaLiveSessionValue,
  type CasaQuizActionResult,
} from "@/components/admin/casa/casa-live-session-context";
import { useAnimatorPin } from "@/hooks/useAnimatorPin";
import { useLoveRouletteSession } from "@/hooks/useLoveRouletteSession";
import {
  isInvalidAnimatorPinError,
  postQuizAction,
} from "@/lib/admin/animator-api";
import type { EventStats } from "@/lib/musicpro/session";
import type { LoveRouletteEvent } from "@/lib/musicpro/types";
import type { QuizSessionState } from "@/lib/musicpro/quiz-state";
import type { EventState, ExtractionMode } from "@/lib/types";

interface SessionPayload {
  runtimeState: LoveRouletteEvent["runtimeState"];
  sessionId: string | null;
  stats: EventStats;
}

const EMPTY_STATS: EventStats = {
  onlineCount: 0,
  participantCount: 0,
  pairProgress: null,
};

export function CasaLiveSessionProvider({
  eventCode,
  children,
}: {
  eventCode: string;
  children: ReactNode;
}) {
  const [event, setEvent] = useState<LoveRouletteEvent | null>(null);
  const [stats, setStats] = useState<EventStats>(EMPTY_STATS);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [soundtrackUnlocked, setSoundtrackUnlocked] = useState<boolean | null>(
    null,
  );
  const [extractionMode, setExtractionMode] =
    useState<ExtractionMode>("random");

  const {
    pin,
    pinReady,
    showPinModal,
    pinError,
    pinVerifying,
    submitPin,
    rejectPin,
    openPinModal,
  } = useAnimatorPin({
    eventCode,
    pinRequired: event?.animatorPinRequired ?? false,
  });

  const {
    runtimeState,
    quizState,
    voting,
    finalsShow,
    lastReveal,
    syncStatus,
    applyQuizUpdate,
    applyFinalsUpdate,
  } = useLoveRouletteSession({
    eventSlug: eventCode,
    eventId: event?.id,
    initialEvent: event,
    initialRuntimeState: event?.runtimeState ?? "lobby",
    enabled: Boolean(event),
  });

  const loadSessionStats = useCallback(async () => {
    const response = await fetch(
      `/api/events/${encodeURIComponent(eventCode)}/session`,
    );
    if (!response.ok) return null;
    return (await response.json()) as SessionPayload;
  }, [eventCode]);

  const refreshSessionStats = useCallback(async () => {
    const sessionPayload = await loadSessionStats();
    if (sessionPayload) {
      setStats(sessionPayload.stats);
      return sessionPayload.stats;
    }
    return null;
  }, [loadSessionStats]);

  useEffect(() => {
    let cancelled = false;

    async function loadEvent() {
      setLoading(true);
      setLoadError(null);

      try {
        const response = await fetch(
          `/api/events/${encodeURIComponent(eventCode)}`,
        );

        if (!response.ok) {
          throw new Error("Serata non trovata.");
        }

        const payload = (await response.json()) as LoveRouletteEvent;
        if (cancelled) return;

        setEvent(payload);
        setExtractionMode(payload.config.extraction_mode);

        const sessionPayload = await loadSessionStats();
        if (!cancelled && sessionPayload) {
          setStats(sessionPayload.stats);
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(
            err instanceof Error ? err.message : "Errore di caricamento.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadEvent();

    return () => {
      cancelled = true;
    };
  }, [eventCode, loadSessionStats]);

  useEffect(() => {
    if (!event) return;

    let cancelled = false;

    const refreshStats = async () => {
      const sessionPayload = await loadSessionStats();
      if (!cancelled && sessionPayload) {
        setStats(sessionPayload.stats);
      }
    };

    void refreshStats();
    const statsPollMs =
      runtimeState === "extraction" || runtimeState === "elimination"
        ? 3000
        : 10000;
    const interval = window.setInterval(refreshStats, statsPollMs);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [event, loadSessionStats, runtimeState]);

  const runQuizAction = useCallback(
    async (
      action: Parameters<CasaLiveSessionValue["runQuizAction"]>[0],
      body?: Parameters<CasaLiveSessionValue["runQuizAction"]>[1],
    ): Promise<CasaQuizActionResult> => {
      try {
        const response = await postQuizAction(
          eventCode,
          { action, ...body },
          pin,
        );

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as {
            error?: string;
          } | null;
          const message = payload?.error ?? "Azione quiz non riuscita.";
          const invalidPin =
            response.status === 401 || isInvalidAnimatorPinError(message);
          if (invalidPin) {
            rejectPin("PIN non valido.");
          }
          return { ok: false, error: message, invalidPin };
        }

        const data = (await response.json()) as {
          quiz: QuizSessionState | null;
          runtimeState?: EventState;
        };
        applyQuizUpdate(data.quiz ?? null, data.runtimeState);
        return {
          ok: true,
          quiz: data.quiz ?? null,
          runtimeState: data.runtimeState,
        };
      } catch (err) {
        return {
          ok: false,
          error: err instanceof Error ? err.message : "Errore di rete.",
        };
      }
    },
    [applyQuizUpdate, eventCode, pin, rejectPin],
  );

  const controlsDisabled = !pinReady || loading || pinVerifying;

  const value = useMemo<CasaLiveSessionValue>(
    () => ({
      eventCode,
      event,
      loading,
      loadError,
      pin,
      pinReady,
      showPinModal,
      pinError,
      pinVerifying,
      submitPin,
      rejectPin,
      openPinModal,
      runtimeState,
      quizState,
      voting,
      finalsShow,
      lastReveal,
      syncStatus,
      applyQuizUpdate,
      applyFinalsUpdate,
      stats,
      setStats,
      refreshSessionStats,
      soundtrackUnlocked,
      setSoundtrackUnlocked,
      extractionMode,
      setExtractionMode,
      controlsDisabled,
      runQuizAction,
    }),
    [
      applyFinalsUpdate,
      applyQuizUpdate,
      controlsDisabled,
      event,
      eventCode,
      extractionMode,
      finalsShow,
      lastReveal,
      loadError,
      loading,
      openPinModal,
      pin,
      pinError,
      pinReady,
      pinVerifying,
      quizState,
      refreshSessionStats,
      rejectPin,
      runQuizAction,
      runtimeState,
      showPinModal,
      soundtrackUnlocked,
      stats,
      submitPin,
      syncStatus,
      voting,
    ],
  );

  return (
    <CasaLiveSessionContext.Provider value={value}>
      {children}
    </CasaLiveSessionContext.Provider>
  );
}
