import { describe, expect, it } from "vitest";
import {
  clampRect,
  clampResize,
  clampResizeNoOverlap,
  overlapsAny,
  pushApart,
  rectsOverlap,
  scaleToFit,
  snap,
} from "./layout-math";

describe("layout-math", () => {
  it("snaps to the default 8px grid", () => {
    expect(snap(0)).toBe(0);
    expect(snap(3)).toBe(0);
    expect(snap(4)).toBe(8);
    expect(snap(11)).toBe(8);
    expect(snap(12)).toBe(16);
    expect(snap(13)).toBe(16);
    expect(snap(15, 10)).toBe(20);
  });

  it("detects AABB overlap (touching edges do not overlap)", () => {
    const a = { x: 0, y: 0, w: 100, h: 80 };
    expect(rectsOverlap(a, { x: 50, y: 40, w: 20, h: 20 })).toBe(true);
    expect(rectsOverlap(a, { x: 100, y: 0, w: 40, h: 40 })).toBe(false);
    expect(rectsOverlap(a, { x: 0, y: 80, w: 40, h: 40 })).toBe(false);
    expect(rectsOverlap(a, { x: 99, y: 0, w: 40, h: 40 })).toBe(true);
  });

  it("clamps a rect inside bounds", () => {
    expect(clampRect(-20, -10, 100, 80, 200, 160)).toEqual({ x: 0, y: 0 });
    expect(clampRect(150, 100, 100, 80, 200, 160)).toEqual({ x: 100, y: 80 });
    expect(clampRect(40, 40, 100, 80, 200, 160)).toEqual({ x: 40, y: 40 });
  });

  it("pushes overlapping widgets apart", () => {
    const moving = { x: 0, y: 0, w: 100, h: 80 };
    const blocker = { x: 0, y: 0, w: 100, h: 80 };
    const next = pushApart(moving, [blocker], 400, 300);
    expect(next).not.toBeNull();
    expect(rectsOverlap({ ...moving, ...next! }, blocker)).toBe(false);
    expect(next!.x % 8).toBe(0);
    expect(next!.y % 8).toBe(0);
  });

  it("keeps a free position when there is no overlap", () => {
    expect(
      pushApart(
        { x: 16, y: 24, w: 80, h: 60 },
        [{ x: 200, y: 200, w: 80, h: 60 }],
        400,
        300,
      ),
    ).toEqual({ x: 16, y: 24 });
  });

  it("returns null when no free slot exists", () => {
    const moving = { x: 0, y: 0, w: 200, h: 200 };
    const wall = { x: 0, y: 0, w: 200, h: 200 };
    expect(pushApart(moving, [wall], 200, 200)).toBeNull();
  });

  it("scales to fit including upscale on large screens", () => {
    expect(scaleToFit(1200, 700, 600, 350)).toBe(0.5);
    expect(scaleToFit(400, 300, 800, 600)).toBe(2);
    expect(scaleToFit(1200, 700, 1200, 350)).toBe(0.5);
    expect(scaleToFit(0, 100, 200, 200)).toBe(1);
    expect(scaleToFit(100, 0, 200, 200)).toBe(1);
    expect(scaleToFit(100, 100, 0, 200)).toBe(1);
  });

  it("clamps resize within canvas and min size", () => {
    expect(clampResize(100, 100, 50, 40, 400, 300, 160, 100)).toEqual({
      w: 160,
      h: 104,
    });
    expect(clampResize(350, 250, 200, 200, 400, 300, 160, 100)).toEqual({
      w: 50,
      h: 50,
    });
  });

  it("blocks resize growth into neighbors", () => {
    const blocker = { x: 200, y: 100, w: 100, h: 100 };
    const sized = clampResizeNoOverlap(
      100,
      100,
      200,
      80,
      400,
      300,
      40,
      40,
      [blocker],
    );
    expect(
      overlapsAny({ x: 100, y: 100, w: sized.w, h: sized.h }, [blocker]),
    ).toBe(false);
    expect(sized.w).toBeLessThanOrEqual(100);
  });

  it("pushApart tolerates invalid grid without hanging", () => {
    const moving = { x: 0, y: 0, w: 40, h: 40 };
    const blocker = { x: 0, y: 0, w: 40, h: 40 };
    const next = pushApart(moving, [blocker], 400, 300, 0);
    expect(next).not.toBeNull();
    expect(rectsOverlap({ ...moving, ...next! }, blocker)).toBe(false);
  });
});
