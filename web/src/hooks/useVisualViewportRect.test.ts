import { describe, expect, it } from "vitest";
import {
  isUsableVisualViewport,
  nextStableVisualViewportRect,
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

describe("nextStableVisualViewportRect", () => {
  const good = { top: 0, left: 0, width: 852, height: 310 };

  it("keeps a usable viewport", () => {
    expect(isUsableVisualViewport(good)).toBe(true);
    expect(nextStableVisualViewportRect(null, good)).toEqual(good);
  });

  it("ignores a collapsed WKWebView and keeps the last box", () => {
    expect(isUsableVisualViewport({ top: 0, left: 0, width: 852, height: 0 })).toBe(
      false,
    );
    expect(
      nextStableVisualViewportRect(good, { top: 0, left: 0, width: 852, height: 8 }),
    ).toEqual(good);
  });
});
