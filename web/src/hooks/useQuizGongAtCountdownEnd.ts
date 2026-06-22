"use client";

import { useEffect, useRef } from "react";
import { playQuizGongSound, preloadQuizGongSound } from "@/lib/audio/gong";
import { resolveSyncedQuizClock } from "@/lib/musicpro/quiz-display";
import type { QuizSessionState } from "@/lib/musicpro/quiz-state";

interface UseQuizGongAtCountdownEndOptions {
  quizState: QuizSessionState | null;
  enabled?: boolean;
}

const SYNC_POLL_MS = 32;

/**
 * Gong sullo «0» del countdown: usa lo stesso orologio del proiettore
 * (`resolveSyncedQuizClock`) e suona nel frame in cui la fase passa
 * `answers` → `results`.
 */
export function useQuizGongAtCountdownEnd({
  quizState,
  enabled = true,
}: UseQuizGongAtCountdownEndOptions): void {
  const playedRef = useRef<string | null>(null);
  const quizStateRef = useRef(quizState);
  quizStateRef.current = quizState;

  useEffect(() => {
    if (enabled) preloadQuizGongSound();
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !quizState) return;

    const cueKey = `${quizState.currentIndex}:${quizState.phaseStartedAt}`;
    if (playedRef.current === cueKey) return;

    let previousPhase = resolveSyncedQuizClock(quizState).displayPhase;

    if (previousPhase === "answers") {
      void preloadQuizGongSound();
    }

    const interval = window.setInterval(() => {
      const current = quizStateRef.current;
      if (!current) return;

      const syncedPhase = resolveSyncedQuizClock(current).displayPhase;

      if (previousPhase === "answers" && syncedPhase === "results") {
        if (playedRef.current !== cueKey) {
          playedRef.current = cueKey;
          void playQuizGongSound({ dedupKey: cueKey });
        }
        window.clearInterval(interval);
        return;
      }

      previousPhase = syncedPhase;

      if (syncedPhase !== "answers") {
        window.clearInterval(interval);
      }
    }, SYNC_POLL_MS);

    return () => window.clearInterval(interval);
  }, [
    enabled,
    quizState?.currentIndex,
    quizState?.displayPhase,
    quizState?.phaseStartedAt,
    quizState?.timing.questionSeconds,
  ]);
}
