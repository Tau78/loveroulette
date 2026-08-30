import { describe, expect, it } from "vitest";
import {
  clampRect,
  clampResize,
  clampResizeNoOverlap,
  findAddPlacement,
  FREE_PIXEL_GRID,
  magnetSnap,
  magnetSnapPos,
  overlapsAny,
  pushApart,
  rectsOverlap,
  scaleToFit,
  canvasToFillView,
  SNAP_MAGNET_PX,
  snap,
} from "./layout-math";

describe("layout-math", () => {
  it("snaps to an explicit grid", () => {
    expect(snap(0)).toBe(0);
    expect(snap(3)).toBe(0);
    expect(snap(4)).toBe(8);
    expect(snap(11)).toBe(8);
    expect(snap(12)).toBe(16);
    expect(snap(13)).toBe(16);
    expect(snap(15, 10)).toBe(20);
    expect(snap(37, FREE_PIXEL_GRID)).toBe(37);
  });

  it("magnet-snaps only near targets within magnet distance", () => {
    expect(magnetSnap(50, [0, 100], SNAP_MAGNET_PX)).toBe(50);
    expect(magnetSnap(5, [0, 100], SNAP_MAGNET_PX)).toBe(0);
    expect(magnetSnap(97, [0, 100], SNAP_MAGNET_PX)).toBe(100);
    // Outside magnet band → free
    expect(magnetSnap(11, [0, 20], 8)).toBe(11);
    // At magnet distance → snaps
    expect(magnetSnap(14, [0, 20], 8)).toBe(20);
  });

  it("magnet-snaps position to canvas and neighbor edges", () => {
    const others = [{ x: 200, y: 100, w: 80, h: 60 }];
    // Near left edge of neighbor → flush right against it (x = 200 - 100 = 100)
    expect(
      magnetSnapPos(102, 40, 100, 80, 400, 300, others, 8),
    ).toEqual({ x: 100, y: 40 });
    // Far from magnets → free pixel (y magnets: 0, 220, 100, 160, 20, 80)
    expect(
      magnetSnapPos(55, 150, 100, 80, 400, 300, others, 8),
    ).toEqual({ x: 55, y: 150 });
    // Near canvas origin
    expect(
      magnetSnapPos(6, 3, 100, 80, 400, 300, [], 8),
    ).toEqual({ x: 0, y: 0 });
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

  it("findAddPlacement returns null when the board is fully packed", () => {
    const wall = { x: 0, y: 0, w: 200, h: 200 };
    const placed = findAddPlacement(
      { w: 160, h: 100 },
      [wall],
      200,
      200,
      160,
      100,
    );
    expect(placed).toBeNull();
  });

  it("findAddPlacement prefers a free slot at preferred size", () => {
    const placed = findAddPlacement(
      { w: 100, h: 80 },
      [{ x: 200, y: 200, w: 80, h: 60 }],
      400,
      300,
      80,
      60,
      16,
      24,
    );
    expect(placed).toEqual({ x: 16, y: 24, w: 100, h: 80 });
  });

  it("findAddPlacement shrinks to min when preferred does not fit", () => {
    // 300×200 canvas; blocker leaves only a 160×100 corner free.
    const blocker = { x: 0, y: 0, w: 300, h: 100 };
    const placed = findAddPlacement(
      { w: 280, h: 180 },
      [blocker],
      300,
      200,
      160,
      100,
    );
    expect(placed).not.toBeNull();
    expect(placed!.w).toBe(160);
    expect(placed!.h).toBe(100);
    expect(
      rectsOverlap(
        { x: placed!.x, y: placed!.y, w: placed!.w, h: placed!.h },
        blocker,
      ),
    ).toBe(false);
  });

  it("findAddPlacement can place as collapsed header when only that fits", () => {
    // Leave a 120×36 strip free at the bottom.
    const blocker = { x: 0, y: 0, w: 400, h: 164 };
    const placed = findAddPlacement(
      { w: 280, h: 180 },
      [blocker],
      400,
      200,
      120,
      80,
      40,
      40,
      36,
    );
    expect(placed).toEqual({ x: 40, y: 164, w: 120, h: 36 });
  });

  it("scales to fit including upscale on large screens", () => {
    expect(scaleToFit(1200, 700, 600, 350)).toBe(0.5);
    expect(scaleToFit(400, 300, 800, 600)).toBe(2);
    expect(scaleToFit(1200, 700, 1200, 350)).toBe(0.5);
    expect(scaleToFit(0, 100, 200, 200)).toBe(1);
    expect(scaleToFit(100, 0, 200, 200)).toBe(1);
    expect(scaleToFit(100, 100, 0, 200)).toBe(1);
  });

  it("expands logical canvas so a uniform scale fills the view", () => {
    const phone = canvasToFillView(1200, 700, 844, 390);
    expect(phone.scale).toBeCloseTo(390 / 700);
    expect(phone.canvasH).toBe(700);
    expect(phone.canvasW).toBeGreaterThan(1200);
    expect(phone.canvasW * phone.scale).toBeCloseTo(844, 0);
    expect(phone.canvasH * phone.scale).toBeCloseTo(390, 0);

    const tall = canvasToFillView(1200, 700, 1180, 820);
    expect(tall.canvasW).toBe(1200);
    expect(tall.canvasH).toBeGreaterThan(700);
    expect(tall.canvasW * tall.scale).toBeCloseTo(1180, 0);
    expect(tall.canvasH * tall.scale).toBeCloseTo(820, 0);
  });

  it("clamps resize to free pixels and min size", () => {
    expect(clampResize(100, 100, 50, 40, 400, 300, 120, 80)).toEqual({
      w: 120,
      h: 80,
    });
    // Odd sizes survive (no 8px hard grid)
    expect(clampResize(100, 100, 173, 97, 400, 300, 120, 80)).toEqual({
      w: 173,
      h: 97,
    });
    expect(clampResize(350, 250, 200, 200, 400, 300, 120, 80)).toEqual({
      w: 50,
      h: 50,
    });
  });

  it("blocks resize growth into neighbors without blocking free resize", () => {
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
    // Grows freely when no neighbor in the way
    const free = clampResizeNoOverlap(
      10,
      10,
      157,
      93,
      400,
      300,
      120,
      80,
      [],
    );
    expect(free).toEqual({ w: 157, h: 93 });
  });

  it("pushApart tolerates invalid grid without hanging", () => {
    const moving = { x: 0, y: 0, w: 40, h: 40 };
    const blocker = { x: 0, y: 0, w: 40, h: 40 };
    const next = pushApart(moving, [blocker], 400, 300, 0);
    expect(next).not.toBeNull();
    expect(rectsOverlap({ ...moving, ...next! }, blocker)).toBe(false);
  });
});
