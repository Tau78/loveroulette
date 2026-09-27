"use client";

import { useEffect, useMemo, useState } from "react";
import type { LoveRouletteQuestion } from "@/lib/musicpro/types";
import type { QuizSessionState } from "@/lib/musicpro/quiz-state";
import { orderOptionsForQuizDisplay } from "@/lib/musicpro/quiz-option-shuffle";

export function useQuizQuestions(
  eventSlug: string,
  enabled: boolean,
): {
  questions: LoveRouletteQuestion[];
  loading: boolean;
  error: string | null;
} {
  const [questions, setQuestions] = useState<LoveRouletteQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `/api/events/${encodeURIComponent(eventSlug)}/questions`,
        );
        if (!res.ok) {
          throw new Error("Impossibile caricare le domande.");
        }

        const data = (await res.json()) as {
          questions?: LoveRouletteQuestion[];
        };

        if (!cancelled) {
          setQuestions(data.questions ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Errore domande.");
          setQuestions([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [enabled, eventSlug]);

  return { questions, loading, error };
}

/** Domanda con opzioni mischiate per la serata (A–D ≠ sortOrder editor). */
export function resolveQuizQuestion(
  quizState: QuizSessionState | null,
  questions: LoveRouletteQuestion[],
  eventSlug: string,
): LoveRouletteQuestion | null {
  if (!quizState || questions.length === 0) return null;

  const questionId = quizState.questionIds[quizState.currentIndex];
  if (!questionId) return null;

  const raw = questions.find((q) => q.id === questionId) ?? null;
  if (!raw) return null;

  return {
    ...raw,
    options: orderOptionsForQuizDisplay(raw.options, eventSlug, raw.id),
  };
}

/** Stessa permutazione per anteprima «Prossima domanda». */
export function questionWithShuffledOptions(
  question: LoveRouletteQuestion,
  eventSlug: string,
): LoveRouletteQuestion {
  return {
    ...question,
    options: orderOptionsForQuizDisplay(
      question.options,
      eventSlug,
      question.id,
    ),
  };
}

export function quizProgressLabel(
  quizState: QuizSessionState | null,
): string | null {
  if (!quizState) return null;
  return `Domanda ${quizState.currentIndex + 1} di ${quizState.total}`;
}

export function useCurrentQuizQuestion(
  eventSlug: string,
  quizState: QuizSessionState | null,
  runtimeState: string,
) {
  const enabled = runtimeState === "quiz" && Boolean(quizState);
  const { questions, loading, error } = useQuizQuestions(eventSlug, enabled);

  const currentQuestion = useMemo(
    () => resolveQuizQuestion(quizState, questions, eventSlug),
    [quizState, questions, eventSlug],
  );

  return {
    questions,
    currentQuestion,
    progressLabel: quizProgressLabel(quizState),
    loading,
    error,
  };
}
