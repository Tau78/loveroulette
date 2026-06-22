"use client";

import { useEffect, useRef, useState } from "react";
import type { VotingFinalist } from "@/lib/musicpro/voting";

function initCounts(finalists: VotingFinalist[]): Record<string, number> {
  return Object.fromEntries(finalists.map((f) => [f.pairId, 0]));
}

/** Conteggi finti che oscillano durante il countdown; a zero → voti reali. */
export function useSimulatedVoteCounts(
  finalists: VotingFinalist[],
  remaining: number,
  realCounts: Record<string, number>,
  enabled: boolean,
): Record<string, number> {
  const [displayCounts, setDisplayCounts] = useState<Record<string, number>>(
    () => initCounts(finalists),
  );
  const lockedRef = useRef(false);

  useEffect(() => {
    lockedRef.current = remaining <= 0;
    if (!enabled || remaining <= 0) {
      setDisplayCounts(() => {
        const next: Record<string, number> = {};
        for (const f of finalists) {
          next[f.pairId] = realCounts[f.pairId] ?? 0;
        }
        return next;
      });
    }
  }, [enabled, finalists, realCounts, remaining]);

  useEffect(() => {
    if (!enabled || remaining <= 0) return;

    setDisplayCounts(initCounts(finalists));

    const interval = window.setInterval(() => {
      if (lockedRef.current) return;

      setDisplayCounts((prev) => {
        const next: Record<string, number> = {};
        for (const f of finalists) {
          const current = prev[f.pairId] ?? 0;
          const swing = Math.floor(Math.random() * 9) - 3;
          const trend = Math.random() > 0.35 ? 1 : 0;
          next[f.pairId] = Math.max(0, Math.min(99, current + swing + trend));
        }
        return next;
      });
    }, 480);

    return () => window.clearInterval(interval);
  }, [enabled, finalists, remaining]);

  return displayCounts;
}
