"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronRight,
  FastForward,
} from "lucide-react";
import {
  isInvalidAnimatorPinError,
  postQuizAction,
} from "@/lib/admin/animator-api";
import { useCurrentQuizQuestion } from "@/hooks/useQuizQuestions";
import { useQuizPhaseSync } from "@/hooks/useQuizPhaseSync";
import type { QuizSessionState } from "@/lib/musicpro/quiz-state";
import type { QuestionResults } from "@/lib/musicpro/quiz-results";
import { QUIZ_PHASE_LABELS } from "@/lib/musicpro/quiz-display";
import { AdminPanelShell } from "@/components/admin/AdminDeckPanel";
import { cn } from "@/lib/utils";
import { AdminQuizQuestionReel } from "@/components/admin/AdminQuizQuestionReel";
import {
  AdminQuizSetupFields,
  MAX_QUESTION_SECONDS,
  MIN_QUESTION_SECONDS,
} from "@/components/admin/AdminQuizSetupFields";
import { Button } from "@/components/ui/button";

const QUIZ_STATS_POLL_MS = 1500;

interface AdminQuizPanelProps {
  eventCode: string;
  quizState: QuizSessionState | null;
  animatorPin: string | null;
  onlineCount?: number;
  participantCount?: number;
  disabled?: boolean;
  onInvalidPin?: () => void;
  onQuizChange?: (quiz: QuizSessionState | null) => void;
  variant?: "card" | "deck";
  /** AVANTI gestito dalla transport bar. */
  hideAdvance?: boolean;
}

