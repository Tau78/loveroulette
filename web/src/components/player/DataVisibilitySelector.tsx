"use client";

import type { ParticipantDataVisibility } from "@/lib/musicpro/types";
import { DATA_VISIBILITY_OPTIONS } from "@/lib/player/data-visibility";
import { cn } from "@/lib/utils";

interface DataVisibilitySelectorProps {
  value: ParticipantDataVisibility;
  onChange: (value: ParticipantDataVisibility) => void;
  disabled?: boolean;
  invalid?: boolean;
  className?: string;
}

export function DataVisibilitySelector({
  value,
  onChange,
  disabled = false,
  invalid = false,
  className,
}: DataVisibilitySelectorProps) {
  return (
    <fieldset
      className={cn("space-y-2", className)}
      aria-invalid={invalid || undefined}
    >
      <legend className="text-sm font-medium leading-none">
        Visibilità dati personali
      </legend>
      <div className="space-y-2" role="radiogroup" aria-required="true">
        {DATA_VISIBILITY_OPTIONS.map((option) => {
          const selected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={disabled}
              onClick={() => onChange(option.value)}
              className={cn(
                "flex w-full min-h-12 flex-col items-start rounded-lg border px-4 py-3 text-left transition-all",
                selected
                  ? "border-primary bg-primary/15 text-primary shadow-[0_0_20px_rgba(236,72,153,0.25)]"
                  : "border-border bg-background/50 hover:bg-muted/50",
                invalid && !selected && "border-destructive/40",
                disabled && "cursor-not-allowed opacity-60",
              )}
            >
              <span className="font-medium">{option.label}</span>
              <span
                className={cn(
                  "text-xs leading-relaxed",
                  selected ? "text-primary/80" : "text-muted-foreground",
                )}
              >
                {option.description}
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
