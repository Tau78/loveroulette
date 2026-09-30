import { describe, expect, it } from "vitest";
import { playerEventLabel } from "./event-label";

describe("playerEventLabel", () => {
  it("hides the technical sandbox prefix from participants", () => {
    expect(playerEventLabel("[SANDBOX] Laboratorio Gestore")).toBe(
      "Laboratorio Gestore",
    );
  });

  it("preserves normal event labels", () => {
    expect(playerEventLabel("Club Neon")).toBe("Club Neon");
  });
});
