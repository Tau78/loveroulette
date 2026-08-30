"use client";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ADMIN_UI } from "@/lib/admin/admin-ui-tokens";
import { DEFAULT_HIDE_RANKING_LAST_N } from "@/lib/musicpro/quiz-display";

const MIN_QUESTION_SECONDS = 5;
const MAX_QUESTION_SECONDS = 120;
const MIN_HIDE_RANKING_LAST_N = 0;
const MAX_HIDE_RANKING_LAST_N = 30;

interface AdminQuizSetupFieldsProps {
  availableQuestionCount: number;
  questionCount: number;
  questionSeconds: string;
  onQuestionCountChange: (value: number) => void;
  onQuestionSecondsChange: (value: string) => void;
  onQuestionSecondsBlur?: () => void;
  hideRankingLastN?: number;
  onHideRankingLastNChange?: (value: number) => void;
  hideRankingReadOnly?: boolean;
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
  hideRankingLastN = DEFAULT_HIDE_RANKING_LAST_N,
  onHideRankingLastNChange,
  hideRankingReadOnly = false,
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
        <Label htmlFor="quiz-question-count" className={ADMIN_UI.label}>
          Numero domande
        </Label>
        {questionCountReadOnly ? (
          <p
            id="quiz-question-count"
            className={cn(ADMIN_UI.stat, "rounded-lg border-2 border-white/25 bg-white/10 px-2 py-1.5 h-9 flex items-center")}
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
            className={cn(ADMIN_UI.select, "w-full")}
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
          <p className={cn(ADMIN_UI.caption, "tabular-nums")}>
            Caricate: {availableQuestionCount}
          </p>
        ) : (
          <p className={ADMIN_UI.caption}>Fisso per questa partita</p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="quiz-question-seconds" className={ADMIN_UI.label}>
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
          className={cn(ADMIN_UI.input, "w-full tabular-nums")}
        />
      </div>

      <div className="col-span-2 space-y-1">
        <Label htmlFor="quiz-hide-ranking" className={ADMIN_UI.label}>
          Ultime N senza classifica
        </Label>
        {hideRankingReadOnly || !onHideRankingLastNChange ? (
          <p
            id="quiz-hide-ranking"
            className={cn(
              ADMIN_UI.stat,
              "flex h-9 items-center rounded-lg border-2 border-white/25 bg-white/10 px-2 py-1.5",
            )}
          >
            {hideRankingLastN}
          </p>
        ) : (
          <input
            id="quiz-hide-ranking"
            type="number"
            min={MIN_HIDE_RANKING_LAST_N}
            max={MAX_HIDE_RANKING_LAST_N}
            value={hideRankingLastN}
            disabled={disabled}
            onChange={(event) => {
              const parsed = Number(event.target.value);
              if (!Number.isFinite(parsed)) return;
              onHideRankingLastNChange(
                Math.max(
                  MIN_HIDE_RANKING_LAST_N,
                  Math.min(MAX_HIDE_RANKING_LAST_N, Math.round(parsed)),
                ),
              );
            }}
            className={cn(ADMIN_UI.input, "w-full tabular-nums")}
          />
        )}
        <p className={ADMIN_UI.caption}>
          Le ultime {hideRankingLastN} domande non mostrano la classifica
        </p>
      </div>
    </div>
  );
}

export {
  MIN_QUESTION_SECONDS,
  MAX_QUESTION_SECONDS,
  MIN_HIDE_RANKING_LAST_N,
  MAX_HIDE_RANKING_LAST_N,
};
