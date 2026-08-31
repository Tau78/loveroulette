import { describe, expect, it } from "vitest";
import {
  DEFAULT_TYPE_SCALE_PREFS,
  DISPLAY_TYPE_SCALE_DEFAULT,
  PLANCIA_TYPE_SCALE_DEFAULT,
  casaFitInversePercent,
  clampTypeScale,
  typeScaleStyleVars,
} from "@/lib/display/type-scale";

describe("type-scale prefs", () => {
  it("exposes distinct defaults for schermo and plancia", () => {
    expect(DISPLAY_TYPE_SCALE_DEFAULT).toBe(1.8);
    expect(PLANCIA_TYPE_SCALE_DEFAULT).toBe(1.5);
    expect(DEFAULT_TYPE_SCALE_PREFS).toEqual({
      display: 1.8,
      plancia: 1.5,
    });
  });

  it("builds CSS custom property bags", () => {
    expect(typeScaleStyleVars({ display: 1.3, plancia: 1.1 })).toEqual({
      "--lr-display-type-scale": "1.3",
      "--casa-type-scale": "1.1",
    });
    expect(clampTypeScale(1.25)).toBe(1.3);
  });

  it("keeps the plancia inside the viewport after type-scale zoom", () => {
    expect(casaFitInversePercent(1)).toBe(100);
    expect(casaFitInversePercent(1.5)).toBeCloseTo(100 / 1.5);
    expect(casaFitInversePercent(PLANCIA_TYPE_SCALE_DEFAULT) * PLANCIA_TYPE_SCALE_DEFAULT).toBeCloseTo(
      100,
    );
  });
});
