"use client";

import { useCallback, useState } from "react";
import {
  isInvalidAnimatorPinError,
  postVotingAction,
} from "@/lib/admin/animator-api";
import { useFinalsShowSync } from "@/hooks/useFinalsShowSync";
import type { FinalsShowState } from "@/lib/musicpro/finals-show";
import {
  ANIMATOR_BALLOT_KEY,
  type VotingMetadata,
  type VotingSessionState,
} from "@/lib/musicpro/voting";
import { CHALLENGE_LABELS, type ChallengeId, type EventState } from "@/lib/types";
import { cn } from "@/lib/utils";

const PHASE_LABELS: Record<FinalsShowState["phase"], string> = {
  intro: "Slide prove finali",
  idle: "Scegli una prova",
  challenge_intro: "Slide prova a schermo",
  couple_reveal: "Coppia in scena",
  voting_prep: "Preparazione voto",
  voting: "Votazione aperta",
  results: "Risultati prova",
  tie_blocked: "Parimerito — replica",
  winner_spectacle: "Vincitore",
  winner_podium: "Podio",
};

interface BoardFinalsCommandProps {
  eventCode: string;
  pin: string | null;
  disabled?: boolean;
  finalsShow: FinalsShowState | null;
  voting: VotingMetadata;
  onInvalidPin?: () => void;
  onFinalsChange?: (payload: {
    show?: FinalsShowState | null;
    session?: VotingSessionState | null;
    runtimeState?: EventState;
  }) => void;
}

