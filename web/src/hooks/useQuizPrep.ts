"use client";

import { useCallback, useEffect, useState } from "react";
import {
  isInvalidAnimatorPinError,
  postQuizAction,
} from "@/lib/admin/animator-api";
import {
  MAX_QUESTION_SECONDS,
  MIN_QUESTION_SECONDS,
} from "@/components/admin/AdminQuizSetupFields";
import { useEventQuestionCount } from "@/hooks/useEventQuestionCount";
import type { QuizSessionState, QuizSetupPrefs } from "@/lib/musicpro/quiz-state";

interface UseQuizPrepOptions {
  eventCode: string;
  animatorPin: string | null;
  quizSetup: QuizSetupPrefs;
  disabled?: boolean;
  questionsRefreshKey?: number;
  onInvalidPin?: () => void;
  onQuizChange?: (quiz: QuizSessionState | null) => void;
  onTransportReady?: (payload: { start: () => void; canStart: boolean }) => void;
  enabled?: boolean;
}

export function useQuizPrep({
  eventCode,
  animatorPin,
  quizSetup,
  disabled = false,
  questionsRefreshKey = 0,
  onInvalidPin,
  onQuizChange,
  onTransportReady,
  enabled = true,
}: UseQuizPrepOptions) {
  const { count: availableCount, loading: countLoading } = useEventQuestionCount(
    eventCode,
    true,
    questionsRefreshKey,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questionCount, setQuestionCount] = useState(
    quizSetup.questionCount ?? availableCount ?? 27,
  );
  const [questionSeconds, setQuestionSeconds] = useState(
    quizSetup.questionSeconds,
  );

  useEffect(() => {
    if (!enabled || availableCount == null || availableCount <= 0) return;
    setQuestionCount((current) => {
      const preferred = quizSetup.questionCount ?? availableCount;
      const next = Math.max(1, Math.min(availableCount, preferred));
      return Math.max(1, Math.min(availableCount, current || next));
    });
  }, [availableCount, enabled, quizSetup.questionCount]);

  useEffect(() => {
    if (!enabled) return;
    setQuestionSeconds(quizSetup.questionSeconds);
  }, [enabled, quizSetup.questionSeconds]);

  const canStart = enabled && availableCount != null && availableCount > 0;

  const startQuiz = useCallback(async () => {
    if (!enabled || disabled || busy || availableCount == null || availableCount <= 0) {
      return;
    }

    setBusy(true);
    setError(null);

    const seconds = Math.max(
      MIN_QUESTION_SECONDS,
      Math.min(MAX_QUESTION_SECONDS, questionSeconds),
    );
    const count = Math.max(1, Math.min(availableCount, questionCount));

    try {
      const response = await postQuizAction(
        eventCode,
        {
          action: "start",
          questionCount: count,
          questionSeconds: seconds,
        },
        animatorPin,
      );

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        const message = payload?.error ?? "Impossibile avviare il quiz.";
        if (response.status === 401 || isInvalidAnimatorPinError(message)) {
          onInvalidPin?.();
        }
        throw new Error(message);
      }

      const data = (await response.json()) as { quiz: QuizSessionState | null };
      onQuizChange?.(data.quiz ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore di rete.");
    } finally {
      setBusy(false);
    }
  }, [
    animatorPin,
    availableCount,
    busy,
    disabled,
    enabled,
    eventCode,
    onInvalidPin,
    onQuizChange,
    questionCount,
    questionSeconds,
  ]);

  useEffect(() => {
    if (!enabled) return;
    onTransportReady?.({
      start: () => void startQuiz(),
      canStart: canStart && !disabled && !busy && !countLoading,
    });
  }, [
    busy,
    canStart,
    countLoading,
    disabled,
    enabled,
    onTransportReady,
    startQuiz,
  ]);

  return {
    availableCount,
    countLoading,
    busy,
    error,
    questionCount,
    setQuestionCount,
    questionSeconds,
    setQuestionSeconds,
    canStart,
    startQuiz,
  };
}
