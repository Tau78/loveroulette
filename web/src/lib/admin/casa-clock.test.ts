import { describe, expect, it } from "vitest";
import { formatElapsed, formatExact } from "./casa-clock";

describe("casa clock format", () => {
  it("keeps exact time at a fixed HH:MM:SS width", () => {
    expect(formatExact(new Date(2026, 0, 1, 1, 2, 3).getTime())).toBe("01:02:03");
    expect(formatExact(new Date(2026, 0, 1, 23, 59, 9).getTime())).toBe("23:59:09");
    expect(formatExact(new Date(2026, 0, 1, 0, 0, 0).getTime())).toHaveLength(8);
  });

  it("keeps elapsed time at a fixed HH:MM:SS width", () => {
    expect(formatElapsed(0)).toBe("00:00:00");
    expect(formatElapsed(9_000)).toBe("00:00:09");
    expect(formatElapsed(10_000)).toBe("00:00:10");
    expect(formatElapsed(3_661_000)).toBe("01:01:01");
    expect(formatElapsed(-50)).toBe("00:00:00");
  });
});
