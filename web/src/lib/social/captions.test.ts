import { describe, expect, it } from "vitest";
import {
  captionQuizShock,
  captionTopShip,
  captionWinnerNight,
  promoVenueCaptionsBundle,
} from "./captions";

describe("social captions", () => {
  it("includes venue and hashtags for quiz shock", () => {
    const text = captionQuizShock({
      format: "quiz_shock",
      questionBody: "Preferisci A o B?",
      totalAnswers: 20,
      options: [
        {
          optionId: "1",
          label: "A",
          sortOrder: 0,
          count: 12,
          percent: 60,
        },
        {
          optionId: "2",
          label: "B",
          sortOrder: 1,
          count: 8,
          percent: 40,
        },
      ],
      venueName: "Club Neon",
    });
    expect(text).toContain("Preferisci A o B?");
    expect(text).toContain("60% · A");
    expect(text).toContain("@ Club Neon");
    expect(text).toContain("#LoveRoulette");
  });

  it("lists ship couples", () => {
    const text = captionTopShip({
      format: "top_ship",
      couples: [
        {
          rank: 1,
          maleNickname: "A",
          femaleNickname: "B",
          score: 90,
        },
      ],
      venueName: "",
    });
    expect(text).toContain("1. A & B · 90%");
  });

  it("builds winner caption with prize", () => {
    const text = captionWinnerNight({
      format: "winner_night",
      coupleLabel: "X & Y",
      prizeKicker: "Stasera",
      prizeHeadline: "IL PREMIO",
      prizeSub: "Vacanza",
      venueName: "Bar",
      eventCode: "DEMO",
    });
    expect(text).toContain("X & Y");
    expect(text).toContain("IL PREMIO — Vacanza");
  });

  it("bundles promo venue captions", () => {
    const text = promoVenueCaptionsBundle({
      format: "promo_venue",
      venueName: "Bar Luna",
      eventCode: "DEMO",
      staseraHeadline: "STASERA",
      staseraSub: "Gioca",
      prizeHeadline: "Premio",
      topCoupleLabel: "A & B",
    });
    expect(text).toContain("Story 1");
    expect(text).toContain("Reel highlight");
    expect(text).toContain("Bar Luna");
  });
});
