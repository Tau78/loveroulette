import { describe, expect, it } from "vitest";
import {
  casaAutoBedLabel,
  casaAutoBedSrc,
  casaEffectiveBedBeat,
  resolveCasaBed,
  resolveCasaBedOrLobby,
} from "./casa-beds";

describe("casa auto beds", () => {
  it("follows quiz beds when runtime quiz is live even if local beat is casa", () => {
    expect(casaEffectiveBedBeat("casa", true)).toBe("quiz");
    expect(casaEffectiveBedBeat("casa", false)).toBe("casa");
    expect(
      casaAutoBedSrc(casaEffectiveBedBeat("casa", true), "results", "fun"),
    ).toContain("LR_02_Quiz_Fun");
    expect(
      casaAutoBedSrc(casaEffectiveBedBeat("casa", false), "results", "fun"),
    ).toContain("LR_01_Lobby_Ambient");
  });

  it("maps beats to the SUNO loops", () => {
    expect(casaAutoBedSrc("casa")).toContain("LR_01_Lobby_Ambient");
    expect(casaAutoBedSrc("pres")).toContain("LR_01_Lobby_Ambient");
    expect(casaAutoBedSrc("presenti")).toContain("LR_05_Extraction");
    expect(casaAutoBedSrc("stacco")).toBeNull();
    expect(casaAutoBedLabel("stacco")).toMatch(/countdown/i);
    expect(casaAutoBedSrc("quiz", "theme_intro", "romantic")).toContain(
      "LR_02_Quiz_Romantic",
    );
    expect(casaAutoBedSrc("quiz", "theme_intro", "fun")).toContain(
      "LR_02_Quiz_Fun",
    );
    expect(casaAutoBedSrc("quiz", "start_countdown")).toBeNull();
    expect(casaAutoBedSrc("quiz", "answers")).toContain("LR_03_Quiz_Countdown");
    expect(casaAutoBedLabel("quiz", "answers")).toMatch(/countdown/i);
    expect(casaAutoBedSrc("quiz", "results", "adventure")).toContain(
      "LR_02_Quiz_Adventure",
    );
    expect(casaAutoBedLabel("quiz", "results")).toMatch(/hold/i);
    expect(casaAutoBedLabel("quiz", "theme_intro", "lifestyle")).toMatch(
      /stile di vita/i,
    );
  });

  it("keeps an electrifying bed on pre-sigla warn and Tra 5′", () => {
    expect(
      casaAutoBedSrc("sigla", null, null, { sigla: "warn" }),
    ).toContain("LR_02_Quiz_Adventure");
    expect(
      casaAutoBedLabel("sigla", null, null, { sigla: "warn" }),
    ).toMatch(/pre-show/i);
    expect(
      casaAutoBedSrc("casa", null, null, { displayCue: "tra5" }),
    ).toContain("LR_02_Quiz_Adventure");
    expect(
      casaAutoBedLabel("casa", null, null, { displayCue: "tra5" }),
    ).toMatch(/pre-show/i);
  });

  it("pauses the bed only while the sigla video owns audio", () => {
    expect(casaAutoBedSrc("sigla", null, null, { sigla: "on" })).toBeNull();
    expect(resolveCasaBed("sigla", null, 0, null, null, { sigla: "on" })).toBeNull();
    expect(casaAutoBedLabel("sigla", null, null, { sigla: "on" })).toMatch(
      /sigla/i,
    );
    expect(
      resolveCasaBedOrLobby("sigla", null, 0, null, null, { sigla: "on" }).url,
    ).toContain("LR_01_Lobby_Ambient");
  });

  it("plays countdown bed while special trial is running", () => {
    expect(
      casaAutoBedSrc("quiz", "next_question", "fun", {
        specialTrial: "running",
      }),
    ).toContain("LR_03_Quiz_Countdown");
    expect(
      casaAutoBedLabel("quiz", "next_question", "fun", {
        specialTrial: "running",
      }),
    ).toMatch(/prova speciale/i);
    expect(
      casaAutoBedSrc("quiz", "theme_intro", "romantic", {
        specialTrial: "closing",
      }),
    ).toContain("LR_03_Quiz_Countdown");
  });

  it("lets a local folder override Auto fase", () => {
    const folder = [{ name: "mio.mp3", url: "blob:x" }];
    expect(resolveCasaBed("quiz", folder, 0)).toEqual(folder[0]);
  });
});
