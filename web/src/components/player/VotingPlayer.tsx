"use client";

import { useCallback, useEffect, useState } from "react";
import type { VotingSessionState } from "@/lib/musicpro/voting";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const CARD_CLASS =
  "bg-card/85 backdrop-blur-md border-primary/25 shadow-[0_0_32px_rgba(236,72,153,0.12)]";
const CARD_ACTIVE =
  "border-primary/45 shadow-[0_0_40px_rgba(236,72,153,0.28)] ring-1 ring-primary/20";

interface VotingPlayerProps {
  eventSlug: string;
  participantId: string;
  session: VotingSessionState;
}

function coupleLabel(finalist: VotingSessionState["finalists"][number]): string {
  return `${finalist.maleNick} & ${finalist.femaleNick}`;
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
      <Card className={cn(CARD_CLASS, CARD_ACTIVE, "text-left")}>
        <CardHeader className="pb-2">
          <CardDescription>Votazione chiusa</CardDescription>
          <CardTitle className="text-lg">Grazie per il voto!</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Segui gli schermi in sala per i risultati.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(CARD_CLASS, CARD_ACTIVE, "text-left")}>
      <CardHeader className="pb-2">
        <CardDescription>Vota la coppia preferita</CardDescription>
        <CardTitle className="text-lg">Chi vince questa prova?</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {session.finalists.map((finalist, index) => {
          const selected = selectedPairId === finalist.pairId;
          return (
            <Button
              key={finalist.pairId}
              type="button"
              variant={selected ? "default" : "outline"}
              className={cn(
                "w-full h-auto py-3 justify-start text-left",
                selected && "ring-2 ring-primary/50",
              )}
              disabled={submitting}
              onClick={() => void submitVote(finalist.pairId)}
            >
              <span className="font-semibold mr-2">{index + 1}.</span>
              {coupleLabel(finalist)}
            </Button>
          );
        })}
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : selectedPairId ? (
          <p className="text-xs text-muted-foreground">Voto registrato ✓</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
