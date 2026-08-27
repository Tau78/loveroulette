import { describe, expect, it } from "vitest";
import { DEFAULT_CASA_PREP, venueLabel } from "./casa-prep";

describe("casa prep", () => {
  it("defaults to ironico + salva, extras on", () => {
    expect(DEFAULT_CASA_PREP.stile).toBe("ironico");
    expect(DEFAULT_CASA_PREP.ripescaggio).toBe("salva");
    expect(DEFAULT_CASA_PREP.ship).toBe(true);
    expect(DEFAULT_CASA_PREP.venueId).toBeNull();
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