export function BoardFinalsCommand({
  eventCode,
  pin,
  disabled = false,
  finalsShow,
  voting,
  onInvalidPin,
  onFinalsChange,
}: BoardFinalsCommandProps) {
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
        | "animator_vote"
        | "simulate_bot_votes",
      payload?: { challengeId?: ChallengeId; pairId?: string },
    ) => {
      if (disabled || busy) return;
      setBusy(true);
      setError(null);
      try {
        let response: Response;
        if (action === "start_challenge" && payload?.challengeId) {
          response = await postVotingAction(
            eventCode,
            { action: "start_challenge", challengeId: payload.challengeId },
            pin,
          );
        } else if (action === "animator_vote" && payload?.pairId) {
          response = await postVotingAction(
            eventCode,
            { action: "animator_vote", pairId: payload.pairId },
            pin,
          );
        } else if (action === "advance") {
          response = await postVotingAction(
            eventCode,
            { action: "advance" },
            pin,
          );
        } else if (action === "simulate_bot_votes") {
          response = await postVotingAction(
            eventCode,
            { action: "simulate_bot_votes" },
            pin,
          );
        } else {
          response = await postVotingAction(
            eventCode,
            { action: "proclaim_winner" },
            pin,
          );
        }

        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as {
            error?: string;
          } | null;
          const message = body?.error ?? "Azione non riuscita.";
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

        if (action === "animator_vote") {
          onFinalsChange?.({
            session: data.session ?? null,
            runtimeState: data.runtimeState,
          });
        } else {
          onFinalsChange?.({
            show: data.show,
            session: data.session,
            runtimeState: data.runtimeState,
          });
        }

        if (data.tie) {
          setError("Parimerito — avvia una prova di replica.");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Errore di rete.");
      } finally {
        setBusy(false);
      }
    },
    [busy, disabled, eventCode, onFinalsChange, onInvalidPin, pin],
  );

  const phase = finalsShow?.phase;
  const completed = new Set(finalsShow?.completedChallenges ?? []);
  const session = voting.current;
  const votingOpen = session?.status === "open";
  const finalists =
    session?.finalists?.length
      ? session.finalists
      : (finalsShow?.finalists ?? []);
  const animatorPairId =
    session?.animatorPairId ?? session?.ballots?.[ANIMATOR_BALLOT_KEY] ?? null;
  const canPickChallenge =
    !finalsShow ||
    ["intro", "idle", "results", "tie_blocked"].includes(finalsShow.phase);
  const showCouples =
    Boolean(finalists.length) &&
    (votingOpen ||
      phase === "voting_prep" ||
      phase === "voting" ||
      phase === "couple_reveal" ||
      phase === "results");

  return (
    <div className="casa-board-prove casa-board-finals-cmd">
      <p className="casa-board-prove-hint">
        {phase ? PHASE_LABELS[phase] : "Finali"}
        {phase === "voting_prep" ||
        phase === "voting" ||
        phase === "winner_spectacle"
          ? ` · ${remaining}s`
          : ""}
        {finalsShow?.challengeId
          ? ` · ${CHALLENGE_LABELS[finalsShow.challengeId as ChallengeId]}`
          : ""}
      </p>

      <p className="casa-board-prove-label">Prove</p>
      <div className="casa-board-finals-challenges">
        {(Object.keys(CHALLENGE_LABELS) as ChallengeId[]).map((id) => {
          const done = completed.has(id);
          const active = finalsShow?.challengeId === id;
          return (
            <button
              key={id}
              type="button"
              className={cn(
                "casa-board-prove-type",
                active && "casa-board-finals-challenge-on",
                done && "casa-board-finals-challenge-done",
              )}
              disabled={disabled || busy || (!canPickChallenge && !active)}
              title={
                done
                  ? "Replica — dichiara di nuovo la prova a schermo"
                  : "Avvia e dichiara la prova a schermo"
              }
              onClick={() =>
                void runAction("start_challenge", { challengeId: id })
              }
            >
              {CHALLENGE_LABELS[id]}
              {done ? " ✓" : ""}
            </button>
          );
        })}
      </div>

      {showCouples ? (
        <>
          <p className="casa-board-prove-label">
            {votingOpen
              ? "Voto animatore — tap una coppia"
              : "Coppie in gara"}
          </p>
          <div className="casa-board-finals-couples">
            {finalists.map((f) => {
              const votes = session?.counts?.[f.pairId] ?? 0;
              const picked = animatorPairId === f.pairId;
              return (
                <button
                  key={f.pairId}
                  type="button"
                  className={cn(
                    "casa-board-finals-couple",
                    picked && "casa-board-finals-couple-on",
                  )}
                  disabled={disabled || busy || !votingOpen}
                  title={
                    votingOpen
                      ? `Vota ${f.maleNick} + ${f.femaleNick}`
                      : `${f.maleNick} + ${f.femaleNick}`
                  }
                  onClick={() =>
                    void runAction("animator_vote", { pairId: f.pairId })
                  }
                >
                  <strong>
                    {f.maleNick} · {f.femaleNick}
                  </strong>
                  <span>
                    {votes} voti
                    {picked ? " · tuo" : ""}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <p className="casa-board-prove-hint">
          Scegli una prova: a schermo parte la slide di dichiarazione.
        </p>
      )}

      <div className="casa-board-finals-actions">
        <button
          type="button"
          className="casa-board-cmd"
          disabled={
            disabled ||
            busy ||
            !finalsShow ||
            phase === "voting_prep" ||
            phase === "voting" ||
            phase === "winner_spectacle" ||
            phase === "tie_blocked"
          }
          onClick={() => void runAction("advance")}
        >
          Avanti
        </button>
        <button
          type="button"
          className="casa-board-cmd"
          disabled={disabled || busy || !votingOpen}
          title="Simula voti bot (demo)"
          onClick={() => void runAction("simulate_bot_votes")}
        >
          Voti demo
        </button>
        <button
          type="button"
          className="casa-board-cmd casa-board-cmd-rank"
          disabled={
            disabled ||
            busy ||
            phase === "voting_prep" ||
            phase === "voting" ||
            phase === "winner_spectacle"
          }
          onClick={() => void runAction("proclaim_winner")}
        >
          Vincitore
        </button>
      </div>

      {error ? <p className="casa-board-cue-err">{error}</p> : null}
    </div>
  );
}
