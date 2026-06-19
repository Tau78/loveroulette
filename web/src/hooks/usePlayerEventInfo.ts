"use client";

import { useEffect, useState } from "react";

export interface PlayerEventInfo {
  title: string;
  venueName: string | null;
  eventDate: string;
  eventTime: string | null;
}

export function usePlayerEventInfo(eventSlug: string) {
  const [info, setInfo] = useState<PlayerEventInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/events/${encodeURIComponent(eventSlug)}`,
        );
        if (!res.ok) {
          if (!cancelled) setInfo(null);
          return;
        }
        const data = (await res.json()) as PlayerEventInfo & {
          venueName?: string | null;
        };
        if (!cancelled) {
          setInfo({
            title: data.title,
            venueName: data.venueName ?? null,
            eventDate: data.eventDate,
            eventTime: data.eventTime ?? null,
          });
        }
      } catch {
        if (!cancelled) setInfo(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [eventSlug]);

  return { info, loading };
}
