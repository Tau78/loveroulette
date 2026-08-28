import { describe, expect, it } from "vitest";
import { casaAutoBedLabel, casaAutoBedSrc, resolveCasaBed } from "./casa-beds";

describe("casa auto beds", () => {
  it("maps beats to the SUNO loops", () => {
    expect(casaAutoBedSrc("casa")).toContain("LR_01_Lobby_Ambient");
    expect(casaAutoBedSrc("pres")).toContain("LR_01_Lobby_Ambient");
    expect(casaAutoBedSrc("presenti")).toContain("LR_05_Extraction");
    expect(casaAutoBedSrc("quiz")).toContain("LR_02_Quiz_Tension");
    expect(casaAutoBedSrc("sigla")).toBeNull();
  });

  it("pauses the bed during the sigla", () => {
    expect(resolveCasaBed("sigla", null, 0)).toBeNull();
    expect(casaAutoBedLabel("sigla")).toMatch(/sigla/i);
  });

  it("lets a local folder override Auto fase", () => {
    const folder = [{ name: "mio.mp3", url: "blob:x" }];
    expect(resolveCasaBed("quiz", folder, 0)).toEqual(folder[0]);
  });
});
