import { describe, expect, it } from "vitest";
import {
  STACCO_KICKER,
  STACCO_SECONDS,
  isStaccoSlide,
  resolveStaccoValue,
  staccoDisplayCommand,
} from "./stacco";

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

  it("builds a single shared clock payload", () => {
    const at = "2026-10-01T12:00:00.000Z";
    expect(staccoDisplayCommand(at)).toEqual({
      type: "slide",
      kicker: STACCO_KICKER,
      title: String(STACCO_SECONDS),
      startedAt: at,
    });
  });

  it("resolves the same digit from startedAt on every client", () => {
    const startedAt = "2026-10-01T12:00:00.000Z";
    const t0 = Date.parse(startedAt);
    expect(resolveStaccoValue({ title: "5", startedAt }, t0)).toBe(5);
    expect(resolveStaccoValue({ title: "5", startedAt }, t0 + 999)).toBe(5);
    expect(resolveStaccoValue({ title: "5", startedAt }, t0 + 1000)).toBe(4);
    expect(resolveStaccoValue({ title: "5", startedAt }, t0 + 4000)).toBe(1);
    expect(resolveStaccoValue({ title: "5", startedAt }, t0 + 5000)).toBe(0);
  });
});
