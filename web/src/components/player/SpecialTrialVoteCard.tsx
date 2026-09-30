"use client";

import { useCallback, useEffect, useState } from "react";
import {
  formatSpecialTrialClock,
  specialTrialRemainingSeconds,
  type SpecialTrialState,
} from "@/lib/musicpro/special-trial";

interface SpecialTrialVoteCardProps {
  eventSlug: string;
  participantId: string;
  trial: SpecialTrialState;
}

/** Voto sala durante prova speciale (running / closing). */
export function SpecialTrialVoteCard({
  eventSlug,
  participantId,
  trial,
}: SpecialTrialVoteCardProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [picked, setPicked] = useState<string | null>(
    () => trial.ballots[participantId] ?? null,
  );
  const [remaining, setRemaining] = useState(() =>
    specialTrialRemainingSeconds(trial),
  );

  useEffect(() => {
    setPicked(trial.ballots[participantId] ?? null);
  }, [trial.ballots, participantId, trial.updatedAt]);

  useEffect(() => {
    if (trial.status !== "running") {
      setRemaining(0);
      return;
    }
    const id = window.setInterval(() => {
      setRemaining(specialTrialRemainingSeconds(trial));
    }, 400);
    return () => window.clearInterval(id);
  }, [trial]);

  const vote = useCallback(
    async (choiceId: string) => {
      if (busy) return;
      setBusy(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/events/${encodeURIComponent(eventSlug)}/special-trial`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "vote",
              voterId: participantId,
              choiceId,
            }),
          },
        );
        const data = (await res.json().catch(() => null)) as {
          error?: string;
          specialTrial?: SpecialTrialState | null;
        } | null;
        if (!res.ok) {
          throw new Error(data?.error ?? "Voto non riuscito.");
        }
        setPicked(choiceId);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Errore di rete.");
      } finally {
        setBusy(false);
      }
    },
    [busy, eventSlug, participantId],
  );

  if (trial.status !== "running" && trial.status !== "closing") {
    return null;
  }

  return (
    <div className="mb-3 rounded-2xl border border-primary/35 bg-black/45 px-4 py-3 backdrop-blur-md">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">
          Vota la prova
        </p>
        {trial.status === "running" ? (
          <p className="font-display text-lg font-bold tabular-nums text-white">
            {formatSpecialTrialClock(remaining)}
          </p>
        ) : (
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/60">
            Fine prova
          </p>
        )}
      </div>
      <div className="mt-3 grid gap-2">
        {trial.participants.map((p) => {
          const on = picked === p.id;
          return (
            <button
              key={p.id}
              type="button"
              disabled={busy}
              onClick={() => void vote(p.id)}
              className={
                on
                  ? "min-h-12 rounded-xl border-2 border-primary bg-primary/25 px-3 py-2 text-sm font-semibold uppercase text-white"
                  : "min-h-12 rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm font-semibold uppercase text-white/90"
              }
            >
              {p.nickname}
            </button>
          );
        })}
      </div>
      {error ? (
        <p className="mt-2 text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
