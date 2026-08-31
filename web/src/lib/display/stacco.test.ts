import { describe, expect, it } from "vitest";
import { STACCO_KICKER, isStaccoSlide } from "./stacco";

describe("stacco slide", () => {
  it("matches the countdown overlay", () => {
    expect(
      isStaccoSlide({ type: "slide", kicker: STACCO_KICKER, title: "4" }),
    ).toBe(true);
    expect(
      isStaccoSlide({ type: "slide", kicker: "Si parte", title: "SIGLA" }),
    ).toBe(false);
    expect(isStaccoSlide({ type: "slide", title: "4" })).toBe(false);
  });
});
