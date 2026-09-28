"use client";

import { Label } from "@/components/ui/label";
import {
  LOVE_ROULETTE_AGE_BANDS,
  LOVE_ROULETTE_GENDERS,
  LOVE_ROULETTE_SEEKING,
  ageBandLabel,
  genderChoiceLabel,
  seekingChoiceLabel,
  type LoveRouletteAgeBand,
  type LoveRouletteGender,
  type LoveRouletteSeeking,
} from "@/lib/player/identity";
import { cn } from "@/lib/utils";

interface PlayerIdentityFieldsProps {
  gender: LoveRouletteGender | null;
  seeking: LoveRouletteSeeking | null;
  ageBand: LoveRouletteAgeBand | null;
  onGender: (value: LoveRouletteGender) => void;
  onSeeking: (value: LoveRouletteSeeking) => void;
  onAgeBand: (value: LoveRouletteAgeBand) => void;
  disabled?: boolean;
  invalid?: boolean;
}

const CHIP =
  "min-h-12 rounded-lg border px-2 py-2 text-sm font-medium transition-all";

export function PlayerIdentityFields({
  gender,
  seeking,
  ageBand,
  onGender,
  onSeeking,
  onAgeBand,
  disabled,
  invalid,
}: PlayerIdentityFieldsProps) {
  return (
    <div className="space-y-4">
      <ChoiceRow
        label="Chi sei"
        hint="Come ti presenti in sala."
        invalid={invalid && !gender}
        disabled={disabled}
        columns={3}
        options={LOVE_ROULETTE_GENDERS.map((value) => ({
          value,
          label: genderChoiceLabel(value),
          selected: gender === value,
          onSelect: () => onGender(value),
        }))}
      />
      <ChoiceRow
        label="Chi cerchi"
        hint="Con chi vuoi essere abbinato."
        invalid={invalid && !seeking}
        disabled={disabled}
        columns={3}
        options={LOVE_ROULETTE_SEEKING.map((value) => ({
          value,
          label: seekingChoiceLabel(value),
          selected: seeking === value,
          onSelect: () => onSeeking(value),
        }))}
      />
      <ChoiceRow
        label="Quanti anni hai"
        hint="Una fascia, non la data di nascita."
        invalid={invalid && !ageBand}
        disabled={disabled}
        columns={4}
        options={LOVE_ROULETTE_AGE_BANDS.map((value) => ({
          value,
          label: ageBandLabel(value),
          selected: ageBand === value,
          onSelect: () => onAgeBand(value),
        }))}
      />
    </div>
  );
}

function ChoiceRow({
  label,
  hint,
  options,
  columns,
  disabled,
  invalid,
}: {
  label: string;
  hint: string;
  columns: 3 | 4;
  disabled?: boolean;
  invalid?: boolean;
  options: Array<{
    value: string;
    label: string;
    selected: boolean;
    onSelect: () => void;
  }>;
}) {
  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <Label>{label}</Label>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <div
        className={cn(
          "grid gap-2",
          columns === 4 ? "grid-cols-4" : "grid-cols-3",
        )}
      >
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            disabled={disabled}
            onClick={option.onSelect}
            className={cn(
              CHIP,
              option.selected
                ? "border-primary bg-primary/15 text-primary shadow-[0_0_20px_rgba(236,72,153,0.25)]"
                : "border-border bg-background/50 hover:bg-muted/50",
              invalid && "border-destructive",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
