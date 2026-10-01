import { describe, expect, it } from "vitest";
import { shouldSpinExtractionReveal } from "./DisplayExtractionStage";

describe("shouldSpinExtractionReveal", () => {
  it("spins on first extract after idle (no prior reveal)", () => {
    expect(shouldSpinExtractionReveal(null, "t1", true)).toBe(true);
  });

  it("does not spin when remounting onto an existing reveal", () => {
    expect(shouldSpinExtractionReveal(null, "t1", false)).toBe(false);
  });

  it("spins when a new reveal replaces a previous one", () => {
    expect(shouldSpinExtractionReveal("t1", "t2", false)).toBe(true);
  });

  it("ignores duplicate updatedAt", () => {
    expect(shouldSpinExtractionReveal("t1", "t1", true)).toBe(false);
  });
});
