import { describe, expect, it } from "vitest";
import {
  DEFAULT_CASA_AUDIO_ROUTE,
  canPickCasaLocalAudioOutput,
  casaAudioOptionId,
  isRemoteAudioRoute,
  parseCasaAudioRoute,
} from "./casa-audio-route";

describe("casa audio route", () => {
  it("parses local / projector / vercel", () => {
    expect(parseCasaAudioRoute({ kind: "projector" }).kind).toBe("projector");
    expect(parseCasaAudioRoute({ kind: "vercel" }).label).toBe("Vercel");
    expect(
      parseCasaAudioRoute({ kind: "local", sinkId: "abc", label: "AirPods" }),
    ).toEqual({ kind: "local", sinkId: "abc", label: "AirPods" });
    expect(parseCasaAudioRoute(null)).toEqual(DEFAULT_CASA_AUDIO_ROUTE);
  });

  it("treats projector and vercel as remote (no phone speaker)", () => {
    expect(isRemoteAudioRoute({ kind: "local", label: "iPhone" })).toBe(false);
    expect(isRemoteAudioRoute({ kind: "projector", label: "Proiettore" })).toBe(
      true,
    );
    expect(isRemoteAudioRoute({ kind: "vercel", label: "Vercel" })).toBe(true);
  });

  it("does not expose a local picker without the browser API", () => {
    expect(canPickCasaLocalAudioOutput()).toBe(false);
  });

  it("builds stable option ids", () => {
    expect(casaAudioOptionId({ kind: "projector", label: "P" })).toBe(
      "projector",
    );
    expect(casaAudioOptionId({ kind: "local", sinkId: "x", label: "X" })).toBe(
      "local:x",
    );
  });
});
