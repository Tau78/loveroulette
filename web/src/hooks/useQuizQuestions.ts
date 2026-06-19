"use client";

import { useEffect, useMemo, useState } from "react";
import type { LoveRouletteQuestion } from "@/lib/musicpro/types";
import type { QuizSessionState } from "@/lib/musicpro/quiz-state";

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

export function resolveQuizQuestion(
  quizState: QuizSessionState | null,
  questions: LoveRouletteQuestion[],
): LoveRouletteQuestion | null {
  if (!quizState || questions.length === 0) return null;

  const questionId = quizState.questionIds[quizState.currentIndex];
  if (!questionId) return null;

  return questions.find((q) => q.id === questionId) ?? null;
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
    () => resolveQuizQuestion(quizState, questions),
    [quizState, questions],
  );

  return {
    questions,
    currentQuestion,
    progressLabel: quizProgressLabel(quizState),
    loading,
    error,
  };
}
