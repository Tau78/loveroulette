"use client";

import { Pencil } from "lucide-react";
import {
  MAX_QUESTION_SECONDS,
  MIN_QUESTION_SECONDS,
} from "@/components/admin/AdminQuizSetupFields";
import { AdminButton } from "@/components/admin/AdminButton";
import { ADMIN_UI } from "@/lib/admin/admin-ui-tokens";
import { cn } from "@/lib/utils";

interface AdminMancheSetupProps {
  availableQuestionCount: number;
  questionCount: number;
  questionSeconds: number;
  onQuestionCountChange: (value: number) => void;
  onQuestionSecondsChange: (value: number) => void;
  editing: boolean;
  onToggleEdit: () => void;
  disabled?: boolean;
}

export function AdminMancheSetup({
  availableQuestionCount,
  questionCount,
  questionSeconds,
  onQuestionCountChange,
  onQuestionSecondsChange,
  editing,
  onToggleEdit,
  disabled = false,
}: AdminMancheSetupProps) {
  const maxQuestions = Math.max(1, availableQuestionCount);
  const summary = `${questionCount} domande · ${questionSeconds}s`;

  if (!editing) {
    return (
      <button
        type="button"
        onClick={onToggleEdit}
        disabled={disabled}
        title="Modifica manche"
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-lg border border-white/15 bg-black/25 px-2.5 h-9",
          "text-left transition-colors hover:bg-white/[0.06]",
        )}
      >
        <span className={cn(ADMIN_UI.stat, "truncate")}>{summary}</span>
        <Pencil className="size-3.5 shrink-0 text-white/70" aria-hidden />
      </button>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-2 gap-1.5">
        <label className="min-w-0 space-y-0.5">
          <span className={ADMIN_UI.label}>Domande</span>
          <select
            value={questionCount}
            disabled={disabled || availableQuestionCount <= 0}
            onChange={(event) => {
              const value = Number(event.target.value);
              if (Number.isFinite(value)) onQuestionCountChange(value);
            }}
            className={cn(ADMIN_UI.select, "w-full")}
            aria-label="Numero domande"
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
        </label>
        <label className="min-w-0 space-y-0.5">
          <span className={ADMIN_UI.label}>Secondi</span>
          <input
            type="number"
            min={MIN_QUESTION_SECONDS}
            max={MAX_QUESTION_SECONDS}
            value={questionSeconds}
            disabled={disabled}
            onChange={(event) => {
              const parsed = Number(event.target.value);
              if (Number.isFinite(parsed)) onQuestionSecondsChange(parsed);
            }}
            className={cn(ADMIN_UI.input, "w-full tabular-nums")}
            aria-label="Secondi per domanda"
          />
        </label>
      </div>
      <AdminButton
        type="button"
        variant="outline"
        className="w-full"
        disabled={disabled}
        onClick={onToggleEdit}
      >
        Fatto
      </AdminButton>
    </div>
  );
}
