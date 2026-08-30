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
 * Gong sullo «0» del countdown: stesso orologio del proiettore.
 * Suona quando la fase `answers` arriva a remaining 0 (lock tastiere),
 * non al click AVANTI verso i risultati.
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

    let previousRemaining = resolveSyncedQuizClock(quizState).remaining;
    const initial = resolveSyncedQuizClock(quizState);

    if (initial.displayPhase === "answers") {
      void preloadQuizGongSound();
    }

    const interval = window.setInterval(() => {
      const current = quizStateRef.current;
      if (!current) return;

      const clock = resolveSyncedQuizClock(current);

      if (
        clock.displayPhase === "answers" &&
        previousRemaining > 0 &&
        clock.remaining <= 0
      ) {
        if (playedRef.current !== cueKey) {
          playedRef.current = cueKey;
          void playQuizGongSound({ dedupKey: cueKey });
        }
        window.clearInterval(interval);
        return;
      }

      previousRemaining = clock.remaining;

      if (clock.displayPhase !== "answers") {
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
