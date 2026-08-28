export type Rect = { x: number; y: number; w: number; h: number };

export function snap(n: number, grid = 8): number {
  if (!Number.isFinite(n) || grid <= 0) return 0;
  return Math.round(n / grid) * grid;
}

/** Axis-aligned bounding-box overlap (touching edges = no overlap). */
export function rectsOverlap(a: Rect, b: Rect): boolean {
  return !(
    a.x + a.w <= b.x ||
    b.x + b.w <= a.x ||
    a.y + a.h <= b.y ||
    b.y + b.h <= a.y
  );
}

export function clampRect(
  x: number,
  y: number,
  w: number,
  h: number,
  boundW: number,
  boundH: number,
): { x: number; y: number } {
  const maxX = Math.max(0, boundW - w);
  const maxY = Math.max(0, boundH - h);
  return {
    x: Math.min(Math.max(0, x), maxX),
    y: Math.min(Math.max(0, y), maxY),
  };
}

/**
 * If `moving` overlaps any of `others`, nudge it to the nearest free slot
 * (right → left → down → up, in snap steps). Falls back to clamped position.
 */
export function pushApart(
  moving: Rect,
  others: Rect[],
  boundW: number,
  boundH: number,
  grid = 8,
): { x: number; y: number } {
  const pos = clampRect(moving.x, moving.y, moving.w, moving.h, boundW, boundH);
  const stepGrid = Number.isFinite(grid) && grid > 0 ? grid : 8;

  const hits = (x: number, y: number) =>
    others.some((o) =>
      rectsOverlap({ x, y, w: moving.w, h: moving.h }, o),
    );

  if (!hits(pos.x, pos.y)) return pos;

  const limit = Math.max(boundW, boundH) + stepGrid;
  for (let step = stepGrid; step <= limit; step += stepGrid) {
    const candidates = [
      { x: pos.x + step, y: pos.y },
      { x: pos.x - step, y: pos.y },
      { x: pos.x, y: pos.y + step },
      { x: pos.x, y: pos.y - step },
    ];
    for (const c of candidates) {
      const clamped = clampRect(c.x, c.y, moving.w, moving.h, boundW, boundH);
      if (!hits(clamped.x, clamped.y)) return clamped;
    }
  }

  return pos;
}

/** Uniform scale ≤ 1 so content fits in the view. */
export function scaleToFit(
  contentW: number,
  contentH: number,
  viewW: number,
  viewH: number,
): number {
  if (contentW <= 0 || contentH <= 0 || viewW <= 0 || viewH <= 0) return 1;
  return Math.min(1, viewW / contentW, viewH / contentH);
}
