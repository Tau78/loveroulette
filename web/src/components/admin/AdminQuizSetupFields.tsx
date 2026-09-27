"use client";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ADMIN_UI } from "@/lib/admin/admin-ui-tokens";
import {
  DEFAULT_HIDE_RANKING_LAST_N,
  DEFAULT_QUIZ_QUESTION_COUNT,
  DEFAULT_RANKING_EVERY_N,
} from "@/lib/musicpro/quiz-display";

const MIN_QUESTION_SECONDS = 5;
const MAX_QUESTION_SECONDS = 120;
const MIN_HIDE_RANKING_LAST_N = 0;
const MAX_HIDE_RANKING_LAST_N = 30;
const MIN_RANKING_EVERY_N = 0;
const MAX_RANKING_EVERY_N = 30;

const FIELD =
  "h-8 w-14 shrink-0 rounded-md border border-white/20 bg-black/40 px-1.5 text-center text-sm tabular-nums text-foreground";

interface AdminQuizSetupFieldsProps {
  availableQuestionCount: number;
  questionCount: number;
  questionSeconds: string;
  onQuestionCountChange: (value: number) => void;
  onQuestionSecondsChange: (value: string) => void;
  onQuestionSecondsBlur?: () => void;
  hideRankingLastN?: number;
  onHideRankingLastNChange?: (value: number) => void;
  rankingEveryN?: number;
  onRankingEveryNChange?: (value: number) => void;
  hideRankingReadOnly?: boolean;
  rankingEveryReadOnly?: boolean;
  questionCountReadOnly?: boolean;
  disabled?: boolean;
  className?: string;
  /** Titolo sezione (default GENERA PROSSIMA MANCHE). */
  title?: string;
}

function clampInt(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function formatRankingPreview(nums: number[]): string {
  if (nums.length === 0) return "";
  if (nums.length === 1) return String(nums[0]);
  if (nums.length === 2) return `${nums[0]} e ${nums[1]}`;
  return `${nums.slice(0, -1).join(", ")} e ${nums[nums.length - 1]}`;
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
  rankingEveryN = DEFAULT_RANKING_EVERY_N,
  onRankingEveryNChange,
  hideRankingReadOnly = false,
  rankingEveryReadOnly = false,
  questionCountReadOnly = false,
  disabled = false,
  className,
  title = "Genera prossima manche",
}: AdminQuizSetupFieldsProps) {
  const maxQuestions = Math.max(1, availableQuestionCount);
  const rankingPreview =
    rankingEveryN > 0 && questionCount > rankingEveryN
      ? Array.from(
          { length: Math.floor((questionCount - 1) / rankingEveryN) },
          (_, i) => (i + 1) * rankingEveryN,
        ).filter(
          (n) => n < questionCount && n <= questionCount - hideRankingLastN,
        )
      : [];

  return (
    <div className={cn("casa-regia-block space-y-1", className)}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary/90">
        {title}
      </p>
      <div className="flex flex-wrap items-end gap-x-3 gap-y-1.5">
        <div className="space-y-0.5">
          <Label htmlFor="quiz-question-count" className={ADMIN_UI.label}>
            N. domande
          </Label>
          {questionCountReadOnly ? (
            <p id="quiz-question-count" className={cn(FIELD, "flex items-center justify-center")}>
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
              className={cn(ADMIN_UI.select, FIELD, "w-16")}
            >
              {Array.from({ length: maxQuestions }, (_, index) => {
                const value = index + 1;
                return (
                  <option key={value} value={value}>
                    {value}
                    {value === DEFAULT_QUIZ_QUESTION_COUNT ? " ★" : ""}
                  </option>
                );
              })}
            </select>
          )}
        </div>

        <div className="space-y-0.5">
          <Label htmlFor="quiz-question-seconds" className={ADMIN_UI.label}>
            Risposte (s)
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
            className={FIELD}
          />
        </div>

        <div className="space-y-0.5">
          <Label htmlFor="quiz-hide-ranking" className={ADMIN_UI.label}>
            Al Buio
          </Label>
          {hideRankingReadOnly || !onHideRankingLastNChange ? (
            <p id="quiz-hide-ranking" className={cn(FIELD, "flex items-center justify-center")}>
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
                  clampInt(parsed, MIN_HIDE_RANKING_LAST_N, MAX_HIDE_RANKING_LAST_N),
                );
              }}
              className={FIELD}
            />
          )}
        </div>

        <div className="space-y-0.5">
          <Label htmlFor="quiz-ranking-every" className={ADMIN_UI.label}>
            Class. ogni
          </Label>
          {rankingEveryReadOnly || !onRankingEveryNChange ? (
            <p id="quiz-ranking-every" className={cn(FIELD, "flex items-center justify-center")}>
              {rankingEveryN}
            </p>
          ) : (
            <input
              id="quiz-ranking-every"
              type="number"
              min={MIN_RANKING_EVERY_N}
              max={MAX_RANKING_EVERY_N}
              value={rankingEveryN}
              disabled={disabled}
              onChange={(event) => {
                const parsed = Number(event.target.value);
                if (!Number.isFinite(parsed)) return;
                onRankingEveryNChange(
                  clampInt(parsed, MIN_RANKING_EVERY_N, MAX_RANKING_EVERY_N),
                );
              }}
              className={FIELD}
            />
          )}
        </div>
      </div>
      <p className={cn(ADMIN_UI.caption, "leading-snug")}>
        {rankingPreview.length > 0
          ? `Classifiche a domanda ${formatRankingPreview(rankingPreview)} · no all’ultima`
          : rankingEveryN <= 0
            ? "Nessuna classifica intermedia"
            : `Al Buio: ultime ${hideRankingLastN} · niente classifica sull’ultima`}
      </p>
    </div>
  );
}

export {
  MIN_QUESTION_SECONDS,
  MAX_QUESTION_SECONDS,
  MIN_HIDE_RANKING_LAST_N,
  MAX_HIDE_RANKING_LAST_N,
  MIN_RANKING_EVERY_N,
  MAX_RANKING_EVERY_N,
};
