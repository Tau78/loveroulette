"use client";

import { useCallback, useEffect, useState } from "react";
import type { VotingSessionState } from "@/lib/musicpro/voting";
import { FINALS_COPY } from "@/lib/game/late-game-copy";
import { cn } from "@/lib/utils";

interface VotingPlayerProps {
  eventSlug: string;
  participantId: string;
  session: VotingSessionState;
}

export function VotingPlayer({
  eventSlug,
  participantId,
  session,
}: VotingPlayerProps) {
  const [selectedPairId, setSelectedPairId] = useState<string | null>(
    session.ballots[participantId] ?? null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSelectedPairId(session.ballots[participantId] ?? null);
  }, [session.ballots, participantId, session.updatedAt]);

  const submitVote = useCallback(
    async (pairId: string) => {
      if (submitting || session.status !== "open") return;

      setSubmitting(true);
      setError(null);
      setSelectedPairId(pairId);

      try {
        const res = await fetch(
          `/api/events/${encodeURIComponent(eventSlug)}/voting`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "vote",
              participantId,
              pairId,
            }),
          },
        );

        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;

        if (!res.ok) {
          throw new Error(data?.error ?? "Voto non registrato.");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Errore di rete.");
        setSelectedPairId(session.ballots[participantId] ?? null);
      } finally {
        setSubmitting(false);
      }
    },
    [eventSlug, participantId, session.ballots, session.status, submitting],
  );

  if (session.status === "closed") {
    return (
      <div className="flex flex-col gap-4 rounded-2xl border border-primary/30 bg-black/70 p-6 text-left backdrop-blur-md">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary/90">
          {FINALS_COPY.votingCardKicker}
        </p>
        <p className="font-display text-2xl font-bold text-white">
          {FINALS_COPY.playerVoteClosed}
        </p>
        <p className="text-sm text-white/65">
          Guarda gli schermi in sala per il verdetto finale.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[min(72vh,640px)] flex-col gap-5">
      <div className="space-y-1 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-primary/90">
          {FINALS_COPY.votingCardKicker}
        </p>
        <p className="font-display text-xl font-bold leading-snug text-white">
          {FINALS_COPY.votingCardTitle}
        </p>
      </div>

      <div className="flex flex-1 flex-col gap-4">
        {session.finalists.map((finalist, index) => {
          const selected = selectedPairId === finalist.pairId;
          return (
            <button
              key={finalist.pairId}
              type="button"
              disabled={submitting}
              onClick={() => void submitVote(finalist.pairId)}
              className={cn(
                "relative flex min-h-[5.5rem] flex-1 flex-col items-center justify-center rounded-2xl border-2 px-5 py-6 text-center transition-all active:scale-[0.98]",
                "shadow-[0_12px_40px_rgba(0,0,0,0.45)]",
                selected
                  ? "border-primary bg-gradient-to-b from-primary/35 via-primary/20 to-black/60 ring-2 ring-primary/60"
                  : "border-white/20 bg-black/55 hover:border-primary/45 hover:bg-black/70",
              )}
            >
              <span className="mb-2 text-[11px] font-bold uppercase tracking-[0.35em] text-primary/90">
                Coppia {index + 1}
              </span>
              <span className="font-display text-2xl font-bold leading-tight text-white">
                {finalist.maleNick}
              </span>
              <span className="font-display text-lg text-primary">&</span>
              <span className="font-display text-2xl font-bold leading-tight text-white">
                {finalist.femaleNick}
              </span>
              {selected ? (
                <span className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                  Voto inviato ✓
                </span>
              ) : (
                <span className="mt-2 text-xs uppercase tracking-[0.18em] text-white/50">
                  Tocca per votare
                </span>
              )}
            </button>
          );
        })}
      </div>

      {error ? (
        <p className="text-center text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
