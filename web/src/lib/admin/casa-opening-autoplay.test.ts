import { describe, expect, it } from "vitest";
import {
  DEFAULT_OPENING_AUTOPLAY_SEC,
  openingAutoplayHoldSeconds,
} from "./casa-opening-autoplay";

describe("openingAutoplayHoldSeconds", () => {
  it("mette 5s su lobby, slide e presenti", () => {
    expect(openingAutoplayHoldSeconds({ beat: "casa", sigla: "idle" })).toBe(
      DEFAULT_OPENING_AUTOPLAY_SEC,
    );
    expect(openingAutoplayHoldSeconds({ beat: "pres", sigla: "idle" })).toBe(5);
    expect(openingAutoplayHoldSeconds({ beat: "regole", sigla: "idle" })).toBe(
      5,
    );
    expect(openingAutoplayHoldSeconds({ beat: "premio", sigla: "idle" })).toBe(
      5,
    );
    expect(
      openingAutoplayHoldSeconds({ beat: "presenti", sigla: "idle" }),
    ).toBe(5);
  });

  it("su sigla warn aspetta 5s, in play aspetta la fine video", () => {
    expect(openingAutoplayHoldSeconds({ beat: "sigla", sigla: "warn" })).toBe(
      5,
    );
    expect(openingAutoplayHoldSeconds({ beat: "sigla", sigla: "on" })).toBeNull();
    expect(
      openingAutoplayHoldSeconds({ beat: "sigla", sigla: "hold" }),
    ).toBeNull();
  });

  it("non schedula stacco né quiz (countdown / motore live)", () => {
    expect(
      openingAutoplayHoldSeconds({ beat: "stacco", sigla: "idle" }),
    ).toBeNull();
    expect(openingAutoplayHoldSeconds({ beat: "quiz", sigla: "idle" })).toBeNull();
  });
});
