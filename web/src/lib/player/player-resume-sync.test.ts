import { describe, expect, it } from "vitest";
import {
  RESUME_BLUR_IGNORE_MS,
  RESUME_OVERLAY_MAX_MS,
  RESUME_OVERLAY_MIN_MS,
  shouldHoldResumeOverlay,
} from "./player-resume-sync";

describe("shouldHoldResumeOverlay", () => {
  it("ignores a brief notification blur", () => {
    expect(
      shouldHoldResumeOverlay({
        hiddenDurationMs: RESUME_BLUR_IGNORE_MS - 1,
        overlayAgeMs: 0,
        resyncing: true,
      }),
    ).toBe(false);
  });

  it("holds at least the minimum time after a real background", () => {
    expect(
      shouldHoldResumeOverlay({
        hiddenDurationMs: 2_000,
        overlayAgeMs: RESUME_OVERLAY_MIN_MS - 10,
        resyncing: false,
      }),
    ).toBe(true);
  });

  it("holds while resync is in flight after the minimum", () => {
    expect(
      shouldHoldResumeOverlay({
        hiddenDurationMs: 2_000,
        overlayAgeMs: RESUME_OVERLAY_MIN_MS + 20,
        resyncing: true,
      }),
    ).toBe(true);
  });

  it("releases when the snapshot is live and the minimum has passed", () => {
    expect(
      shouldHoldResumeOverlay({
        hiddenDurationMs: 2_000,
        overlayAgeMs: RESUME_OVERLAY_MIN_MS + 20,
        resyncing: false,
      }),
    ).toBe(false);
  });

  it("never blocks longer than the max hold", () => {
    expect(
      shouldHoldResumeOverlay({
        hiddenDurationMs: 8_000,
        overlayAgeMs: RESUME_OVERLAY_MAX_MS,
        resyncing: true,
      }),
    ).toBe(false);
  });
});
