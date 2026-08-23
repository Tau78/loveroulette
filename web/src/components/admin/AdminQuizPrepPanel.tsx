"use client";

import { AdminPanelShell } from "@/components/admin/AdminDeckPanel";
import {
  AdminQuizSetupFields,
} from "@/components/admin/AdminQuizSetupFields";
import { useQuizPrep } from "@/hooks/useQuizPrep";
import type { QuizSessionState, QuizSetupPrefs } from "@/lib/musicpro/quiz-state";

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
  const quizPrep = useQuizPrep({
    eventCode,
    animatorPin,
    quizSetup,
    disabled,
    questionsRefreshKey,
    onInvalidPin,
    onQuizChange,
    onTransportReady,
  });

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
        availableQuestionCount={quizPrep.availableCount ?? 0}
        questionCount={quizPrep.questionCount}
        questionSeconds={String(quizPrep.questionSeconds)}
        onQuestionCountChange={quizPrep.setQuestionCount}
        onQuestionSecondsChange={(value) => {
          const parsed = Number(value);
          if (Number.isFinite(parsed)) quizPrep.setQuestionSeconds(parsed);
        }}
        disabled={
          disabled ||
          quizPrep.busy ||
          quizPrep.countLoading ||
          !quizPrep.canStart
        }
      />

      {!quizPrep.canStart && !quizPrep.countLoading ? (
        <p className="text-[10px] text-destructive">0 domande</p>
      ) : null}

      {quizPrep.error ? (
        <p className="text-[10px] text-destructive">{quizPrep.error}</p>
      ) : null}
    </AdminPanelShell>
  );
}
