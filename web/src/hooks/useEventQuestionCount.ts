"use client";

import { useEffect, useState } from "react";
import type { LoveRouletteQuestionSource } from "@/lib/musicpro/types";

export function useEventQuestionCount(
  eventCode: string,
  enabled = true,
  refreshKey = 0,
): {
  count: number | null;
  source: LoveRouletteQuestionSource | null;
  loading: boolean;
} {
  const [count, setCount] = useState<number | null>(null);
  const [source, setSource] = useState<LoveRouletteQuestionSource | null>(
    null,
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || !eventCode) return;

    let cancelled = false;

    async function load() {
      setLoading(true);

      try {
        const res = await fetch(
          `/api/events/${encodeURIComponent(eventCode)}/questions`,
        );
        if (!res.ok) return;

        const data = (await res.json()) as {
          questions?: unknown[];
          source?: LoveRouletteQuestionSource;
        };

        if (!cancelled) {
          setCount(data.questions?.length ?? 0);
          setSource(data.source ?? null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [enabled, eventCode, refreshKey]);

  return { count, source, loading };
}
