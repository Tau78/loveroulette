"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
import { QUIZ_PHASE_LABELS } from "@/lib/musicpro/quiz-display";
import { AdminPanelShell } from "@/components/admin/AdminDeckPanel";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface AdminQuizPanelProps {
  eventCode: string;
  quizState: QuizSessionState | null;
  animatorPin: string | null;
  disabled?: boolean;
  onInvalidPin?: () => void;
  onQuizChange?: (quiz: QuizSessionState | null) => void;
  variant?: "card" | "deck";
}

export function AdminQuizPanel({
  eventCode,
  quizState,
  animatorPin,
  disabled = false,
  onInvalidPin,
  onQuizChange,
  variant = "card",
}: AdminQuizPanelProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tickingRef = useRef(false);
  const busyRef = useRef(false);

  const { currentQuestion, progressLabel, loading, error: questionsError } =
    useCurrentQuizQuestion(eventCode, quizState, "quiz");

  const questionSeconds = quizState?.timing.questionSeconds ?? 15;
  const autoplayEnabled = quizState?.autoplayEnabled !== false;
  const compact = variant === "deck";

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

  return (
    <AdminPanelShell
      variant={variant}
      title="Quiz — regia"
      cardTitle="Quiz — regia domande"
      subtitle={`${phaseLabel} · ${remaining}s · ${progressLabel ?? "…"}`}
      cardDescription={`${progressLabel ?? "Caricamento domande…"} · fase: ${phaseLabel}`}
      accent
      className={variant === "card" ? "border-primary/20" : undefined}
    >
      {loading ? (
        <p className="text-xs text-muted-foreground">Caricamento testo…</p>
      ) : currentQuestion ? (
        <div className="rounded-md border border-border/50 bg-background/40 p-2.5 space-y-2">
          <p className="text-[10px] uppercase tracking-wider text-primary">
            {progressLabel}
          </p>
          <p
            className={
              compact
                ? "text-sm font-semibold leading-snug"
                : "text-lg font-semibold leading-snug"
            }
          >
            {currentQuestion.body}
          </p>
          <ul className="space-y-1">
            {currentQuestion.options.map((option) => (
              <li
                key={option.id}
                className="rounded-md border border-border/40 px-2 py-1 text-xs text-muted-foreground"
              >
                {option.label}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-xs text-destructive">
          {questionsError ?? "Domanda non trovata."}
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
