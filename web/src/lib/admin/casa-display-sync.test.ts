import { describe, expect, it } from "vitest";
import { casaBeatDisplaySyncKey } from "./casa-display-sync";

describe("casaBeatDisplaySyncKey", () => {
  it("sigla video key ignores presenti churn", () => {
    const base = {
      beat: "sigla" as const,
      sigla: "on" as const,
      help: false,
      presentiKey: "0:Anna:F",
      slideHeadline: null,
      slideKicker: null,
      slideSub: null,
      staccoStartedAt: null,
    };
    expect(casaBeatDisplaySyncKey(base)).toBe("cmd:sigla-video");
    expect(
      casaBeatDisplaySyncKey({ ...base, presentiKey: "1:Bob:M" }),
    ).toBe("cmd:sigla-video");
  });

  it("changes when opening slide copy changes", () => {
    const a = casaBeatDisplaySyncKey({
      beat: "pres",
      sigla: "idle",
      help: false,
      presentiKey: null,
      slideHeadline: "Ciao",
      slideKicker: "K",
      slideSub: "",
      staccoStartedAt: null,
    });
    const b = casaBeatDisplaySyncKey({
      beat: "pres",
      sigla: "idle",
      help: false,
      presentiKey: null,
      slideHeadline: "Ciao!",
      slideKicker: "K",
      slideSub: "",
      staccoStartedAt: null,
    });
    expect(a).not.toBe(b);
  });
});
