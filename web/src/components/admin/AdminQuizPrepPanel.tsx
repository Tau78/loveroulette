"use client";

import { useCallback, useEffect, useState } from "react";
import {
  isInvalidAnimatorPinError,
  postQuizAction,
} from "@/lib/admin/animator-api";
import {
  AdminQuizSetupFields,
  MAX_QUESTION_SECONDS,
  MIN_QUESTION_SECONDS,
} from "@/components/admin/AdminQuizSetupFields";
import { useEventQuestionCount } from "@/hooks/useEventQuestionCount";
import type { QuizSessionState, QuizSetupPrefs } from "@/lib/musicpro/quiz-state";
import {
  DEFAULT_HIDE_RANKING_LAST_N,
  DEFAULT_QUIZ_QUESTION_COUNT,
  DEFAULT_RANKING_EVERY_N,
} from "@/lib/musicpro/quiz-display";

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
}: AdminQuizPrepPanelProps) {
  const { count: availableCount, loading: countLoading } = useEventQuestionCount(
    eventCode,
    true,
    questionsRefreshKey,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questionCount, setQuestionCount] = useState(() => {
    const preferred =
      quizSetup.questionCount ?? DEFAULT_QUIZ_QUESTION_COUNT;
    return preferred;
  });
  const [questionSeconds, setQuestionSeconds] = useState(
    quizSetup.questionSeconds,
  );
  const [hideRankingLastN, setHideRankingLastN] = useState(
    quizSetup.hideRankingLastN ?? DEFAULT_HIDE_RANKING_LAST_N,
  );
  const [rankingEveryN, setRankingEveryN] = useState(
    quizSetup.rankingEveryN ?? DEFAULT_RANKING_EVERY_N,
  );

  useEffect(() => {
    if (availableCount == null || availableCount <= 0) return;
    setQuestionCount((current) => {
      const preferred =
        quizSetup.questionCount ??
        Math.min(DEFAULT_QUIZ_QUESTION_COUNT, availableCount);
      const next = Math.max(1, Math.min(availableCount, preferred));
      return Math.max(1, Math.min(availableCount, current || next));
    });
  }, [availableCount, quizSetup.questionCount]);

  useEffect(() => {
    setQuestionSeconds(quizSetup.questionSeconds);
  }, [quizSetup.questionSeconds]);

  useEffect(() => {
    setHideRankingLastN(
      quizSetup.hideRankingLastN ?? DEFAULT_HIDE_RANKING_LAST_N,
    );
  }, [quizSetup.hideRankingLastN]);

  useEffect(() => {
    setRankingEveryN(quizSetup.rankingEveryN ?? DEFAULT_RANKING_EVERY_N);
  }, [quizSetup.rankingEveryN]);

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
          hideRankingLastN,
          rankingEveryN,
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
    hideRankingLastN,
    rankingEveryN,
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
    <div className="space-y-1">
      <AdminQuizSetupFields
        availableQuestionCount={availableCount ?? 0}
        questionCount={questionCount}
        questionSeconds={String(questionSeconds)}
        onQuestionCountChange={setQuestionCount}
        onQuestionSecondsChange={(value) => {
          const parsed = Number(value);
          if (Number.isFinite(parsed)) setQuestionSeconds(parsed);
        }}
        hideRankingLastN={hideRankingLastN}
        onHideRankingLastNChange={setHideRankingLastN}
        rankingEveryN={rankingEveryN}
        onRankingEveryNChange={setRankingEveryN}
        disabled={disabled || busy || countLoading || !canStart}
      />

      {!canStart && !countLoading ? (
        <p className="text-[10px] text-destructive">0 domande caricate</p>
      ) : null}

      {error ? <p className="text-[10px] text-destructive">{error}</p> : null}
    </div>
  );
}
