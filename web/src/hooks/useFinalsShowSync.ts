"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { EventState } from "@/lib/types";
import type { FinalsShowState } from "@/lib/musicpro/finals-show";
import {
  isFinalsPhaseExpired,
  resolveFinalsShowClock,
} from "@/lib/musicpro/finals-show";
import type { VotingSessionState } from "@/lib/musicpro/voting";

interface UseFinalsShowSyncOptions {
  eventSlug: string;
  show: FinalsShowState | null;
  enabled?: boolean;
  driveTicks?: boolean;
  onTick?: (payload: {
    show: FinalsShowState | null;
    session: VotingSessionState | null;
    runtimeState?: EventState;
  }) => void;
}

export function useFinalsShowSync({
  eventSlug,
  show,
  enabled = true,
  driveTicks = false,
  onTick,
}: UseFinalsShowSyncOptions) {
  const [remaining, setRemaining] = useState(0);
  const tickingRef = useRef(false);
  const onTickRef = useRef(onTick);
  const showRef = useRef(show);

  showRef.current = show;
  onTickRef.current = onTick;

  const tickServer = useCallback(async () => {
    if (tickingRef.current) return;
    tickingRef.current = true;
    try {
      const res = await fetch(
        `/api/events/${encodeURIComponent(eventSlug)}/voting`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "tick" }),
        },
      );
      if (res.ok) {
        const data = (await res.json()) as {
          show: FinalsShowState | null;
          session: VotingSessionState | null;
          runtimeState?: EventState;
        };
        onTickRef.current?.(data);
      }
    } finally {
      window.setTimeout(() => {
        tickingRef.current = false;
      }, 500);
    }
  }, [eventSlug]);

  useEffect(() => {
    if (!enabled || !show) {
      setRemaining(0);
      return;
    }

    const update = () => {
      const current = showRef.current;
      if (!current) return;

      const clock = resolveFinalsShowClock(current);
      setRemaining(clock.remaining);

      const expired = isFinalsPhaseExpired(
        current.phase,
        current.phaseStartedAt,
      );

      if (driveTicks && (clock.awaitingServerTick || expired)) {
        void tickServer();
      }
    };

    update();
    const interval = window.setInterval(update, 200);
    return () => window.clearInterval(interval);
  }, [driveTicks, enabled, show?.updatedAt, show?.phase, tickServer]);

  return { remaining, tickServer };
}
