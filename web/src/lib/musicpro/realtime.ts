import type { RealtimeChannel } from "@supabase/supabase-js";
import type { EventState } from "@/lib/types";
import { createClientOrNull } from "@/lib/supabase/client";
import type { LoveRouletteEvent } from "./types";

export type SessionTransport = "realtime" | "polling";

export interface SessionStatePayload {
  runtimeState: EventState;
  sessionId: string | null;
}

export interface SubscribeLoveRouletteSessionOptions {
  eventId: string;
  eventSlug: string;
  onUpdate: (payload: SessionStatePayload, transport: SessionTransport) => void;
  onTransport?: (transport: SessionTransport) => void;
}

const POLL_INTERVAL_MS = 5000;

async function fetchEventState(
  eventSlug: string,
): Promise<SessionStatePayload | null> {
  try {
    const res = await fetch(`/api/events/${encodeURIComponent(eventSlug)}`);
    if (!res.ok) return null;
    const data = (await res.json()) as LoveRouletteEvent;
    return { runtimeState: data.runtimeState, sessionId: data.sessionId };
  } catch {
    return null;
  }
}

async function canAnonReadSession(eventId: string): Promise<{
  ok: boolean;
  payload: SessionStatePayload | null;
}> {
  const supabase = createClientOrNull();
  if (!supabase) return { ok: false, payload: null };

  const { data, error } = await supabase
    .from("love_roulette_sessions")
    .select("id, runtime_state")
    .eq("event_id", eventId)
    .order("session_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return { ok: false, payload: null };

  const row = data as { id: string; runtime_state: EventState } | null;
  return {
    ok: true,
    payload: row
      ? { runtimeState: row.runtime_state, sessionId: row.id }
      : { runtimeState: "lobby", sessionId: null },
  };
}

function startPolling(
  eventSlug: string,
  onUpdate: SubscribeLoveRouletteSessionOptions["onUpdate"],
  onTransport?: SubscribeLoveRouletteSessionOptions["onTransport"],
): () => void {
  onTransport?.("polling");

  let active = true;

  const poll = async () => {
    if (!active) return;
    const payload = await fetchEventState(eventSlug);
    if (active && payload) {
      onUpdate(payload, "polling");
    }
  };

  void poll();
  const interval = setInterval(poll, POLL_INTERVAL_MS);

  return () => {
    active = false;
    clearInterval(interval);
  };
}

/**
 * Subscribe to `love_roulette_sessions.runtime_state` for a Love Roulette event.
 *
 * **RLS / anon access:** MusicPro Supabase may enable RLS on `love_roulette_sessions`
 * without a policy granting anon `SELECT`. In that case the browser client cannot
 * read session rows or receive Postgres Realtime events. This module probes anon read
 * access first; on failure (missing env, RLS denial, or channel error) it falls back
 * to polling `GET /api/events/[code]` every 5 seconds (service role on the server).
 */
export function subscribeLoveRouletteSession(
  options: SubscribeLoveRouletteSessionOptions,
): () => void {
  const { eventId, eventSlug, onUpdate, onTransport } = options;
  let cleanup: (() => void) | null = null;
  let cancelled = false;

  void (async () => {
    const probe = await canAnonReadSession(eventId);
    if (cancelled) return;

    if (!probe.ok) {
      cleanup = startPolling(eventSlug, onUpdate, onTransport);
      return;
    }

    if (probe.payload) {
      onUpdate(probe.payload, "realtime");
      onTransport?.("realtime");
    }

    const supabase = createClientOrNull();
    if (!supabase) {
      cleanup = startPolling(eventSlug, onUpdate, onTransport);
      return;
    }

    let channel: RealtimeChannel | null = null;
    let fellBack = false;

    const fallbackToPolling = () => {
      if (fellBack || cancelled) return;
      fellBack = true;
      channel?.unsubscribe();
      cleanup = startPolling(eventSlug, onUpdate, onTransport);
    };

    channel = supabase
      .channel(`love-roulette-session:${eventId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "love_roulette_sessions",
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          const row = payload.new as {
            id?: string;
            runtime_state?: EventState;
          };
          if (row?.runtime_state) {
            onUpdate(
              {
                runtimeState: row.runtime_state,
                sessionId: row.id ?? null,
              },
              "realtime",
            );
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "love_roulette_sessions",
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          const row = payload.new as {
            id?: string;
            runtime_state?: EventState;
          };
          if (row?.runtime_state) {
            onUpdate(
              {
                runtimeState: row.runtime_state,
                sessionId: row.id ?? null,
              },
              "realtime",
            );
          }
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          onTransport?.("realtime");
        } else if (
          status === "CHANNEL_ERROR" ||
          status === "TIMED_OUT" ||
          status === "CLOSED"
        ) {
          fallbackToPolling();
        }
      });

    cleanup = () => {
      channel?.unsubscribe();
    };
  })();

  return () => {
    cancelled = true;
    cleanup?.();
  };
}
