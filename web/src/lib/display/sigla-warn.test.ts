import { describe, expect, it } from "vitest";
import {
  SIGLA_WARN_LINE_1,
  SIGLA_WARN_LINE_2,
  SIGLA_WARN_SLIDE,
  isSiglaWarnSlide,
} from "./sigla-warn";

describe("sigla warn copy", () => {
  it("is the two-line hold message", () => {
    expect(SIGLA_WARN_LINE_1).toBe("STIAMO PER INIZIARE");
    expect(SIGLA_WARN_LINE_2).toBe("PRENDI POSTO");
    expect(SIGLA_WARN_SLIDE).toEqual({
      type: "slide",
      title: "STIAMO PER INIZIARE",
      body: "PRENDI POSTO",
    });
  });

  it("matches only the warn slide overlay", () => {
    expect(isSiglaWarnSlide(SIGLA_WARN_SLIDE)).toBe(true);
    expect(
      isSiglaWarnSlide({ type: "slide", title: "SIGLA", kicker: "Tra un attimo" }),
    ).toBe(false);
    expect(isSiglaWarnSlide({ type: "clear" })).toBe(false);
  });
});
