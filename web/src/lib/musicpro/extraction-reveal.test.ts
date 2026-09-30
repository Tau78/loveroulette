import { describe, expect, it } from "vitest";
import { getLastReveal } from "./extraction";

describe("getLastReveal", () => {
  it("parses photo urls when present", () => {
    const reveal = getLastReveal({
      love_roulette_last_reveal: {
        maleNick: "Alex",
        femaleNick: "Sam",
        maleId: "m1",
        femaleId: "f1",
        pairId: "p1",
        affinityScore: 88,
        updatedAt: "2026-01-01T00:00:00.000Z",
        malePhotoUrl: "/grafiche/avatar-m.png",
        femalePhotoUrl: "https://cdn.example/photo.jpg",
      },
    });
    expect(reveal?.malePhotoUrl).toBe("/grafiche/avatar-m.png");
    expect(reveal?.femalePhotoUrl).toBe("https://cdn.example/photo.jpg");
  });

  it("works without photos (legacy metadata)", () => {
    const reveal = getLastReveal({
      love_roulette_last_reveal: {
        maleNick: "Alex",
        femaleNick: "Sam",
        pairId: "p1",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    });
    expect(reveal?.maleNick).toBe("Alex");
    expect(reveal?.malePhotoUrl).toBeUndefined();
  });
});
