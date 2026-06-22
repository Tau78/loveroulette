"use client";

import { useEffect, useState } from "react";
import type { LoveRouletteQuestion } from "@/lib/musicpro/types";
import type { QuizSessionState } from "@/lib/musicpro/quiz-state";
import { useCurrentQuizQuestion } from "@/hooks/useQuizQuestions";
import { useQuizPhaseSync } from "@/hooks/useQuizPhaseSync";
import {
  isMancheThemeIntroForIndex,
  resolveThemeForQuizIndex,
  resolveSyncedQuizClock,
} from "@/lib/musicpro/quiz-display";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  PLAYER_MANCHE_KICKER,
  PLAYER_NEXT_QUESTION,
  PLAYER_RESULTS_MISSED,
  PLAYER_YOUR_ANSWER_KICKER,
  playerAnswerTimeLabel,
} from "@/lib/player/public-copy";
import {
  persistPlayerAnswerRecap,
  readPlayerAnswerRecap,
} from "@/lib/player/player-answer-recap";
import { cn } from "@/lib/utils";

const CARD_CLASS =
  "bg-card/85 backdrop-blur-md border-primary/25 shadow-[0_0_32px_rgba(236,72,153,0.12)]";
const CARD_ACTIVE =
  "border-primary/45 shadow-[0_0_40px_rgba(236,72,153,0.28)] ring-1 ring-primary/20";

function PlayerGivenAnswerPlate({
  label,
  elapsedSeconds,
}: {
  label: string;
  elapsedSeconds: number;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-primary/40 bg-black/55 px-4 py-3 text-left",
        "shadow-[0_4px_24px_rgba(0,0,0,0.4)] backdrop-blur-sm",
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
        {PLAYER_YOUR_ANSWER_KICKER}
      </p>
      <p className="mt-1.5 text-base font-semibold leading-snug text-foreground">
        {label}
      </p>
      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary/90 tabular-nums">
        {playerAnswerTimeLabel(elapsedSeconds)}
      </p>
    </div>
  );
}

function computeAnswerElapsedSeconds(quizState: QuizSessionState): number {
  const clock = resolveSyncedQuizClock(quizState);
  const startedMs = Date.parse(
    clock.displayPhase === "answers" ? clock.phaseStartedAt : quizState.phaseStartedAt,
  );
  if (Number.isNaN(startedMs)) return 1;

  const elapsed = Math.ceil((Date.now() - startedMs) / 1000);
  return Math.max(1, Math.min(elapsed, quizState.timing.questionSeconds));
}

interface QuizPlayerProps {
  eventSlug: string;
  participantId: string;
  quizState: QuizSessionState | null;
  runtimeState: string;
}

