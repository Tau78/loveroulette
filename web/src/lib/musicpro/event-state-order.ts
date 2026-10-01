import type { EventState } from "@/lib/types";

/** Ordine serata — usato per ignorare poll stale che regrediscono la plancia. */
export const EVENT_STATE_ORDER: readonly EventState[] = [
  "lobby",
  "quiz",
  "matching",
  "extraction",
  "elimination",
  "finals",
  "winner",
  "closed",
] as const;

export function eventStateRank(state: EventState): number {
  const idx = EVENT_STATE_ORDER.indexOf(state);
  return idx >= 0 ? idx : 0;
}

/**
 * Merge runtime da poll: non regredire rispetto allo stato locale recente
 * (optimistic GO), salvo reset a lobby.
 */
export function mergeRuntimeStateFromPoll(
  local: EventState,
  incoming: EventState,
  localChangedAtMs: number,
  nowMs: number = Date.now(),
  graceMs: number = 4000,
): EventState {
  if (incoming === local) return incoming;
  if (incoming === "lobby") return incoming;
  if (nowMs - localChangedAtMs > graceMs) return incoming;
  if (eventStateRank(incoming) < eventStateRank(local)) return local;
  return incoming;
}
