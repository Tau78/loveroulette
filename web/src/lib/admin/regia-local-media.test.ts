import { describe, expect, it } from "vitest";
import {
  classifyMediaFile,
  filterAndSortMediaFiles,
} from "@/lib/admin/regia-local-media";

function mockFile(name: string, type = ""): File {
  return { name, type } as File;
}

describe("regia-local-media", () => {
  it("classifies common video and image extensions", () => {
    expect(classifyMediaFile(mockFile("clip.mp4", "video/mp4"))).toBe("video");
    expect(classifyMediaFile(mockFile("foto.JPG"))).toBe("image");
    expect(classifyMediaFile(mockFile("readme.txt"))).toBeNull();
  });

  it("sorts media files naturally by name", () => {
    const sorted = filterAndSortMediaFiles([
      mockFile("10.png"),
      mockFile("2.png"),
      mockFile("notes.txt"),
      mockFile("1.mp4", "video/mp4"),
    ]);

    expect(sorted.map((file) => file.name)).toEqual([
      "1.mp4",
      "2.png",
      "10.png",
    ]);
  });
});
