import { describe, expect, it } from "vitest";
import {
  readVisualViewportRect,
  visualViewportOverlayStyle,
} from "./useVisualViewportRect";

describe("readVisualViewportRect", () => {
  it("returns null when visualViewport is missing", () => {
    expect(readVisualViewportRect(null)).toBeNull();
    expect(readVisualViewportRect(undefined)).toBeNull();
  });

  it("maps offsetTop / offsetLeft / width / height", () => {
    expect(
      readVisualViewportRect({
        offsetTop: 12,
        offsetLeft: 4,
        width: 640,
        height: 280,
      }),
    ).toEqual({
      top: 12,
      left: 4,
      width: 640,
      height: 280,
    });
  });
});

describe("visualViewportOverlayStyle", () => {
  it("falls back to fixed inset 0 when the API is missing", () => {
    expect(visualViewportOverlayStyle(null)).toEqual({
      position: "fixed",
      inset: 0,
    });
  });

  it("positions the overlay on the visual viewport box", () => {
    expect(
      visualViewportOverlayStyle({
        top: 8,
        left: 2,
        width: 700,
        height: 300,
      }),
    ).toEqual({
      position: "fixed",
      top: 8,
      left: 2,
      width: 700,
      height: 300,
    });
  });
});
