import { describe, expect, it } from "vitest";
import { avantiLabel, shouldUseLiveGo, stepAvanti } from "./casa-avanti";

describe("AVANTI flow", () => {
  it("casa starts sigla warn, not hold", () => {
    expect(stepAvanti({ beat: "casa", sigla: "idle", roll: 0, guestCount: 4 })).toEqual({
      beat: "sigla",
      sigla: "warn",
      roll: 0,
    });
  });

  it("during warn, AVANTI starts the video", () => {
    expect(stepAvanti({ beat: "sigla", sigla: "warn", roll: 0, guestCount: 4 }).sigla).toBe(
      "on",
    );
  });

  it("during play or hold, AVANTI goes to presentazione — never hold-as-button", () => {
    expect(stepAvanti({ beat: "sigla", sigla: "on", roll: 0, guestCount: 4 }).beat).toBe(
      "pres",
    );
    expect(stepAvanti({ beat: "sigla", sigla: "hold", roll: 0, guestCount: 4 }).beat).toBe(
      "pres",
    );
    expect(avantiLabel({ beat: "sigla", sigla: "on", roll: 0, guestCount: 4 })).toBe(
      "Avanti",
    );
  });

  it("walks the opening slides", () => {
    expect(stepAvanti({ beat: "pres", sigla: "idle", roll: 0, guestCount: 4 }).beat).toBe(
      "regole",
    );
    expect(stepAvanti({ beat: "regole", sigla: "idle", roll: 0, guestCount: 4 }).beat).toBe(
      "finale",
    );
    expect(stepAvanti({ beat: "finale", sigla: "idle", roll: 0, guestCount: 4 }).beat).toBe(
      "premio",
    );
    expect(stepAvanti({ beat: "premio", sigla: "idle", roll: 0, guestCount: 4 }).beat).toBe(
      "sponsor",
    );
    expect(stepAvanti({ beat: "sponsor", sigla: "idle", roll: 0, guestCount: 4 }).beat).toBe(
      "stasera",
    );
    expect(stepAvanti({ beat: "stasera", sigla: "idle", roll: 0, guestCount: 4 }).beat).toBe(
      "presenti",
    );
  });

  it("uses live GO only after the session left lobby", () => {
    expect(
      shouldUseLiveGo({ live: false, beat: "quiz", runtimeState: "lobby" }),
    ).toBe(false);
    expect(
      shouldUseLiveGo({ live: true, beat: "sigla", runtimeState: "lobby" }),
    ).toBe(false);
    expect(
      shouldUseLiveGo({ live: true, beat: "quiz", runtimeState: "lobby" }),
    ).toBe(false);
    expect(
      shouldUseLiveGo({ live: true, beat: "casa", runtimeState: "quiz" }),
    ).toBe(true);
    expect(
      shouldUseLiveGo({ live: true, beat: "quiz", runtimeState: "quiz" }),
    ).toBe(true);
  });

  it("presenti advances then starts stacco", () => {
    expect(stepAvanti({ beat: "presenti", sigla: "idle", roll: 0, guestCount: 4 }).roll).toBe(
      1,
    );
    expect(
      stepAvanti({ beat: "presenti", sigla: "idle", roll: 3, guestCount: 4 }).beat,
    ).toBe("stacco");
  });
});
