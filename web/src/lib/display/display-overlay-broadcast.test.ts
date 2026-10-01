import { describe, expect, it } from "vitest";
import {
  displayCommandToOverlay,
  displayOverlaySemanticKey,
  parseDisplayOverlayBroadcast,
  preferFresherDisplayOverlay,
} from "./display-overlay-broadcast";

describe("displayCommandToOverlay", () => {
  it("builds a slide with updatedAt", () => {
    const o = displayCommandToOverlay({
      type: "slide",
      title: "NICK",
      kicker: "M",
      imageUrl: "/x.png",
    });
    expect(o.type).toBe("slide");
    expect(o.title).toBe("NICK");
    expect(o.kicker).toBe("M");
    expect(o.imageUrl).toBe("/x.png");
    expect(Date.parse(o.updatedAt)).toBeGreaterThan(0);
  });

  it("builds clear", () => {
    expect(displayCommandToOverlay({ type: "clear" }).type).toBe("clear");
  });
});

describe("preferFresherDisplayOverlay", () => {
  it("keeps the newer updatedAt", () => {
    const older = {
      type: "slide" as const,
      title: "A",
      updatedAt: "2026-10-01T12:00:00.000Z",
    };
    const newer = {
      type: "slide" as const,
      title: "B",
      updatedAt: "2026-10-01T12:00:01.000Z",
    };
    expect(preferFresherDisplayOverlay(older, newer)?.title).toBe("B");
    expect(preferFresherDisplayOverlay(newer, older)?.title).toBe("B");
  });

  it("ignores duplicate sigla with only newer updatedAt", () => {
    const playing = {
      type: "sigla" as const,
      updatedAt: "2026-10-01T12:00:00.000Z",
    };
    const rebroadcast = {
      type: "sigla" as const,
      updatedAt: "2026-10-01T12:00:05.000Z",
    };
    expect(preferFresherDisplayOverlay(playing, rebroadcast)).toBe(playing);
    expect(displayOverlaySemanticKey(playing)).toBe("sigla");
  });

  it("keeps a fresh local overlay when poll sends null", () => {
    const fresh = {
      type: "slide" as const,
      title: "NOW",
      updatedAt: new Date().toISOString(),
    };
    expect(preferFresherDisplayOverlay(fresh, null)?.title).toBe("NOW");
  });
});

describe("parseDisplayOverlayBroadcast", () => {
  it("accepts matching eventCode", () => {
    const overlay = {
      type: "clear" as const,
      updatedAt: "2026-10-01T12:00:00.000Z",
    };
    expect(
      parseDisplayOverlayBroadcast(
        {
          type: "lr-display-overlay",
          eventCode: "demo01",
          overlay,
        },
        "DEMO01",
      ),
    ).toEqual(overlay);
  });

  it("rejects other events", () => {
    expect(
      parseDisplayOverlayBroadcast(
        {
          type: "lr-display-overlay",
          eventCode: "OTHER",
          overlay: { type: "clear", updatedAt: "2026-10-01T12:00:00.000Z" },
        },
        "DEMO01",
      ),
    ).toBeUndefined();
  });
});
