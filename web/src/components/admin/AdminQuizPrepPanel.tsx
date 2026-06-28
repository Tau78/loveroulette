"use client";

import { useCallback, useEffect, useState } from "react";
import {
  isInvalidAnimatorPinError,
  postQuizAction,
} from "@/lib/admin/animator-api";
import { AdminPanelShell } from "@/components/admin/AdminDeckPanel";
import {
  AdminQuizSetupFields,
  MAX_QUESTION_SECONDS,
  MIN_QUESTION_SECONDS,
} from "@/components/admin/AdminQuizSetupFields";
import { useEventQuestionCount } from "@/hooks/useEventQuestionCount";
import type { QuizSessionState, QuizSetupPrefs } from "@/lib/musicpro/quiz-state";
import { Button } from "@/components/ui/button";

interface AdminQuizPrepPanelProps {
  eventCode: string;
  animatorPin: string | null;
  quizSetup: QuizSetupPrefs;
  disabled?: boolean;
  questionsRefreshKey?: number;
  onInvalidPin?: () => void;
  onQuizChange?: (quiz: QuizSessionState | null) => void;
  onTransportReady?: (payload: { start: () => void; canStart: boolean }) => void;
  variant?: "card" | "deck";
}

export function AdminQuizPrepPanel({
  eventCode,
  animatorPin,
  quizSetup,
  disabled = false,
  questionsRefreshKey = 0,
  onInvalidPin,
  onQuizChange,
  onTransportReady,
  variant = "card",
}: AdminQuizPrepPanelProps) {
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
    if (availableCount == null || availableCount <= 0) return;
    setQuestionCount((current) => {
      const preferred = quizSetup.questionCount ?? availableCount;
      const next = Math.max(1, Math.min(availableCount, preferred));
      return Math.max(1, Math.min(availableCount, current || next));
    });
  }, [availableCount, quizSetup.questionCount]);

  useEffect(() => {
    setQuestionSeconds(quizSetup.questionSeconds);
  }, [quizSetup.questionSeconds]);

  const startQuiz = useCallback(async () => {
    if (disabled || busy || availableCount == null || availableCount <= 0) return;

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
    eventCode,
    onInvalidPin,
    onQuizChange,
    questionCount,
    questionSeconds,
  ]);

  const canStart = availableCount != null && availableCount > 0;

  useEffect(() => {
    onTransportReady?.({
      start: () => void startQuiz(),
      canStart: canStart && !disabled && !busy && !countLoading,
    });
  }, [
    busy,
    canStart,
    countLoading,
    disabled,
    onTransportReady,
    startQuiz,
  ]);

  return (
    <AdminPanelShell
      variant={variant}
      title="Quiz setup"
      cardTitle="Quiz — regia domande"
      accent
      collapsible={false}
      className={variant === "card" ? "border-primary/20" : undefined}
    >
      <AdminQuizSetupFields
        availableQuestionCount={availableCount ?? 0}
        questionCount={questionCount}
        questionSeconds={String(questionSeconds)}
        onQuestionCountChange={setQuestionCount}
        onQuestionSecondsChange={(value) => {
          const parsed = Number(value);
          if (Number.isFinite(parsed)) setQuestionSeconds(parsed);
        }}
        disabled={disabled || busy || countLoading || !canStart}
      />

      {!canStart && !countLoading ? (
        <p className="text-[10px] text-destructive">0 domande</p>
      ) : null}

      {error ? <p className="text-[10px] text-destructive">{error}</p> : null}
    </AdminPanelShell>
  );
}
