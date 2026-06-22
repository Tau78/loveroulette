"use client";

import { ChevronRight } from "lucide-react";
import type { FinalsShowState } from "@/lib/musicpro/finals-show";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function finalsAdvanceState(
  show: FinalsShowState | null,
  remaining: number,
): { enabled: boolean; hint: string | null } {
  if (!show) {
    return { enabled: false, hint: "Caricamento finali…" };
  }

  switch (show.phase) {
    case "voting_prep":
      return {
        enabled: remaining <= 0,
        hint:
          remaining > 0
            ? `Preparazione votazione · ${remaining}s`
            : "Tap AVANTI per aprire la votazione",
      };
    case "voting":
      return {
        enabled: remaining <= 0,
        hint:
          remaining > 0
            ? `Countdown votazione · ${remaining}s`
            : "Tap AVANTI per chiudere la votazione",
      };
    case "winner_spectacle":
      return {
        enabled: remaining <= 0,
        hint:
          remaining > 0
            ? `Animazione vincitore · ${remaining}s`
            : "Tap AVANTI per il podio",
      };
    case "tie_blocked":
      return {
        enabled: false,
        hint: "Parimerito — avvia una prova di replica",
      };
    case "idle":
      return { enabled: false, hint: "Avvia una prova qui sotto" };
    case "winner_podium":
      return { enabled: false, hint: "Podio vincitori in corso" };
    default:
      return { enabled: true, hint: null };
  }
}

interface AdminFinalsAdvanceButtonProps {
  finalsShow: FinalsShowState | null;
  remaining: number;
  disabled?: boolean;
  busy?: boolean;
  onAdvance: () => void;
  className?: string;
}

/** Pulsante AVANTI sempre visibile — disabilitato solo durante countdown/animazioni. */
export function AdminFinalsAdvanceButton({
  finalsShow,
  remaining,
  disabled = false,
  busy = false,
  onAdvance,
  className,
}: AdminFinalsAdvanceButtonProps) {
  const { enabled, hint } = finalsAdvanceState(finalsShow, remaining);
  const isDisabled = disabled || busy || !enabled;

  return (
    <div
      className={cn(
        "sticky top-0 z-20 rounded-xl border-2 border-primary/40 bg-card/95 p-2 shadow-[0_8px_32px_rgba(236,72,153,0.22)] backdrop-blur-sm",
        className,
      )}
    >
      <Button
        type="button"
        size="lg"
        className={cn(
          "h-16 w-full text-lg font-bold tracking-[0.12em] uppercase",
          "shadow-[0_0_28px_rgba(236,72,153,0.35)]",
          isDisabled && "opacity-55 shadow-none",
        )}
        disabled={isDisabled}
        onClick={onAdvance}
      >
        <ChevronRight className="size-5 stroke-[2.5]" />
        AVANTI
      </Button>
      {hint ? (
        <p className="mt-1.5 text-center text-[11px] text-muted-foreground tabular-nums">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
