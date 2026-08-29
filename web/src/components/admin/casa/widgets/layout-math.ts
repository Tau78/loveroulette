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
 * (cardinal + diagonal, in snap steps). Returns null if no free slot exists.
 */
export function pushApart(
  moving: Rect,
  others: Rect[],
  boundW: number,
  boundH: number,
  grid = 8,
): { x: number; y: number } | null {
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
      { x: pos.x + step, y: pos.y + step },
      { x: pos.x + step, y: pos.y - step },
      { x: pos.x - step, y: pos.y + step },
      { x: pos.x - step, y: pos.y - step },
    ];
    for (const c of candidates) {
      const clamped = clampRect(c.x, c.y, moving.w, moving.h, boundW, boundH);
      if (!hits(clamped.x, clamped.y)) return clamped;
    }
  }

  return null;
}

/** True if `rect` overlaps any of `others`. */
export function overlapsAny(rect: Rect, others: Rect[]): boolean {
  return others.some((o) => rectsOverlap(rect, o));
}

/** Uniform scale so content fits the view (may upscale on large screens). */
export function scaleToFit(
  contentW: number,
  contentH: number,
  viewW: number,
  viewH: number,
): number {
  if (contentW <= 0 || contentH <= 0 || viewW <= 0 || viewH <= 0) return 1;
  return Math.min(viewW / contentW, viewH / contentH);
}

/** Clamp a resized box: min size, stay inside canvas, snap to grid. */
export function clampResize(
  x: number,
  y: number,
  w: number,
  h: number,
  boundW: number,
  boundH: number,
  minW: number,
  minH: number,
  grid = 8,
): { w: number; h: number } {
  const maxW = Math.max(0, boundW - x);
  const maxH = Math.max(0, boundH - y);
  const loW = Math.min(minW, maxW);
  const loH = Math.min(minH, maxH);
  let ww = snap(Math.min(Math.max(w, loW), maxW), grid);
  let hh = snap(Math.min(Math.max(h, loH), maxH), grid);
  ww = Math.min(Math.max(ww, loW), maxW);
  hh = Math.min(Math.max(hh, loH), maxH);
  return { w: ww, h: hh };
}

/**
 * SE-resize clamp that forbids overlap with other widgets.
 * Shrinks width/height from the desired size until free (or min size).
 */
export function clampResizeNoOverlap(
  x: number,
  y: number,
  w: number,
  h: number,
  boundW: number,
  boundH: number,
  minW: number,
  minH: number,
  others: Rect[],
  grid = 8,
): { w: number; h: number } {
  const sized = clampResize(x, y, w, h, boundW, boundH, minW, minH, grid);
  const step = Number.isFinite(grid) && grid > 0 ? grid : 8;
  let ww = sized.w;
  let hh = sized.h;
  const loW = Math.min(minW, Math.max(0, boundW - x));
  const loH = Math.min(minH, Math.max(0, boundH - y));

  const hits = () => overlapsAny({ x, y, w: ww, h: hh }, others);
  if (!hits()) return { w: ww, h: hh };

  // Shrink toward min until free. Prefer cutting the larger excess first.
  let guard = Math.ceil((ww + hh) / step) + 4;
  while (hits() && guard-- > 0 && (ww > loW || hh > loH)) {
    if (ww > loW && (hh <= loH || ww >= hh)) {
      ww = Math.max(loW, ww - step);
    } else if (hh > loH) {
      hh = Math.max(loH, hh - step);
    } else {
      break;
    }
  }

  // Still overlapping at min → refuse growth: return min box (caller may keep prev).
  return { w: ww, h: hh };
}
