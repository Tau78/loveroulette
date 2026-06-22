"use client";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const MIN_QUESTION_SECONDS = 5;
const MAX_QUESTION_SECONDS = 120;

interface AdminQuizSetupFieldsProps {
  availableQuestionCount: number;
  questionCount: number;
  questionSeconds: string;
  onQuestionCountChange: (value: number) => void;
  onQuestionSecondsChange: (value: string) => void;
  onQuestionSecondsBlur?: () => void;
  questionCountReadOnly?: boolean;
  disabled?: boolean;
  className?: string;
}

export function AdminQuizSetupFields({
  availableQuestionCount,
  questionCount,
  questionSeconds,
  onQuestionCountChange,
  onQuestionSecondsChange,
  onQuestionSecondsBlur,
  questionCountReadOnly = false,
  disabled = false,
  className,
}: AdminQuizSetupFieldsProps) {
  const maxQuestions = Math.max(1, availableQuestionCount);

  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-2 rounded-md border border-border/40 px-2.5 py-2",
        className,
      )}
    >
      <div className="space-y-1">
        <Label htmlFor="quiz-question-count" className="text-[10px] uppercase tracking-wide">
          Numero domande
        </Label>
        {questionCountReadOnly ? (
          <p
            id="quiz-question-count"
            className="rounded-md border border-input/40 bg-input/20 px-2 py-1 text-xs tabular-nums"
          >
            {questionCount}
          </p>
        ) : (
          <select
            id="quiz-question-count"
            value={questionCount}
            disabled={disabled || availableQuestionCount <= 0}
            onChange={(event) => {
              const value = Number(event.target.value);
              if (Number.isFinite(value)) onQuestionCountChange(value);
            }}
            className="block w-full rounded-md border border-input bg-input/30 px-2 py-1 text-xs"
          >
            {Array.from({ length: maxQuestions }, (_, index) => {
              const value = index + 1;
              return (
                <option key={value} value={value}>
                  {value}
                  {value === availableQuestionCount ? " (tutte)" : ""}
                </option>
              );
            })}
          </select>
        )}
        {!questionCountReadOnly ? (
          <p className="text-[10px] text-muted-foreground tabular-nums">
            Caricate: {availableQuestionCount}
          </p>
        ) : (
          <p className="text-[10px] text-muted-foreground">
            Fisso per questa partita
          </p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="quiz-question-seconds" className="text-[10px] uppercase tracking-wide">
          Secondi per domanda
        </Label>
        <input
          id="quiz-question-seconds"
          type="number"
          min={MIN_QUESTION_SECONDS}
          max={MAX_QUESTION_SECONDS}
          value={questionSeconds}
          disabled={disabled}
          onChange={(event) => {
            onQuestionSecondsChange(event.target.value);
          }}
          onBlur={onQuestionSecondsBlur}
          className="block w-full rounded-md border border-input bg-input/30 px-2 py-1 text-xs tabular-nums"
        />
      </div>
    </div>
  );
}

export { MIN_QUESTION_SECONDS, MAX_QUESTION_SECONDS };
