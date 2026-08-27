"use client";

import { useEffect, useRef } from "react";
import { planPresenceUpdate } from "@/lib/musicpro/presence";

function postPresence(
  eventSlug: string,
  participantId: string,
  online: boolean,
): void {
  const body = JSON.stringify({ participantId, online });
  const url = `/api/events/${encodeURIComponent(eventSlug)}/presence`;

  if (!online && typeof navigator !== "undefined" && navigator.sendBeacon) {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon(url, blob);
    return;
  }

  void fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: !online,
  }).catch(() => {});
}

export function usePlayerPresence(options: {
  eventSlug: string;
  participantId: string | null;
  enabled: boolean;
}): void {
  const { eventSlug, participantId, enabled } = options;
  const joinedRef = useRef(false);
  joinedRef.current = enabled && Boolean(participantId);

  useEffect(() => {
    if (!enabled || !participantId) return;

    let graceTimer: number | null = null;

    const clearGrace = () => {
      if (graceTimer != null) {
        window.clearTimeout(graceTimer);
        graceTimer = null;
      }
    };

    const apply = (signal: "visible" | "hidden" | "unmount") => {
      const plan = planPresenceUpdate(signal);
      clearGrace();
      if (plan.delayMs === 0) {
        postPresence(eventSlug, participantId, plan.action === "online");
        return;
      }
      graceTimer = window.setTimeout(() => {
        postPresence(eventSlug, participantId, false);
        graceTimer = null;
      }, plan.delayMs);
    };

    apply("visible");

    const heartbeat = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        postPresence(eventSlug, participantId, true);
      }
    }, 30_000);

    const onVisibility = () => {
      apply(document.visibilityState === "visible" ? "visible" : "hidden");
    };

    const onPageShow = () => {
      apply("visible");
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pageshow", onPageShow);

    return () => {
      clearGrace();
      window.clearInterval(heartbeat);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pageshow", onPageShow);
      if (joinedRef.current) {
        apply("unmount");
      }
    };
  }, [enabled, eventSlug, participantId]);
}