export function QuizPlayer({
  eventSlug,
  participantId,
  quizState,
  runtimeState,
}: QuizPlayerProps) {
  const { currentQuestion, progressLabel, loading } = useCurrentQuizQuestion(
    eventSlug,
    quizState,
    runtimeState,
  );
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [answeredQuestionId, setAnsweredQuestionId] = useState<string | null>(
    null,
  );
  const [answeredOptionLabel, setAnsweredOptionLabel] = useState<string | null>(
    null,
  );
  const [answeredElapsedSeconds, setAnsweredElapsedSeconds] = useState<
    number | null
  >(null);

  const { remaining, displayPhase } = useQuizPhaseSync({
    eventSlug,
    quizState,
    enabled: runtimeState === "quiz" && Boolean(quizState),
    driveTicks: false,
  });

  const canAnswer =
    displayPhase === "answers" &&
    Boolean(currentQuestion) &&
    remaining > 0;

  useEffect(() => {
    if (!currentQuestion) return;

    if (currentQuestion.id !== answeredQuestionId) {
      const stored = readPlayerAnswerRecap(eventSlug, currentQuestion.id);
      if (stored) {
        setAnsweredQuestionId(stored.questionId);
        setAnsweredOptionLabel(stored.optionLabel);
        setAnsweredElapsedSeconds(stored.elapsedSeconds);
        return;
      }

      setSelectedOptionId(null);
      setAnsweredOptionLabel(null);
      setAnsweredElapsedSeconds(null);
      setSubmitError(null);
    }
  }, [answeredQuestionId, currentQuestion, eventSlug]);

  async function submitAnswer(optionId: string, question: LoveRouletteQuestion) {
    if (submitting || !canAnswer || !quizState) return;

    const elapsedSeconds = computeAnswerElapsedSeconds(quizState);

    setSubmitting(true);
    setSubmitError(null);
    setSelectedOptionId(optionId);

    try {
      const res = await fetch(
        `/api/events/${encodeURIComponent(eventSlug)}/answers`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            participantId,
            questionId: question.id,
            optionId,
          }),
        },
      );

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error ?? "Risposta non salvata.");
      }

      setAnsweredQuestionId(question.id);
      const option = question.options.find((item) => item.id === optionId);
      const label = option?.label ?? null;
      setAnsweredOptionLabel(label);
      setAnsweredElapsedSeconds(elapsedSeconds);
      if (label) {
        persistPlayerAnswerRecap(eventSlug, {
          questionId: question.id,
          optionLabel: label,
          elapsedSeconds: elapsedSeconds,
        });
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Errore di rete.");
      setSelectedOptionId(null);
    } finally {
      setSubmitting(false);
    }
  }

  if (runtimeState !== "quiz" || !quizState) {
    return null;
  }

  let phaseContent = null;

  if (displayPhase === "start_countdown") {
    phaseContent = (
      <Card className={cn(CARD_CLASS, "border-primary/30")}>
        <CardContent className="py-10 text-center">
          <p className="text-4xl font-bold tabular-nums text-primary">
            {remaining}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">Il quiz sta per iniziare</p>
        </CardContent>
      </Card>
    );
  } else if (
    displayPhase === "next_question" ||
    (displayPhase === "theme_intro" &&
      !isMancheThemeIntroForIndex(
        quizState.questionIds,
        quizState.currentIndex,
        quizState.manche,
      ))
  ) {
    phaseContent = (
      <Card className={cn(CARD_CLASS, "border-primary/30")}>
        <CardContent className="py-10 text-center">
          <p className="font-display text-lg font-semibold text-muted-foreground">
            {PLAYER_NEXT_QUESTION}
          </p>
        </CardContent>
      </Card>
    );
  } else if (displayPhase === "theme_intro") {
    const theme = resolveThemeForQuizIndex(
      quizState.questionIds,
      quizState.currentIndex,
      quizState.manche,
      currentQuestion?.category,
    );

    phaseContent = (
      <Card className={cn(CARD_CLASS, "border-primary/30")}>
        <CardContent className="py-8 text-center space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">
            {PLAYER_MANCHE_KICKER}
          </p>
          <p className="text-2xl font-display font-bold text-foreground">
            {theme?.title ?? PLAYER_MANCHE_KICKER}
          </p>
          {theme?.subtitle ? (
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              {theme.subtitle}
            </p>
          ) : null}
        </CardContent>
      </Card>
    );
  } else if (displayPhase === "results") {
    const storedRecap =
      currentQuestion != null
        ? readPlayerAnswerRecap(eventSlug, currentQuestion.id)
        : null;
    const answeredInTime =
      currentQuestion != null &&
      (answeredQuestionId === currentQuestion.id || storedRecap != null);
    const givenAnswerLabel =
      answeredOptionLabel ??
      storedRecap?.optionLabel ??
      (selectedOptionId && currentQuestion
        ? currentQuestion.options.find((o) => o.id === selectedOptionId)?.label
        : null);
    const givenElapsedSeconds =
      answeredElapsedSeconds ?? storedRecap?.elapsedSeconds ?? null;

    phaseContent = (
      <Card className={cn(CARD_CLASS, "border-primary/30")}>
        <CardContent className="py-8 text-center">
          {answeredInTime && givenAnswerLabel && givenElapsedSeconds != null ? (
            <PlayerGivenAnswerPlate
              label={givenAnswerLabel}
              elapsedSeconds={givenElapsedSeconds}
            />
          ) : (
            <p className="text-primary">{PLAYER_RESULTS_MISSED}</p>
          )}
        </CardContent>
      </Card>
    );
  } else if (loading || !currentQuestion) {
    phaseContent = (
      <Card className={cn(CARD_CLASS, "border-primary/30")}>
        <CardContent className="py-8 text-center text-muted-foreground">
          Caricamento domanda…
        </CardContent>
      </Card>
    );
  } else if (displayPhase === "question") {
    phaseContent = (
      <Card className={cn(CARD_CLASS, "border-primary/30")}>
        <CardHeader className="pb-2">
          <CardDescription>{progressLabel}</CardDescription>
          <CardTitle className="text-xl leading-snug">
            {currentQuestion.body}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-center text-xs text-muted-foreground">
            Le risposte tra poco
          </p>
        </CardContent>
      </Card>
    );
  } else {
    const alreadyAnswered = answeredQuestionId === currentQuestion.id;

    if (alreadyAnswered && answeredOptionLabel && answeredElapsedSeconds != null) {
      phaseContent = (
        <Card className={cn(CARD_CLASS, "border-primary/30")}>
          <CardContent className="py-6">
            <PlayerGivenAnswerPlate
              label={answeredOptionLabel}
              elapsedSeconds={answeredElapsedSeconds}
            />
          </CardContent>
        </Card>
      );
    } else if (!canAnswer && remaining <= 0) {
      phaseContent = (
        <Card className={cn(CARD_CLASS, "border-primary/30")}>
          <CardContent className="py-8 text-center">
            {answeredOptionLabel && answeredElapsedSeconds != null ? (
              <PlayerGivenAnswerPlate
                label={answeredOptionLabel}
                elapsedSeconds={answeredElapsedSeconds}
              />
            ) : (
              <p className="text-sm text-muted-foreground">{PLAYER_RESULTS_MISSED}</p>
            )}
          </CardContent>
        </Card>
      );
    } else {
      phaseContent = (
      <Card className={cn(CARD_CLASS, canAnswer && CARD_ACTIVE)}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2">
            <CardDescription>{progressLabel}</CardDescription>
            <span
              className={cn(
                "text-sm font-bold tabular-nums text-primary",
                remaining <= 5 && "animate-pulse",
              )}
            >
              {remaining}s
            </span>
          </div>
          <CardTitle className="text-xl leading-snug">
            {currentQuestion.body}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {currentQuestion.options.map((option) => (
            <Button
              key={option.id}
              type="button"
              variant="outline"
              disabled={submitting || !canAnswer}
              className={cn(
                "h-auto w-full justify-start whitespace-normal py-3 text-left",
                selectedOptionId === option.id &&
                  "border-primary bg-primary/15 text-primary",
              )}
              onClick={() => void submitAnswer(option.id, currentQuestion)}
            >
              {option.label}
            </Button>
          ))}

          {submitError ? (
            <p className="text-sm text-destructive text-center">{submitError}</p>
          ) : null}
        </CardContent>
      </Card>
      );
    }
  }

  return phaseContent ?? null;
}
