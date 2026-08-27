/** Admin e stats: dopo questo silenzio il giocatore non conta più come in sala. */
export const PLAYER_PRESENCE_STALE_MS = 90_000;

/** Tab hidden / WhatsApp: aspetta prima di mandare `online: false`. */
export const PLAYER_PRESENCE_HIDE_GRACE_MS = 75_000;

export function isPresenceFresh(
  lastSeenAt: string | null | undefined,
  nowMs: number = Date.now(),
  staleMs: number = PLAYER_PRESENCE_STALE_MS,
): boolean {
  if (!lastSeenAt) return false;
  const seen = Date.parse(lastSeenAt);
  if (Number.isNaN(seen)) return false;
  return nowMs - seen < staleMs;
}

export function participantAppearsOnline(
  participant: { is_online: boolean; last_seen_at?: string | null },
  nowMs: number = Date.now(),
): boolean {
  return participant.is_online && isPresenceFresh(participant.last_seen_at, nowMs);
}

export type PresenceSignal = "visible" | "hidden" | "unmount";

export type PresencePlan =
  | { action: "online"; delayMs: 0 }
  | { action: "offline"; delayMs: number };

/** Cosa fare sul server quando cambia visibilità / unmount. */
export function planPresenceUpdate(signal: PresenceSignal): PresencePlan {
  if (signal === "visible") {
    return { action: "online", delayMs: 0 };
  }
  if (signal === "unmount") {
    return { action: "offline", delayMs: 0 };
  }
  return { action: "offline", delayMs: PLAYER_PRESENCE_HIDE_GRACE_MS };
}
