import { describe, expect, it } from "vitest";
import { DEFAULT_CASA_PREP, sanitizePrep, venueLabel } from "./casa-prep";

describe("casa prep", () => {
  it("defaults to ironico + salva, extras on, locked numbers", () => {
    expect(DEFAULT_CASA_PREP.stile).toBe("ironico");
    expect(DEFAULT_CASA_PREP.ripescaggio).toBe("salva");
    expect(DEFAULT_CASA_PREP.ship).toBe(true);
    expect(DEFAULT_CASA_PREP.venueId).toBeNull();
    expect(DEFAULT_CASA_PREP.shipTopN).toBe(3);
    expect(DEFAULT_CASA_PREP.luciFlashSec).toBe(8);
    expect(DEFAULT_CASA_PREP.salvaSec).toBe(30);
  });

  it("sanitizes and clamps numeric prep fields", () => {
    expect(
      sanitizePrep({
        shipTopN: 0,
        luciFlashSec: 99,
        salvaSec: 2,
      }),
    ).toMatchObject({ shipTopN: 1, luciFlashSec: 60, salvaSec: 5 });

    expect(
      sanitizePrep({
        shipTopN: 50,
        luciFlashSec: 0,
        salvaSec: 200,
      }),
    ).toMatchObject({ shipTopN: 20, luciFlashSec: 1, salvaSec: 120 });

    expect(
      sanitizePrep({
        shipTopN: "x" as unknown as number,
        luciFlashSec: Number.NaN,
        salvaSec: undefined,
      }),
    ).toMatchObject({
      shipTopN: 3,
      luciFlashSec: 8,
      salvaSec: 30,
    });
  });

  it("labels venue with city when present", () => {
    expect(venueLabel({ id: "1", name: "Boccaccio", city: "Genova" })).toBe(
      "Boccaccio · Genova",
    );
    expect(venueLabel({ id: "1", name: "Boccaccio", city: null })).toBe(
      "Boccaccio",
    );
  });
});
