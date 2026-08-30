import { describe, expect, it } from "vitest";
import {
  isLocalSiglaSrc,
  shouldMountSiglaVideo,
} from "@/lib/admin/casa-sigla";

describe("casa-sigla", () => {
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
});
