import { describe, expect, it } from "vitest";
import {
  PROJECTOR_REFERENCE,
  projectorPreviewScale,
} from "@/lib/display/embed";

describe("projectorPreviewScale", () => {
  it("returns 1 at native Full HD", () => {
    expect(
      projectorPreviewScale(
        PROJECTOR_REFERENCE.width,
        PROJECTOR_REFERENCE.height,
      ),
    ).toBe(1);
  });

  it("letterboxes uniformly when viewport is narrower", () => {
    expect(projectorPreviewScale(960, 1080)).toBe(0.5);
  });

  it("letterboxes uniformly when viewport is shorter", () => {
    expect(projectorPreviewScale(1920, 540)).toBe(0.5);
  });

  it("fits preview panel 640×360", () => {
    expect(projectorPreviewScale(640, 360)).toBeCloseTo(1 / 3, 5);
  });
});
