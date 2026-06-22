"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { EventState } from "@/lib/types";
import type { QuizSessionState } from "@/lib/musicpro/quiz-state";
import {
  isPhaseExpired,
  resolveSyncedQuizClock,
  type QuizDisplayPhase,
  type SyncedQuizClock,
} from "@/lib/musicpro/quiz-display";

interface UseQuizPhaseSyncOptions {
  eventSlug: string;
  quizState: QuizSessionState | null;
  enabled?: boolean;
  /** Chi può chiamare tick al termine fase (proiettore = true). */
  driveTicks?: boolean;
  onPhaseChange?: (phase: QuizDisplayPhase) => void;
  onTick?: (
    quiz: QuizSessionState | null,
    runtimeState?: EventState,
  ) => void;
}

const IDLE_CLOCK: SyncedQuizClock = {
  displayPhase: "question",
  phaseStartedAt: "",
  remaining: 0,
  awaitingServerTick: false,
};

function clocksEqual(a: SyncedQuizClock, b: SyncedQuizClock): boolean {
  return (
    a.displayPhase === b.displayPhase &&
    a.phaseStartedAt === b.phaseStartedAt &&
    a.remaining === b.remaining &&
    a.awaitingServerTick === b.awaitingServerTick
  );
}

function quizSyncKey(quiz: QuizSessionState): string {
  return `${quiz.updatedAt}:${quiz.currentIndex}:${quiz.displayPhase}:${quiz.phaseStartedAt}:${quiz.timing.questionSeconds}`;
}

export function useQuizPhaseSync({
  eventSlug,
  quizState,
  enabled = true,
  driveTicks = false,
  onPhaseChange,
  onTick,
}: UseQuizPhaseSyncOptions) {
  const [synced, setSynced] = useState<SyncedQuizClock>(() =>
    quizState ? resolveSyncedQuizClock(quizState) : IDLE_CLOCK,
  );
  const tickingRef = useRef(false);
  const lastPhaseRef = useRef<string | null>(null);
  const onPhaseChangeRef = useRef(onPhaseChange);
  const onTickRef = useRef(onTick);
  const quizStateRef = useRef(quizState);

  quizStateRef.current = quizState;

  useEffect(() => {
    onPhaseChangeRef.current = onPhaseChange;
  }, [onPhaseChange]);

  useEffect(() => {
    onTickRef.current = onTick;
  }, [onTick]);

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
        onTickRef.current?.(data.quiz ?? null, data.runtimeState);
      }
    } finally {
      window.setTimeout(() => {
        tickingRef.current = false;
      }, 500);
    }
  }, [eventSlug]);

  const quizKey = quizState ? quizSyncKey(quizState) : null;

  useEffect(() => {
    if (!enabled || !quizKey) {
      setSynced((prev) => (clocksEqual(prev, IDLE_CLOCK) ? prev : IDLE_CLOCK));
      lastPhaseRef.current = null;
      return;
    }

    const update = () => {
      const current = quizStateRef.current;
      if (!current) return;

      const clock = resolveSyncedQuizClock(current);
      setSynced((prev) => (clocksEqual(prev, clock) ? prev : clock));

      const phaseKey = `${current.currentIndex}:${clock.displayPhase}:${clock.phaseStartedAt}`;
      if (lastPhaseRef.current !== phaseKey) {
        lastPhaseRef.current = phaseKey;
        onPhaseChangeRef.current?.(clock.displayPhase);
      }

      const serverExpired = isPhaseExpired(
        current.displayPhase,
        current.phaseStartedAt,
        current.timing,
      );

      if (
        driveTicks &&
        (clock.awaitingServerTick || serverExpired)
      ) {
        void tickServer();
      }
    };

    update();
    const interval = window.setInterval(update, 200);
    return () => window.clearInterval(interval);
  }, [driveTicks, enabled, quizKey, tickServer]);

  return {
    remaining: synced.remaining,
    displayPhase: synced.displayPhase,
    awaitingServerTick: synced.awaitingServerTick,
    tickServer,
  };
}
