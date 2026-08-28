import { describe, expect, it } from "vitest";
import {
  isAudioFile,
  isImageFile,
  isVideoFile,
  nextIndex,
} from "./casa-media";

function mockFile(name: string, type = ""): File {
  return { name, type } as File;
}

describe("casa media file guards", () => {
  it("detects audio by mime or extension", () => {
    expect(isAudioFile(mockFile("x.bin", "audio/mpeg"))).toBe(true);
    expect(isAudioFile(mockFile("loop.mp3"))).toBe(true);
    expect(isAudioFile(mockFile("loop.WAV"))).toBe(true);
    expect(isAudioFile(mockFile("clip.mp4"))).toBe(false);
  });

  it("detects video by mime or extension", () => {
    expect(isVideoFile(mockFile("x.bin", "video/mp4"))).toBe(true);
    expect(isVideoFile(mockFile("clip.mov"))).toBe(true);
    expect(isVideoFile(mockFile("slide.png"))).toBe(false);
  });

  it("detects images for av slides", () => {
    expect(isImageFile(mockFile("x.bin", "image/png"))).toBe(true);
    expect(isImageFile(mockFile("foto.JPEG"))).toBe(true);
    expect(isImageFile(mockFile("bed.mp3"))).toBe(false);
  });
});

describe("casa media nextIndex", () => {
  it("returns null for empty lists", () => {
    expect(nextIndex(0, 0, "off")).toBeNull();
    expect(nextIndex(0, 0, "all")).toBeNull();
    expect(nextIndex(0, 0, "one")).toBeNull();
  });

  it("off advances then stops", () => {
    expect(nextIndex(0, 3, "off")).toBe(1);
    expect(nextIndex(2, 3, "off")).toBeNull();
  });

  it("all wraps to the start", () => {
    expect(nextIndex(0, 3, "all")).toBe(1);
    expect(nextIndex(2, 3, "all")).toBe(0);
  });

  it("one stays on the same index", () => {
    expect(nextIndex(0, 3, "one")).toBe(0);
    expect(nextIndex(2, 3, "one")).toBe(2);
  });

  it("one clamps out-of-range indexes; non-finite returns null", () => {
    expect(nextIndex(9, 3, "one")).toBe(2);
    expect(nextIndex(-2, 3, "one")).toBe(0);
    expect(nextIndex(Number.NaN, 3, "off")).toBeNull();
  });
});
