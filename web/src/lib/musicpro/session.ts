import type { SupabaseClient } from "@supabase/supabase-js";
import type { EventState } from "@/lib/types";
import type { PairProgress } from "./pair-progress";
import { getPairProgress } from "./pair-progress";

export interface EventStats {
  onlineCount: number;
  participantCount: number;
  pairProgress: PairProgress | null;
}

export interface SessionRuntimeUpdate {
  sessionId: string;
  runtimeState: EventState;
}

export function verifyAnimatorPin(
  metadata: Record<string, unknown> | null | undefined,
  pin: string | null,
): boolean {
  const configured = metadata?.animator_pin;
  if (
    configured === undefined ||
    configured === null ||
    String(configured).trim() === ""
  ) {
    return true;
  }

  const expected = String(configured).trim();
  const provided = pin?.trim() ?? "";
  return provided === expected;
}

export async function getEventStats(
  supabase: SupabaseClient,
  eventId: string,
): Promise<EventStats> {
  const { count: participantCount, error: totalError } = await supabase
    .from("love_roulette_participants")
    .select("*", { count: "exact", head: true })
    .eq("event_id", eventId);

  if (totalError) {
    throw new Error(totalError.message);
  }

  const onlineSince = new Date(Date.now() - 90_000).toISOString();

  const { count: onlineCount, error: onlineError } = await supabase
    .from("love_roulette_participants")
    .select("*", { count: "exact", head: true })
    .eq("event_id", eventId)
    .eq("is_online", true)
    .gte("last_seen_at", onlineSince);

  if (onlineError) {
    throw new Error(onlineError.message);
  }

  let pairProgress: PairProgress | null = null;
  try {
    pairProgress = await getPairProgress(supabase, eventId);
  } catch {
    pairProgress = null;
  }

  return {
    onlineCount: onlineCount ?? 0,
    participantCount: participantCount ?? 0,
    pairProgress,
  };
}

export async function updateSessionRuntimeState(
  supabase: SupabaseClient,
  eventId: string,
  runtimeState: EventState,
): Promise<SessionRuntimeUpdate> {
  const { data: session, error: fetchError } = await supabase
    .from("love_roulette_sessions")
    .select("id")
    .eq("event_id", eventId)
    .order("session_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (fetchError || !session) {
    throw new Error(fetchError?.message ?? "Session not found");
  }

  const { data, error } = await supabase
    .from("love_roulette_sessions")
    .update({ runtime_state: runtimeState })
    .eq("id", session.id)
    .select("id, runtime_state")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to update session");
  }

  return {
    sessionId: data.id,
    runtimeState: data.runtime_state as EventState,
  };
}