export function AdminQuizPanel({
  eventCode,
  quizState,
  animatorPin,
  onlineCount = 0,
  participantCount = 0,
  disabled = false,
  onInvalidPin,
  onQuizChange,
  variant = "card",
  hideAdvance = false,
}: AdminQuizPanelProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answerStats, setAnswerStats] = useState<QuestionResults | null>(null);
  const [secondsDraft, setSecondsDraft] = useState("15");
  const busyRef = useRef(false);

  const { questions, progressLabel, loading, error: questionsError } =
    useCurrentQuizQuestion(eventCode, quizState, "quiz");

  const orderedQuestions = useMemo(() => {
    if (!quizState) return [];
    return quizState.questionIds
      .map((id) => questions.find((q) => q.id === id))
      .filter((q): q is NonNullable<typeof q> => q != null);
  }, [quizState, questions]);

  const questionSeconds = quizState?.timing.questionSeconds ?? 15;
  const autoplayEnabled = quizState?.autoplayEnabled === true;

  useEffect(() => {
    setSecondsDraft(String(questionSeconds));
  }, [questionSeconds]);

  const runAction = useCallback(
    async (
      action:
        | "advance"
        | "finish"
        | "setAutoplaySeconds"
        | "setAutoplayEnabled"
        | "skipPhase"
        | "tick",
      extra?: { autoplaySeconds?: number; enabled?: boolean },
    ) => {
      if (disabled || busyRef.current) return;

      busyRef.current = true;
      setBusy(true);
      setError(null);

      try {
        const response = await postQuizAction(
          eventCode,
          { action, ...extra },
          animatorPin,
        );

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as {
            error?: string;
          } | null;
          const message = payload?.error ?? "Azione quiz non riuscita.";
          if (response.status === 401 || isInvalidAnimatorPinError(message)) {
            onInvalidPin?.();
          }
          throw new Error(message);
        }

        const data = (await response.json()) as {
          quiz: QuizSessionState | null;
          runtimeState?: string;
        };
        onQuizChange?.(data.quiz ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Errore di rete.");
      } finally {
        busyRef.current = false;
        setBusy(false);
      }
    },
    [animatorPin, disabled, eventCode, onInvalidPin, onQuizChange],
  );

  const { remaining, displayPhase } = useQuizPhaseSync({
    eventSlug: eventCode,
    quizState,
    enabled: Boolean(quizState) && !disabled,
    driveTicks: autoplayEnabled && !disabled,
    onTick: (quiz) => onQuizChange?.(quiz),
  });

  const currentQuestionId =
    quizState?.questionIds[quizState.currentIndex] ?? null;
  const pollAnswerStats =
    displayPhase === "answers" || displayPhase === "results";

  useEffect(() => {
    if (!pollAnswerStats || !currentQuestionId) {
      setAnswerStats(null);
      return;
    }

    let cancelled = false;

    async function loadStats() {
      try {
        const res = await fetch(
          `/api/events/${encodeURIComponent(eventCode)}/quiz/stats?questionId=${encodeURIComponent(currentQuestionId!)}`,
        );
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as QuestionResults;
        if (!cancelled) setAnswerStats(data);
      } catch {
        // keep last known count
      }
    }

    void loadStats();
    const interval = window.setInterval(loadStats, QUIZ_STATS_POLL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [currentQuestionId, eventCode, pollAnswerStats, quizState?.currentIndex]);

  if (!quizState) {
    return null;
  }

  const isLastQuestion = quizState.currentIndex >= quizState.total - 1;
  const onLastResults =
    isLastQuestion &&
    (displayPhase === "results" || displayPhase === "next_question");
  const phaseLabel =
    QUIZ_PHASE_LABELS[displayPhase] ?? displayPhase;

  const answerCap = onlineCount > 0 ? onlineCount : participantCount;
  const totalAnswers = answerStats?.totalAnswers ?? 0;
  const answerRatio = answerCap > 0 ? totalAnswers / answerCap : 0;
  const showAnswerCount = pollAnswerStats && currentQuestionId;

  function commitQuestionSeconds() {
    const value = Number(secondsDraft);
    if (!Number.isFinite(value)) {
      setSecondsDraft(String(questionSeconds));
      return;
    }
    const clamped = Math.max(
      MIN_QUESTION_SECONDS,
      Math.min(MAX_QUESTION_SECONDS, value),
    );
    setSecondsDraft(String(clamped));
    if (clamped !== questionSeconds) {
      void runAction("setAutoplaySeconds", { autoplaySeconds: clamped });
    }
  }

  return (
    <AdminPanelShell
      variant={variant}
      title="Quiz"
      cardTitle="Quiz — regia domande"
      subtitle={`${phaseLabel} · ${remaining}s · ${progressLabel ?? "…"}`}
      cardDescription={`${progressLabel ?? "…"} · ${phaseLabel}`}
      actions={
        showAnswerCount ? (
          <span
            className={cn(
              "text-[10px] font-semibold tabular-nums whitespace-nowrap",
              answerRatio > 0.5 ? "text-primary" : "text-muted-foreground",
            )}
            aria-live="polite"
          >
            {totalAnswers}/{answerCap}
          </span>
        ) : undefined
      }
      accent
      collapsible={false}
      className={variant === "card" ? "border-primary/20" : undefined}
    >
      {loading ? (
        <p className="text-[10px] text-muted-foreground">…</p>
      ) : orderedQuestions.length > 0 ? (
        <AdminQuizQuestionReel
          questions={orderedQuestions}
          currentIndex={quizState.currentIndex}
        />
      ) : (
        <p className="text-[10px] text-destructive">
          {questionsError ?? "Errore"}
        </p>
      )}

      {!hideAdvance ? (
        <div className="flex flex-wrap gap-1.5">
          <Button
            type="button"
            size="sm"
            className="w-full min-w-[120px]"
            disabled={disabled || busy}
            onClick={() => void runAction("skipPhase")}
          >
            {onLastResults ? (
              <>
                <FastForward className="size-3.5" />
                Matching
              </>
            ) : (
              <>
                <ChevronRight className="size-3.5" />
                Avanti
              </>
            )}
          </Button>
        </div>
      ) : null}

      <AdminQuizSetupFields
        availableQuestionCount={quizState.total}
        questionCount={quizState.total}
        questionSeconds={secondsDraft}
        onQuestionCountChange={() => {}}
        onQuestionSecondsChange={setSecondsDraft}
        onQuestionSecondsBlur={commitQuestionSeconds}
        questionCountReadOnly
        disabled={disabled || busy}
      />

      <div className="flex flex-wrap items-center gap-2 rounded-md border border-border/40 px-2 py-1.5">
        <Button
          type="button"
          variant={autoplayEnabled ? "default" : "outline"}
          size="sm"
          className="h-7 text-[10px]"
          disabled={disabled || busy}
          onClick={() =>
            void runAction("setAutoplayEnabled", {
              enabled: !autoplayEnabled,
            })
          }
        >
          Auto {autoplayEnabled ? "On" : "Off"}
        </Button>
        <span className="text-[10px] text-primary ml-auto tabular-nums">{remaining}s</span>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 text-[10px] w-full"
        disabled={disabled || busy}
        onClick={() => void runAction("finish")}
      >
        Salta matching
      </Button>

      {error ? <p className="text-[10px] text-destructive">{error}</p> : null}
    </AdminPanelShell>
  );
}
