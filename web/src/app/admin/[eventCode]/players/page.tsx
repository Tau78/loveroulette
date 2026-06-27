"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AdminDashboardShell } from "@/components/admin/AdminDashboardShell";
import { AdminPlayersManager } from "@/components/admin/AdminPlayersManager";
import { useLoveRouletteSession } from "@/hooks/useLoveRouletteSession";
import type { EventStats } from "@/lib/musicpro/session";
import { normalizeEventSlug } from "@/lib/musicpro/slug";
import type { LoveRouletteEvent } from "@/lib/musicpro/types";

interface SessionPayload {
  runtimeState: LoveRouletteEvent["runtimeState"];
  sessionId: string | null;
  stats: EventStats;
}

export default function AdminPlayersPage() {
  const params = useParams();
  const eventCode = normalizeEventSlug(String(params.eventCode ?? ""));

  const [event, setEvent] = useState<LoveRouletteEvent | null>(null);
  const [stats, setStats] = useState<EventStats>({
    onlineCount: 0,
    participantCount: 0,
    pairProgress: null,
  });
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const { runtimeState, syncStatus } = useLoveRouletteSession({
    eventSlug: eventCode,
    eventId: event?.id,
    initialEvent: event,
    initialRuntimeState: event?.runtimeState ?? "lobby",
    enabled: Boolean(event),
  });

  const loadSessionStats = useCallback(async () => {
    const response = await fetch(
      `/api/events/${encodeURIComponent(eventCode)}/session`,
    );
    if (!response.ok) return null;
    return (await response.json()) as SessionPayload;
  }, [eventCode]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadError(null);

      try {
        const res = await fetch(`/api/events/${encodeURIComponent(eventCode)}`);
        if (!res.ok) throw new Error("Evento non trovato.");
        const data = (await res.json()) as LoveRouletteEvent;
        if (cancelled) return;

        setEvent(data);

        const sessionPayload = await loadSessionStats();
        if (!cancelled && sessionPayload) {
          setStats(sessionPayload.stats);
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(
            err instanceof Error ? err.message : "Errore di caricamento.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [eventCode, loadSessionStats]);

  useEffect(() => {
    if (!event) return;

    let cancelled = false;

    const refreshStats = async () => {
      const sessionPayload = await loadSessionStats();
      if (!cancelled && sessionPayload) {
        setStats(sessionPayload.stats);
      }
    };

    void refreshStats();
    const interval = window.setInterval(refreshStats, 10_000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [event, loadSessionStats]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center theme-dark-fuchsia">
        <p className="text-muted-foreground text-sm">Caricamento…</p>
      </div>
    );
  }

  if (loadError || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center theme-dark-fuchsia p-6">
        <p className="text-destructive text-sm">
          {loadError ?? "Impossibile aprire la gestione giocatori."}
        </p>
      </div>
    );
  }

  return (
    <AdminDashboardShell
      eventCode={eventCode}
      eventTitle={event.title}
      runtimeState={runtimeState}
      onlineCount={stats.onlineCount}
      participantCount={stats.participantCount}
      syncStatus={syncStatus}
    >
      <AdminPlayersManager
        eventCode={eventCode}
        pinRequired={event.animatorPinRequired}
      />
    </AdminDashboardShell>
  );
}
