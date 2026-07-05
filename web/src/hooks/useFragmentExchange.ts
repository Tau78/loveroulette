"use client";

import { useCallback, useEffect, useState } from "react";
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

interface FragmentExchangeResponse {
  view: ParticipantFragmentView;
  targets: FragmentDonationTarget[];
  error?: string;
}

interface UseFragmentExchangeOptions {
  eventSlug: string;
  participantId: string | null;
  enabled: boolean;
  pollMs?: number;
}

export function useFragmentExchange({
  eventSlug,
  participantId,
  enabled,
  pollMs = 4000,
}: UseFragmentExchangeOptions) {
  const [view, setView] = useState<ParticipantFragmentView | null>(null);
  const [targets, setTargets] = useState<FragmentDonationTarget[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled || !participantId) return;

    setLoading(true);
    try {
      const res = await fetch(
        `/api/events/${encodeURIComponent(eventSlug)}/fragments?participantId=${encodeURIComponent(participantId)}`,
        { cache: "no-store" },
      );
      const data = (await res.json().catch(() => null)) as
        | FragmentExchangeResponse
        | { error?: string }
        | null;

      if (!res.ok || !data || !("view" in data)) {
        throw new Error(
          (data && "error" in data && data.error) || "Frammenti non disponibili.",
        );
      }

      setView(data.view);
      setTargets(data.targets);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore di rete.");
    } finally {
      setLoading(false);
    }
  }, [enabled, eventSlug, participantId]);

  useEffect(() => {
    if (!enabled || !participantId) {
      setView(null);
      setTargets([]);
      return;
    }

    void refresh();
    const timer = window.setInterval(() => {
      void refresh();
    }, pollMs);

    return () => window.clearInterval(timer);
  }, [enabled, participantId, pollMs, refresh]);

  return { view, targets, loading, error, refresh };
}
