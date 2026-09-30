import { describe, expect, it } from "vitest";
import { casaQrDisplayCommand } from "./casa-qr-display";

describe("casaQrDisplayCommand", () => {
  it("mostra QR solo con toggle help on", () => {
    expect(casaQrDisplayCommand(true, "casa")).toEqual({ type: "show_qr" });
    expect(casaQrDisplayCommand(true, "quiz")).toEqual({ type: "show_qr" });
  });

  it("in casa con QR off pulisce l’overlay (niente QR sticky)", () => {
    expect(casaQrDisplayCommand(false, "casa")).toEqual({ type: "clear" });
  });

  it("fuori casa con QR off non interferisce con le altre sync", () => {
    expect(casaQrDisplayCommand(false, "sigla")).toBeNull();
    expect(casaQrDisplayCommand(false, "pres")).toBeNull();
  });
});
