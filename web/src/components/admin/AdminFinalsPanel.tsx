"use client";

import { useCallback, useState } from "react";
import { Trophy } from "lucide-react";
import {
  isInvalidAnimatorPinError,
  postVotingAction,
} from "@/lib/admin/animator-api";
import { useFinalsShowSync } from "@/hooks/useFinalsShowSync";
import type { FinalsShowState } from "@/lib/musicpro/finals-show";
import type { VotingMetadata, VotingSessionState } from "@/lib/musicpro/voting";
import { CHALLENGE_LABELS, type ChallengeId, type EventState } from "@/lib/types";
import { AdminChallengeRegia } from "@/components/admin/AdminChallengeRegia";
import { AdminPanelShell } from "@/components/admin/AdminDeckPanel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SHOW_PHASE_LABELS: Record<FinalsShowState["phase"], string> = {
  intro: "Slide: Le prove finali",
  idle: "In attesa prova",
  challenge_intro: "Presentazione prova",
  couple_reveal: "Coppia in scena",
  voting_prep: "Preparazione votazione",
  voting: "Votazione",
  results: "Risultati prova",
  tie_blocked: "Parimerito — replica",
  winner_spectacle: "Animazione vincitore",
  winner_podium: "Podio vincitori",
};

interface AdminFinalsPanelProps {
  eventCode: string;
  animatorPin: string | null;
  disabled?: boolean;
  finalsShow: FinalsShowState | null;
  voting: VotingMetadata;
  onInvalidPin?: () => void;
  onFinalsChange?: (payload: {
    show?: FinalsShowState | null;
    session?: VotingSessionState | null;
    runtimeState?: EventState;
  }) => void;
  variant?: "card" | "deck";
}

export function AdminFinalsPanel({
  eventCode,
  animatorPin,
  disabled = false,
  finalsShow,
  voting,
  onInvalidPin,
  onFinalsChange,
  variant = "deck",
}: AdminFinalsPanelProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { remaining } = useFinalsShowSync({
    eventSlug: eventCode,
    show: finalsShow,
    enabled: Boolean(finalsShow) && !disabled,
    driveTicks: true,
    onTick: (data) => onFinalsChange?.(data),
  });

  const runAction = useCallback(
    async (
      action:
        | "start_challenge"
        | "advance"
        | "proclaim_winner"
        | "simulate_bot_votes",
      challengeId?: ChallengeId,
    ) => {
      if (disabled || busy) return;
      setBusy(true);
      setError(null);
      try {
        const response =
          action === "start_challenge" && challengeId
            ? await postVotingAction(
                eventCode,
                { action: "start_challenge", challengeId },
                animatorPin,
              )
            : action === "advance"
              ? await postVotingAction(
                  eventCode,
                  { action: "advance" },
                  animatorPin,
                )
              : action === "simulate_bot_votes"
                ? await postVotingAction(
                    eventCode,
                    { action: "simulate_bot_votes" },
                    animatorPin,
                  )
              : await postVotingAction(
                  eventCode,
                  { action: "proclaim_winner" },
                  animatorPin,
                );
        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as {
            error?: string;
          } | null;
          const message = payload?.error ?? "Azione non riuscita.";
          if (response.status === 401 || isInvalidAnimatorPinError(message)) {
            onInvalidPin?.();
          }
          throw new Error(message);
        }
        const data = (await response.json()) as {
          show?: FinalsShowState | null;
          session?: VotingSessionState | null;
          runtimeState?: EventState;
          tie?: boolean;
        };
        onFinalsChange?.({
          show: data.show,
          session: data.session,
          runtimeState: data.runtimeState,
        });
        if (action === "simulate_bot_votes") {
          const votesSubmitted = (data as { votesSubmitted?: number }).votesSubmitted ?? 0;
          if (votesSubmitted > 0) {
            setError(null);
          }
        }
        if (data.tie) {
          setError(
            "Parimerito al primo posto — avvia una prova di replica senza svelare i nomi.",
          );
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Errore di rete.");
      } finally {
        setBusy(false);
      }
    },
    [animatorPin, busy, disabled, eventCode, onFinalsChange, onInvalidPin],
  );

  const phase = finalsShow?.phase;
  const completed = new Set(finalsShow?.completedChallenges ?? []);

  return (
    <AdminPanelShell
      variant={variant}
      title="Finali"
      cardTitle="Finali — prove e votazioni"
      subtitle={
        phase
          ? `${SHOW_PHASE_LABELS[phase]}${
              phase === "voting_prep" ||
              phase === "voting" ||
              phase === "winner_spectacle"
                ? ` · ${remaining}s`
                : ""
            }`
          : "…"
      }
      accent
      collapsible={false}
    >
      {finalsShow?.phase === "tie_blocked" ? (
        <p className="text-[10px] text-amber-400 font-medium rounded border border-amber-500/30 bg-amber-500/10 px-2 py-1">
          Parimerito — replica
        </p>
      ) : null}

        {finalsShow?.challengeId &&
        finalsShow.phase !== "intro" &&
        finalsShow.phase !== "winner_spectacle" &&
        finalsShow.phase !== "winner_podium" ? (
          <AdminChallengeRegia
            eventCode={eventCode}
            challengeId={finalsShow.challengeId as ChallengeId}
            disabled={disabled || busy}
          />
        ) : null}

        <div className="space-y-2">
          {(Object.keys(CHALLENGE_LABELS) as ChallengeId[]).map((id) => {
            const done = completed.has(id);
            const active = finalsShow?.challengeId === id;
            return (
              <div
                key={id}
                className={cn(
                  "flex items-center gap-2 rounded-md border px-2.5 py-1.5",
                  done
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : "border-border/40",
                )}
              >
                <span
                  className={cn(
                    "flex-1 text-xs",
                    done && "text-emerald-700 dark:text-emerald-400",
                  )}
                >
                  {CHALLENGE_LABELS[id]}
                  {done ? " ✓" : ""}
                </span>
                <Button
                  variant={active ? "default" : done ? "secondary" : "outline"}
                  size="xs"
                  disabled={
                    disabled ||
                    busy ||
                    (finalsShow != null &&
                      !["intro", "idle", "results", "tie_blocked"].includes(
                        finalsShow.phase,
                      ) &&
                      !active)
                  }
                  onClick={() => void runAction("start_challenge", id)}
                >
                  {done ? "Replica" : "Avvia"}
                </Button>
              </div>
            );
          })}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full mt-1 h-8 text-[10px]"
          disabled={
            disabled ||
            busy ||
            finalsShow?.phase === "voting_prep" ||
            finalsShow?.phase === "voting" ||
            finalsShow?.phase === "winner_spectacle"
          }
          onClick={() => void runAction("proclaim_winner")}
        >
          <Trophy className="size-3" />
          Vincitore
        </Button>

        {error ? <p className="text-[10px] text-destructive">{error}</p> : null}
      </AdminPanelShell>
  );
}
