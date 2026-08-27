"use client";

import { useEffect } from "react";

type WakeLockSentinelLike = {
  released: boolean;
  release: () => Promise<void>;
  addEventListener: (type: "release", listener: () => void) => void;
};

type NavigatorWithWakeLock = Navigator & {
  wakeLock?: {
    request: (type: "screen") => Promise<WakeLockSentinelLike>;
  };
};

/** Tiene lo schermo acceso mentre il giocatore è in sala e il tab è visibile. */
export function usePlayerWakeLock(enabled: boolean): void {
  useEffect(() => {
    if (!enabled || typeof navigator === "undefined") return;

    const nav = navigator as NavigatorWithWakeLock;
    if (!nav.wakeLock) return;

    let lock: WakeLockSentinelLike | null = null;
    let cancelled = false;

    async function acquire() {
      if (cancelled || document.visibilityState !== "visible") return;
      try {
        lock = await nav.wakeLock!.request("screen");
        lock.addEventListener("release", () => {
          lock = null;
        });
      } catch {
        lock = null;
      }
    }

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void acquire();
      }
    };

    void acquire();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
      if (lock && !lock.released) {
        void lock.release().catch(() => {});
      }
    };
  }, [enabled]);
}
