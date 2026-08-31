import { describe, expect, it } from "vitest";
import { playerPresentKey } from "./player-present";

describe("playerPresentKey", () => {
  it("changes when the on-stage player changes", () => {
    expect(playerPresentKey("Luca", "M")).not.toBe(playerPresentKey("Sara", "F"));
    expect(playerPresentKey("luca", "M")).toBe(playerPresentKey("LUCA", "M"));
  });
});
