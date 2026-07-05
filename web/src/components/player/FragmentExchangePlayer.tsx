"use client";

import { useMemo, useState } from "react";
import { Gift, Sparkles } from "lucide-react";
import type {
  FragmentDonationTarget,
  ParticipantFragmentView,
} from "@/lib/musicpro/fragment-exchange";
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
  "border-primary/25 bg-card/85 shadow-[0_0_32px_rgba(236,72,153,0.12)] backdrop-blur-md";

interface FragmentExchangePlayerProps {
  eventSlug: string;
  participantId: string;
  view: ParticipantFragmentView;
  targets: FragmentDonationTarget[];
  onDonated: () => Promise<void>;
}

function fragmentLabel(fragmentId: string, index: number): string {
  return `Frammento ${index + 1}`;
}

export function FragmentExchangePlayer({
  eventSlug,
  participantId,
  view,
  targets,
  onDonated,
}: FragmentExchangePlayerProps) {
  const [exchangeOpen, setExchangeOpen] = useState(false);
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [selectedFragmentId, setSelectedFragmentId] = useState<string | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedTarget = useMemo(
    () => targets.find((target) => target.id === selectedTargetId) ?? null,
    [selectedTargetId, targets],
  );

  const selectableFragments = useMemo(() => {
    if (!selectedTarget) return [];
    const missing = new Set(selectedTarget.missingFragmentIds);
    return view.donateableFragmentIds.filter((id) => missing.has(id));
  }, [selectedTarget, view.donateableFragmentIds]);

  async function handleDonate() {
    if (!selectedTargetId || !selectedFragmentId || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/events/${encodeURIComponent(eventSlug)}/fragments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "donate",
            fromParticipantId: participantId,
            toParticipantId: selectedTargetId,
            fragmentId: selectedFragmentId,
          }),
        },
      );

      const data = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!res.ok) {
        throw new Error(data?.error ?? "Scambio non riuscito.");
      }

      setExchangeOpen(false);
      setSelectedTargetId(null);
      setSelectedFragmentId(null);
      await onDonated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore di rete.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!view.enabled || view.total === 0) {
    return null;
  }

  const progressPercent =
    view.total > 0 ? Math.round((view.owned.length / view.total) * 100) : 0;

  return (
    <Card className={CARD_CLASS}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardDescription className="text-xs uppercase tracking-[0.22em] text-primary">
              Enigma serata
            </CardDescription>
            <CardTitle className="text-lg">I tuoi frammenti</CardTitle>
          </div>
          <div className="rounded-full border border-primary/35 bg-primary/10 px-3 py-1 text-xs font-semibold tabular-nums text-primary">
            {view.owned.length}/{view.total}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="h-2 overflow-hidden rounded-full bg-black/40">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary/70 to-primary transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {view.slots.map((slot, index) => (
              <span
                key={slot.id}
                className={cn(
                  "inline-flex min-h-10 min-w-10 items-center justify-center rounded-xl border px-2 text-xs font-semibold uppercase tracking-wide",
                  slot.owned
                    ? "border-primary/50 bg-primary/15 text-primary"
                    : "border-white/10 bg-black/35 text-muted-foreground",
                )}
                aria-label={
                  slot.owned
                    ? fragmentLabel(slot.id, index)
                    : `Frammento ${index + 1} mancante`
                }
              >
                {slot.owned ? index + 1 : "?"}
              </span>
            ))}
          </div>
        </div>

        {view.isComplete && view.finalCode ? (
          <div className="rounded-2xl border border-primary/35 bg-black/55 px-4 py-4 text-center backdrop-blur-sm">
            <div className="mb-2 flex items-center justify-center gap-2 text-primary">
              <Sparkles className="size-4" aria-hidden />
              <p className="text-xs font-semibold uppercase tracking-[0.24em]">
                Codice finale
              </p>
            </div>
            <p className="font-display text-3xl font-bold tracking-[0.18em] text-white">
              {view.finalCode}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Hai completato l&apos;enigma. Mostra il codice all&apos;animatore.
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Rispondi alle domande per raccogliere i frammenti e sbloccare il
            codice finale.
          </p>
        )}

        {view.canDonate ? (
          <div className="space-y-3">
            <Button
              type="button"
              size="lg"
              className="h-12 w-full text-base font-semibold shadow-[0_0_24px_rgba(236,72,153,0.35)]"
              onClick={() => {
                setExchangeOpen((open) => !open);
                setError(null);
              }}
            >
              <Gift className="size-4" />
              Scambia frammento
            </Button>

            {exchangeOpen ? (
              <div className="space-y-3 rounded-2xl border border-white/10 bg-black/45 p-4">
                <p className="text-sm text-muted-foreground">
                  Dona un frammento in più a chi non ha ancora completato
                  l&apos;enigma.
                </p>

                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/90">
                    Scegli giocatore
                  </p>
                  <div className="grid gap-2">
                    {targets.map((target) => (
                      <button
                        key={target.id}
                        type="button"
                        onClick={() => {
                          setSelectedTargetId(target.id);
                          setSelectedFragmentId(null);
                          setError(null);
                        }}
                        className={cn(
                          "min-h-12 rounded-xl border px-4 py-3 text-left transition-colors",
                          selectedTargetId === target.id
                            ? "border-primary bg-primary/15 text-primary"
                            : "border-white/15 bg-black/35 hover:border-primary/35",
                        )}
                      >
                        <span className="font-semibold">{target.nickname}</span>
                        <span className="mt-1 block text-xs text-muted-foreground">
                          Mancano {target.missingCount} frammenti
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {selectedTarget ? (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/90">
                      Quale frammento doni?
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {selectableFragments.map((fragmentId, index) => (
                        <button
                          key={`${fragmentId}-${index}`}
                          type="button"
                          onClick={() => {
                            setSelectedFragmentId(fragmentId);
                            setError(null);
                          }}
                          className={cn(
                            "min-h-12 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors",
                            selectedFragmentId === fragmentId
                              ? "border-primary bg-primary/15 text-primary"
                              : "border-white/15 bg-black/35 hover:border-primary/35",
                          )}
                        >
                          Frammento{" "}
                          {view.slots.findIndex((slot) => slot.id === fragmentId) +
                            1 || index + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {error ? (
                  <p className="text-sm text-destructive" role="alert">
                    {error}
                  </p>
                ) : null}

                <Button
                  type="button"
                  className="w-full"
                  disabled={
                    submitting || !selectedTargetId || !selectedFragmentId
                  }
                  onClick={() => void handleDonate()}
                >
                  {submitting ? "Scambio in corso…" : "Conferma scambio"}
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
