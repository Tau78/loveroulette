"use client";

import { useCallback, useState } from "react";
import { Trophy, Users } from "lucide-react";
import {
  isInvalidAnimatorPinError,
  postVotingAction,
} from "@/lib/admin/animator-api";
import { useFinalsShowSync } from "@/hooks/useFinalsShowSync";
import type { FinalsShowState } from "@/lib/musicpro/finals-show";
import type { VotingMetadata, VotingSessionState } from "@/lib/musicpro/voting";
import { CHALLENGE_LABELS, type ChallengeId, type EventState } from "@/lib/types";
import { AdminChallengeRegia } from "@/components/admin/AdminChallengeRegia";
import { AdminFinalsAdvanceButton } from "@/components/admin/AdminFinalsAdvanceButton";
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

  const { remaining, tickServer } = useFinalsShowSync({
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
    <>
      <AdminFinalsAdvanceButton
        finalsShow={finalsShow}
        remaining={remaining}
        disabled={disabled}
        busy={busy}
        onAdvance={() => {
          if (
            finalsShow &&
            (finalsShow.phase === "voting_prep" ||
              finalsShow.phase === "voting" ||
              finalsShow.phase === "winner_spectacle") &&
            remaining <= 0
          ) {
            void tickServer();
            return;
          }
          void runAction("advance");
        }}
      />

      <AdminPanelShell
        variant={variant}
        title="Finali — prove"
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
            : "Caricamento…"
        }
        accent
      >
        {finalsShow?.phase === "tie_blocked" ? (
          <p className="text-xs text-amber-500 font-medium rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-2">
            Parimerito al 1° posto. Scegli una prova già svolta e ripetila per
            sbloccare il vincitore — i nomi restano nascosti finché non si
            risolve.
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
          className="w-full mt-1"
          disabled={
            disabled ||
            busy ||
            finalsShow?.phase === "voting_prep" ||
            finalsShow?.phase === "voting" ||
            finalsShow?.phase === "winner_spectacle"
          }
          onClick={() => void runAction("proclaim_winner")}
        >
          <Trophy className="size-3.5" />
          Proclama vincitore
        </Button>

        {error ? <p className="text-xs text-destructive">{error}</p> : null}
        {voting.current?.status === "open" ? (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground tabular-nums">
              Voti in corso · {remaining}s ·{" "}
              {Object.values(voting.current.counts).reduce((a, b) => a + b, 0)}{" "}
              voti registrati
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full h-8 text-xs"
              disabled={disabled || busy}
              onClick={() => void runAction("simulate_bot_votes")}
            >
              <Users className="size-3.5" />
              Voti bot (audience)
            </Button>
          </div>
        ) : null}
      </AdminPanelShell>
    </>
  );
}
