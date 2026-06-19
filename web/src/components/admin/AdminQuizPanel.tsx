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
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

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
}: AdminQuizPanelProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answerStats, setAnswerStats] = useState<QuestionResults | null>(null);
  const tickingRef = useRef(false);
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

  const { remaining } = useQuizPhaseSync({
    eventSlug: eventCode,
    quizState,
    enabled: Boolean(quizState) && !disabled,
    driveTicks: false,
    onTick: (quiz) => onQuizChange?.(quiz),
  });

  useEffect(() => {
    if (!autoplayEnabled || !quizState || disabled || remaining > 0) return;
    if (tickingRef.current || busyRef.current) return;

    tickingRef.current = true;
    void runAction("tick").finally(() => {
      window.setTimeout(() => {
        tickingRef.current = false;
      }, 500);
    });
  }, [autoplayEnabled, disabled, quizState, remaining, runAction]);

  const currentQuestionId =
    quizState?.questionIds[quizState.currentIndex] ?? null;
  const pollAnswerStats =
    quizState?.displayPhase === "answers" ||
    quizState?.displayPhase === "results";

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
    (quizState.displayPhase === "results" ||
      quizState.displayPhase === "next_question");
  const phaseLabel =
    QUIZ_PHASE_LABELS[quizState.displayPhase] ?? quizState.displayPhase;

  const answerCap = onlineCount > 0 ? onlineCount : participantCount;
  const totalAnswers = answerStats?.totalAnswers ?? 0;
  const answerRatio = answerCap > 0 ? totalAnswers / answerCap : 0;
  const showAnswerCount = pollAnswerStats && currentQuestionId;

  return (
    <AdminPanelShell
      variant={variant}
      title="Quiz — regia"
      cardTitle="Quiz — regia domande"
      subtitle={`${phaseLabel} · ${remaining}s · ${progressLabel ?? "…"}`}
      cardDescription={`${progressLabel ?? "Caricamento domande…"} · fase: ${phaseLabel}`}
      actions={
        showAnswerCount ? (
          <span
            className={cn(
              "text-[11px] font-semibold tabular-nums whitespace-nowrap",
              answerRatio > 0.5 ? "text-primary" : "text-muted-foreground",
            )}
            aria-live="polite"
          >
            {totalAnswers} / {answerCap} risposte
          </span>
        ) : undefined
      }
      accent
      className={variant === "card" ? "border-primary/20" : undefined}
    >
      {loading ? (
        <p className="text-xs text-muted-foreground">Caricamento rullo…</p>
      ) : orderedQuestions.length > 0 ? (
        <AdminQuizQuestionReel
          questions={orderedQuestions}
          currentIndex={quizState.currentIndex}
        />
      ) : (
        <p className="text-xs text-destructive">
          {questionsError ?? "Domande non trovate."}
        </p>
      )}

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
              Termina → matching
            </>
          ) : (
            <>
              <ChevronRight className="size-3.5" />
              AVANTI
            </>
          )}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-md border border-border/40 px-2.5 py-2">
        <Button
          type="button"
          variant={autoplayEnabled ? "default" : "outline"}
          size="sm"
          disabled={disabled || busy}
          onClick={() =>
            void runAction("setAutoplayEnabled", {
              enabled: !autoplayEnabled,
            })
          }
        >
          Autoplay: {autoplayEnabled ? "On" : "Off"}
        </Button>
        <div className="flex items-center gap-1.5">
          <Label htmlFor="autoplay-seconds" className="text-[10px] shrink-0">
            Domanda (s)
          </Label>
          <input
            id="autoplay-seconds"
            type="number"
            min={5}
            max={120}
            value={questionSeconds}
            disabled={disabled || busy}
            onChange={(event) => {
              const value = Number(event.target.value);
              if (!Number.isFinite(value)) return;
              void runAction("setAutoplaySeconds", { autoplaySeconds: value });
            }}
            className="w-14 rounded-md border border-input bg-input/30 px-1.5 py-0.5 text-xs"
          />
        </div>
        <p className="text-xs text-primary ml-auto tabular-nums">{remaining}s</p>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 text-xs w-full"
        disabled={disabled || busy}
        onClick={() => void runAction("finish")}
      >
        Salta al matching
      </Button>

      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </AdminPanelShell>
  );
}
