export type Rect = { x: number; y: number; w: number; h: number };

/** Placement result for adding a widget (may shrink size if board is packed). */
export type Placement = { x: number; y: number; w: number; h: number };

/** Soft magnet distance for edges / neighbors (drag). */
export const SNAP_MAGNET_PX = 8;

/** Free-pixel resize / placement step (1 = no hard grid). */
export const FREE_PIXEL_GRID = 1;

export function snap(n: number, grid = 8): number {
  if (!Number.isFinite(n) || grid <= 0) return 0;
  return Math.round(n / grid) * grid;
}

/**
 * Soft magnet: pull `n` to the nearest target if within `magnet` px;
 * otherwise keep free pixels (rounded).
 */
export function magnetSnap(
  n: number,
  targets: number[],
  magnet = SNAP_MAGNET_PX,
): number {
  if (!Number.isFinite(n)) return 0;
  const mag = Number.isFinite(magnet) && magnet > 0 ? magnet : SNAP_MAGNET_PX;
  let best = Math.round(n);
  let bestDist = Infinity;
  for (const t of targets) {
    if (!Number.isFinite(t)) continue;
    const d = Math.abs(n - t);
    if (d <= mag && d < bestDist) {
      bestDist = d;
      best = Math.round(t);
    }
  }
  return best;
}

/**
 * Magnet-snap a widget origin to canvas edges and other widget edges/alignments.
 */
export function magnetSnapPos(
  x: number,
  y: number,
  w: number,
  h: number,
  boundW: number,
  boundH: number,
  others: Rect[],
  magnet = SNAP_MAGNET_PX,
): { x: number; y: number } {
  const xTargets: number[] = [0, boundW - w];
  const yTargets: number[] = [0, boundH - h];
  for (const o of others) {
    // Flush left/right of neighbor, align left/right edges.
    xTargets.push(o.x, o.x + o.w, o.x - w, o.x + o.w - w);
    yTargets.push(o.y, o.y + o.h, o.y - h, o.y + o.h - h);
  }
  return {
    x: magnetSnap(x, xTargets, magnet),
    y: magnetSnap(y, yTargets, magnet),
  };
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
  grid = FREE_PIXEL_GRID,
): { x: number; y: number } | null {
  const pos = clampRect(moving.x, moving.y, moving.w, moving.h, boundW, boundH);
  const stepGrid =
    Number.isFinite(grid) && grid > 0 ? grid : FREE_PIXEL_GRID;

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

/**
 * Find a free slot for a new widget (never overlaps).
 * Tries preferred size → min size → collapsed header height.
 * Returns null if the board has no free slot.
 */
export function findAddPlacement(
  preferred: { w: number; h: number },
  others: Rect[],
  boundW: number,
  boundH: number,
  minW: number,
  minH: number,
  startX = 40,
  startY = 40,
  collapsedH?: number,
): Placement | null {
  const trySize = (w: number, h: number): Placement | null => {
    const pos = pushApart(
      { x: startX, y: startY, w, h },
      others,
      boundW,
      boundH,
    );
    return pos ? { x: pos.x, y: pos.y, w, h } : null;
  };

  const preferredFit = trySize(preferred.w, preferred.h);
  if (preferredFit) return preferredFit;

  if (preferred.w !== minW || preferred.h !== minH) {
    const minFit = trySize(minW, minH);
    if (minFit) return minFit;
  }

  if (
    typeof collapsedH === "number" &&
    Number.isFinite(collapsedH) &&
    collapsedH > 0 &&
    collapsedH !== minH
  ) {
    const collapsedFit = trySize(minW, collapsedH);
    if (collapsedFit) return collapsedFit;
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

/**
 * Grow the logical canvas on the leftover axis so a uniform scale fills the
 * view (no letterbox). Widget coords stay in the original 1200×700 region;
 * extra space is usable in edit.
 */
/** Below this the iOS WKWebView is collapsing (PIN keyboard / Edit reflow). */
export const MIN_USABLE_PLANCIA_W = 160;
export const MIN_USABLE_PLANCIA_H = 120;

export function isUsablePlanciaView(viewW: number, viewH: number): boolean {
  return viewW >= MIN_USABLE_PLANCIA_W && viewH >= MIN_USABLE_PLANCIA_H;
}

/** Phone / short landscape deck — scale the Default 1200×700 onto the view. */
export function isCompactPlanciaView(viewW: number, viewH: number): boolean {
  if (!isUsablePlanciaView(viewW, viewH)) return false;
  return Math.min(viewW, viewH) < 500 || viewH < 400;
}

/**
 * Ignore collapsed / jittery measurements so Casa cannot fall to 0×0
 * (same failure as the PIN gate on iOS WKWebView).
 */
export function nextStableDeckView(
  prev: { w: number; h: number },
  next: { w: number; h: number },
): { w: number; h: number } | null {
  if (!isUsablePlanciaView(next.w, next.h)) return null;
  if (Math.abs(next.w - prev.w) < 1 && Math.abs(next.h - prev.h) < 1) {
    return null;
  }
  return { w: next.w, h: next.h };
}

export function canvasToFillView(
  baseW: number,
  baseH: number,
  viewW: number,
  viewH: number,
): { canvasW: number; canvasH: number; scale: number } {
  if (baseW <= 0 || baseH <= 0 || viewW <= 0 || viewH <= 0) {
    return { canvasW: Math.max(0, baseW), canvasH: Math.max(0, baseH), scale: 1 };
  }
  const scaleX = viewW / baseW;
  const scaleY = viewH / baseH;
  if (scaleY <= scaleX) {
    const scale = scaleY;
    return {
      canvasW: Math.max(baseW, Math.round(viewW / scale)),
      canvasH: baseH,
      scale,
    };
  }
  const scale = scaleX;
  return {
    canvasW: baseW,
    canvasH: Math.max(baseH, Math.round(viewH / scale)),
    scale,
  };
}

/**
 * Clamp a resized box: min size, stay inside canvas.
 * Default grid=1 → free pixel resize (no hard 8px snap).
 */
export function clampResize(
  x: number,
  y: number,
  w: number,
  h: number,
  boundW: number,
  boundH: number,
  minW: number,
  minH: number,
  grid = FREE_PIXEL_GRID,
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
 * Uses free-pixel steps by default so reasonable resize is not blocked.
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
  grid = FREE_PIXEL_GRID,
): { w: number; h: number } {
  const sized = clampResize(x, y, w, h, boundW, boundH, minW, minH, grid);
  const step = Number.isFinite(grid) && grid > 0 ? grid : FREE_PIXEL_GRID;
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
