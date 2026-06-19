import { describe, expect, it } from "vitest";
import { DEMO_JOIN_CODE, isDemoJoinCode } from "./demo-event";

describe("isDemoJoinCode", () => {
  it("matches DEMO01 case-insensitively", () => {
    expect(isDemoJoinCode(DEMO_JOIN_CODE)).toBe(true);
    expect(isDemoJoinCode("demo01")).toBe(true);
  });

  it("rejects other slugs", () => {
    expect(isDemoJoinCode("DEMO02")).toBe(false);
    expect(isDemoJoinCode("ABCDEF")).toBe(false);
  });
});
