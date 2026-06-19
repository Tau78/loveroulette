"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { EventState } from "@/lib/types";
import type { QuizSessionState } from "@/lib/musicpro/quiz-state";
import {
  isPhaseExpired,
  remainingSeconds,
  type QuizDisplayPhase,
} from "@/lib/musicpro/quiz-display";

interface UseQuizPhaseSyncOptions {
  eventSlug: string;
  quizState: QuizSessionState | null;
  enabled?: boolean;
  /** Chi può chiamare tick al termine fase (display = true). */
  driveTicks?: boolean;
  onPhaseChange?: (phase: QuizDisplayPhase) => void;
  onTick?: (
    quiz: QuizSessionState | null,
    runtimeState?: EventState,
  ) => void;
}

export function useQuizPhaseSync({
  eventSlug,
  quizState,
  enabled = true,
  driveTicks = false,
  onPhaseChange,
  onTick,
}: UseQuizPhaseSyncOptions) {
  const [remaining, setRemaining] = useState(0);
  const tickingRef = useRef(false);
  const lastPhaseRef = useRef<string | null>(null);

  const tickServer = useCallback(async () => {
    if (tickingRef.current) return;
    tickingRef.current = true;
    try {
      const res = await fetch(
        `/api/events/${encodeURIComponent(eventSlug)}/quiz`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "tick" }),
        },
      );
      if (res.ok) {
        const data = (await res.json()) as {
          quiz: QuizSessionState | null;
          runtimeState?: EventState;
        };
        onTick?.(data.quiz ?? null, data.runtimeState);
      }
    } finally {
      window.setTimeout(() => {
        tickingRef.current = false;
      }, 500);
    }
  }, [eventSlug, onTick]);

  useEffect(() => {
    if (!enabled || !quizState) {
      setRemaining(0);
      return;
    }

    const phaseKey = `${quizState.phaseStartedAt}:${quizState.displayPhase}:${quizState.currentIndex}`;
    if (lastPhaseRef.current !== phaseKey) {
      lastPhaseRef.current = phaseKey;
      onPhaseChange?.(quizState.displayPhase);
    }

    const update = () => {
      const left = remainingSeconds(
        quizState.displayPhase,
        quizState.phaseStartedAt,
        quizState.timing,
      );
      setRemaining(left);

      if (
        driveTicks &&
        left <= 0 &&
        isPhaseExpired(
          quizState.displayPhase,
          quizState.phaseStartedAt,
          quizState.timing,
        )
      ) {
        void tickServer();
      }
    };

    update();
    const interval = window.setInterval(update, 200);
    return () => window.clearInterval(interval);
  }, [driveTicks, enabled, onPhaseChange, quizState, tickServer]);

  return { remaining, tickServer };
}
