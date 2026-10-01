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

function answersCueKey(quiz: QuizSessionState): string {
  return `${quiz.currentIndex}:${quiz.phaseStartedAt}`;
}

/**
 * Gong sullo «0» del countdown (stesso orologio del proiettore), oppure
 * quando il server chiude le risposte perché tutti hanno risposto (`gongCueKey`).
 * Non suona al click AVANTI (nessun cue).
 */
export function useQuizGongAtCountdownEnd({
  quizState,
  enabled = true,
}: UseQuizGongAtCountdownEndOptions): void {
  const playedRef = useRef<string | null>(null);
  /** Chiave della finestra `answers` in cui eravamo armati (remaining > 0). */
  const armedKeyRef = useRef<string | null>(null);
  const quizStateRef = useRef(quizState);
  quizStateRef.current = quizState;

  useEffect(() => {
    if (enabled) preloadQuizGongSound();
  }, [enabled]);

  // Early-close: cue server dopo aver lasciato answers con remaining > 0.
  useEffect(() => {
    if (!enabled || !quizState) return;

    const cue = quizState.gongCueKey;
    if (
      cue &&
      armedKeyRef.current === cue &&
      playedRef.current !== cue
    ) {
      playedRef.current = cue;
      armedKeyRef.current = null;
      void playQuizGongSound({ dedupKey: cue });
    }
  }, [enabled, quizState?.gongCueKey, quizState?.displayPhase]);

  useEffect(() => {
    if (!enabled || !quizState) return;

    if (quizState.displayPhase !== "answers") {
      return;
    }

    const cueKey = answersCueKey(quizState);
    if (playedRef.current === cueKey) return;

    const initial = resolveSyncedQuizClock(quizState);

    // Join in ritardo: già a 0 → non sparare il gong stale.
    if (initial.remaining <= 0) {
      playedRef.current = cueKey;
      armedKeyRef.current = null;
      return;
    }

    armedKeyRef.current = cueKey;
    let previousRemaining = initial.remaining;
    void preloadQuizGongSound();

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
