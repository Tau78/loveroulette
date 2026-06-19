"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AdminPlayersManager } from "@/components/admin/AdminPlayersManager";
import { normalizeEventSlug } from "@/lib/musicpro/slug";
import type { LoveRouletteEvent } from "@/lib/musicpro/types";

export default function AdminPlayersPage() {
  const params = useParams();
  const eventCode = normalizeEventSlug(String(params.eventCode ?? ""));

  const [event, setEvent] = useState<LoveRouletteEvent | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(
          `/api/events/${encodeURIComponent(eventCode)}`,
        );
        if (!res.ok) throw new Error("Evento non trovato.");
        const data = (await res.json()) as LoveRouletteEvent;
        if (!cancelled) setEvent(data);
      } catch (err) {
        if (!cancelled) {
          setLoadError(
            err instanceof Error ? err.message : "Errore di caricamento.",
          );
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [eventCode]);

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center theme-dark-fuchsia p-6">
        <p className="text-destructive text-sm">{loadError}</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center theme-dark-fuchsia">
        <p className="text-muted-foreground text-sm">Caricamento…</p>
      </div>
    );
  }

  return (
    <AdminPlayersManager
      eventCode={eventCode}
      eventTitle={event.title}
      pinRequired={event.animatorPinRequired}
    />
  );
}
