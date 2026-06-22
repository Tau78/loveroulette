"use client";

import { useEffect, useState } from "react";
import { Play } from "lucide-react";
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

  async function startQuiz() {
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
  }

  const canStart = availableCount != null && availableCount > 0;

  return (
    <AdminPanelShell
      variant={variant}
      title="Quiz — regia"
      cardTitle="Quiz — regia domande"
      subtitle="Imposta partita e avvia"
      cardDescription="Scegli quante domande giocare e i secondi per rispondere, poi avvia."
      accent
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

      <Button
        type="button"
        size="sm"
        className="w-full min-h-9 font-semibold"
        disabled={disabled || busy || countLoading || !canStart}
        onClick={() => void startQuiz()}
      >
        <Play className="size-3.5" />
        Avvia quiz
      </Button>

      {!canStart && !countLoading ? (
        <p className="text-xs text-destructive">
          Nessuna domanda caricata — importa il bundle prima di avviare.
        </p>
      ) : null}

      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </AdminPanelShell>
  );
}
