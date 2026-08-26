"use client";

import { useEffect } from "react";
import { flushPlayerActionQueue } from "@/lib/player/player-action-queue";

/** Svuota voto/risposta in coda al resume, al ritorno rete e ogni 5s in foreground. */
export function usePlayerActionQueueFlush(
  eventSlug: string,
  enabled: boolean,
): void {
  useEffect(() => {
    if (!enabled) return;

    const flush = () => {
      void flushPlayerActionQueue(eventSlug);
    };

    flush();

    const onVisible = () => {
      if (document.visibilityState === "visible") flush();
    };

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", flush);
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") flush();
    }, 5_000);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", flush);
      window.clearInterval(interval);
    };
  }, [enabled, eventSlug]);
}
