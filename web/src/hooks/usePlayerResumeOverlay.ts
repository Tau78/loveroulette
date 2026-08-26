"use client";

import { useEffect, useRef, useState } from "react";
import type { SessionSyncStatus } from "@/lib/musicpro/session-sync";
import { shouldHoldResumeOverlay } from "@/lib/player/player-resume-sync";

const TICK_MS = 50;

export function usePlayerResumeOverlay(syncStatus: SessionSyncStatus): boolean {
  const [visible, setVisible] = useState(false);
  const hiddenAtRef = useRef<number | null>(null);
  const shownAtRef = useRef<number | null>(null);
  const hiddenDurationRef = useRef(0);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        hiddenAtRef.current = Date.now();
        return;
      }

      const hiddenAt = hiddenAtRef.current;
      hiddenAtRef.current = null;
      if (hiddenAt == null) return;

      const hiddenDurationMs = Date.now() - hiddenAt;
      hiddenDurationRef.current = hiddenDurationMs;
      if (
        !shouldHoldResumeOverlay({
          hiddenDurationMs,
          overlayAgeMs: 0,
          resyncing: true,
        })
      ) {
        return;
      }

      shownAtRef.current = Date.now();
      setVisible(true);
    };

    const onPageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      hiddenDurationRef.current = 2_000;
      shownAtRef.current = Date.now();
      setVisible(true);
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, []);

  useEffect(() => {
    if (!visible) return;

    const tick = () => {
      const overlayAgeMs = Date.now() - (shownAtRef.current ?? Date.now());
      const hold = shouldHoldResumeOverlay({
        hiddenDurationMs: hiddenDurationRef.current,
        overlayAgeMs,
        resyncing: syncStatus === "resyncing" || syncStatus === "stale",
      });
      if (!hold) setVisible(false);
    };

    tick();
    const interval = window.setInterval(tick, TICK_MS);
    return () => window.clearInterval(interval);
  }, [syncStatus, visible]);

  return visible;
}
