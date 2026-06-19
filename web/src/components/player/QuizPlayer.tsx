"use client";

import { useEffect, useState } from "react";
import type { LoveRouletteQuestion } from "@/lib/musicpro/types";
import type { QuizSessionState } from "@/lib/musicpro/quiz-state";
import { useCurrentQuizQuestion } from "@/hooks/useQuizQuestions";
import { useQuizPhaseSync } from "@/hooks/useQuizPhaseSync";
import { resolveThemeForQuizIndex } from "@/lib/musicpro/quiz-display";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

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

  const { remaining } = useQuizPhaseSync({
    eventSlug,
    quizState,
    enabled: runtimeState === "quiz" && Boolean(quizState),
    driveTicks: false,
  });

  const canAnswer =
    quizState?.displayPhase === "answers" &&
    Boolean(currentQuestion) &&
    remaining > 0;

  useEffect(() => {
    if (!currentQuestion) return;
    if (currentQuestion.id !== answeredQuestionId) {
      setSelectedOptionId(null);
      setSubmitError(null);
    }
  }, [answeredQuestionId, currentQuestion]);

  async function submitAnswer(optionId: string, question: LoveRouletteQuestion) {
    if (submitting || !canAnswer) return;

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

  if (quizState.displayPhase === "start_countdown") {
    return (
      <Card className="bg-card/80 backdrop-blur-md border-border/60">
        <CardContent className="py-10 text-center">
          <p className="text-4xl font-bold tabular-nums text-primary">
            {remaining}
          </p>
          <p className="mt-2 text-muted-foreground">Il quiz sta per iniziare…</p>
        </CardContent>
      </Card>
    );
  }

  if (quizState.displayPhase === "theme_intro") {
    const theme = resolveThemeForQuizIndex(
      quizState.questionIds,
      quizState.currentIndex,
      quizState.manche,
      currentQuestion?.category,
    );

    return (
      <Card className="bg-card/80 backdrop-blur-md border-border/60 border-primary/20">
        <CardContent className="py-8 text-center space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">
            Tema
          </p>
          <p className="text-2xl font-display font-bold text-foreground">
            {theme?.title ?? "Nuova manche"}
          </p>
          {theme?.subtitle ? (
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              {theme.subtitle}
            </p>
          ) : null}
          <p className="text-xs text-muted-foreground/80 pt-1">
            Guarda il proiettore…
          </p>
        </CardContent>
      </Card>
    );
  }

  if (quizState.displayPhase === "next_question") {
    return (
      <Card className="bg-card/80 backdrop-blur-md border-border/60">
        <CardContent className="py-8 text-center text-muted-foreground">
          Prossima domanda — guarda il proiettore!
        </CardContent>
      </Card>
    );
  }

  if (quizState.displayPhase === "results") {
    return (
      <Card className="bg-card/80 backdrop-blur-md border-border/60">
        <CardContent className="py-8 text-center text-primary">
          Tempo scaduto — guarda il proiettore per i risultati!
        </CardContent>
      </Card>
    );
  }

  if (loading || !currentQuestion) {
    return (
      <Card className="bg-card/80 backdrop-blur-md border-border/60">
        <CardContent className="py-8 text-center text-muted-foreground">
          Caricamento domanda…
        </CardContent>
      </Card>
    );
  }

  if (quizState.displayPhase === "question") {
    return (
      <Card className="bg-card/80 backdrop-blur-md border-border/60 border-primary/20">
        <CardHeader className="pb-2">
          <CardDescription>{progressLabel}</CardDescription>
          <CardTitle className="text-xl leading-snug">
            {currentQuestion.body}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-sm text-muted-foreground py-4">
            Leggi la domanda — le risposte tra poco…
          </p>
        </CardContent>
      </Card>
    );
  }

  const alreadyAnswered = answeredQuestionId === currentQuestion.id;

  return (
    <Card className="bg-card/80 backdrop-blur-md border-border/60">
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
            disabled={submitting || alreadyAnswered || !canAnswer}
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

        {alreadyAnswered ? (
          <p className="text-sm text-primary text-center">
            Risposta inviata — guarda il proiettore!
          </p>
        ) : null}

        {submitError ? (
          <p className="text-sm text-destructive text-center">{submitError}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
