import { describe, expect, it } from "vitest";
import {
  PLAYER_PRESENCE_HIDE_GRACE_MS,
  PLAYER_PRESENCE_STALE_MS,
  isPresenceFresh,
  participantAppearsOnline,
  planPresenceUpdate,
} from "./presence";

describe("presence freshness", () => {
  const now = Date.parse("2026-08-26T18:00:00.000Z");

  it("treats a recent heartbeat as fresh", () => {
    expect(
      isPresenceFresh(new Date(now - 30_000).toISOString(), now),
    ).toBe(true);
  });

  it("treats a stale heartbeat as offline even if the flag is still true", () => {
    const lastSeen = new Date(now - PLAYER_PRESENCE_STALE_MS - 1).toISOString();
    expect(isPresenceFresh(lastSeen, now)).toBe(false);
    expect(
      participantAppearsOnline({ is_online: true, last_seen_at: lastSeen }, now),
    ).toBe(false);
  });

  it("requires both the online flag and a fresh last_seen", () => {
    const lastSeen = new Date(now - 5_000).toISOString();
    expect(
      participantAppearsOnline({ is_online: false, last_seen_at: lastSeen }, now),
    ).toBe(false);
    expect(
      participantAppearsOnline({ is_online: true, last_seen_at: lastSeen }, now),
    ).toBe(true);
  });
});

describe("planPresenceUpdate", () => {
  it("marks online immediately when the player comes back", () => {
    expect(planPresenceUpdate("visible")).toEqual({
      action: "online",
      delayMs: 0,
    });
  });

  it("waits a grace period before offline on hide", () => {
    expect(planPresenceUpdate("hidden")).toEqual({
      action: "offline",
      delayMs: PLAYER_PRESENCE_HIDE_GRACE_MS,
    });
  });

  it("marks offline immediately when leaving the play page", () => {
    expect(planPresenceUpdate("unmount")).toEqual({
      action: "offline",
      delayMs: 0,
    });
  });
});
