import { describe, expect, it } from "vitest";
import {
  DEFAULT_TYPE_SCALE_PREFS,
  DISPLAY_TYPE_SCALE_DEFAULT,
  PLANCIA_TYPE_SCALE_DEFAULT,
  clampTypeScale,
  typeScaleStyleVars,
} from "@/lib/display/type-scale";

describe("type-scale prefs", () => {
  it("exposes distinct defaults for schermo and plancia", () => {
    expect(DISPLAY_TYPE_SCALE_DEFAULT).toBe(1.2);
    expect(PLANCIA_TYPE_SCALE_DEFAULT).toBe(1);
    expect(DEFAULT_TYPE_SCALE_PREFS).toEqual({
      display: 1.2,
      plancia: 1,
    });
  });

  it("builds CSS custom property bags", () => {
    expect(typeScaleStyleVars({ display: 1.3, plancia: 1.1 })).toEqual({
      "--lr-display-type-scale": "1.3",
      "--casa-type-scale": "1.1",
    });
    expect(clampTypeScale(1.25)).toBe(1.3);
  });
});
