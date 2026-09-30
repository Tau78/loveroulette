import { describe, expect, it, vi, afterEach } from "vitest";
import {
  isLocalSiglaSrc,
  shouldMountSiglaVideo,
  resolveSiglaAudioSrc,
} from "@/lib/admin/casa-sigla";

describe("casa-sigla", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("never mounts a video when missing or empty", () => {
    expect(shouldMountSiglaVideo("/grafiche/video/sigla.mp4", true)).toBe(
      false,
    );
    expect(shouldMountSiglaVideo("", false)).toBe(false);
    expect(shouldMountSiglaVideo(null, false)).toBe(false);
  });

  it("mounts when src is present and not flagged missing", () => {
    expect(shouldMountSiglaVideo("/grafiche/video/sigla.mp4", false)).toBe(
      true,
    );
    expect(shouldMountSiglaVideo("blob:https://x/1", false)).toBe(true);
  });

  it("detects local blob uploads", () => {
    expect(isLocalSiglaSrc("blob:https://x/1")).toBe(true);
    expect(isLocalSiglaSrc("/grafiche/video/sigla.mp4")).toBe(false);
  });

  it("resolveSiglaAudioSrc returns the first reachable candidate", async () => {
    vi.stubGlobal("window", { location: { origin: "http://localhost" } });
    const fetchMock = vi.fn(async (input: RequestInfo) => {
      const href = String(input);
      if (href.includes("/grafiche/audio/sigla.mp3")) {
        return { ok: true, status: 200 } as Response;
      }
      return { ok: false, status: 404 } as Response;
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(resolveSiglaAudioSrc()).resolves.toBe(
      "/grafiche/audio/sigla.mp3",
    );
  });

  it("resolveSiglaAudioSrc returns null when nothing is there", async () => {
    vi.stubGlobal("window", { location: { origin: "http://localhost" } });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 404 }) as Response),
    );
    await expect(resolveSiglaAudioSrc()).resolves.toBeNull();
  });
});
