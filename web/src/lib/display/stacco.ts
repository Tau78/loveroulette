/** Overlay stacco 5–4–3–2–1 (CasaPad → /display). */
export const STACCO_KICKER = "Si parte";

/** Durata fissa — anteprima e SCHERMO calcolano la cifra dallo stesso startedAt. */
export const STACCO_SECONDS = 5;

/** Still 16:9 da droppare dopo Gemini. Se manca, resta il canvas CSS. */
export const STACCO_CANVAS_SRC = "/grafiche/stacco/canvas.webp";

export function isStaccoCount(title: string | undefined): boolean {
  return Boolean(title && /^\d+$/.test(title.trim()));
}

export function isStaccoSlide(overlay: {
  type?: string;
  kicker?: string;
  title?: string;
}): boolean {
  return (
    overlay.type === "slide" &&
    overlay.kicker === STACCO_KICKER &&
    isStaccoCount(overlay.title)
  );
}

/**
 * Cifra stacco da clock condiviso.
 * Con `startedAt`: 5…1 poi 0 (fine). Senza: fallback al title numerico.
 */
export function resolveStaccoValue(
  overlay: { title?: string; startedAt?: string },
  nowMs: number = Date.now(),
  totalSeconds: number = STACCO_SECONDS,
): number {
  const startedAt = overlay.startedAt?.trim();
  if (startedAt) {
    const start = Date.parse(startedAt);
    if (Number.isFinite(start)) {
      const elapsedSec = Math.floor((nowMs - start) / 1000);
      return Math.max(0, totalSeconds - elapsedSec);
    }
  }
  const n = Number(overlay.title);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : totalSeconds;
}

/** Payload unico all’ingresso stacco — niente re-POST a ogni secondo. */
export function staccoDisplayCommand(startedAt: string): {
  type: "slide";
  kicker: string;
  title: string;
  startedAt: string;
} {
  return {
    type: "slide",
    kicker: STACCO_KICKER,
    title: String(STACCO_SECONDS),
    startedAt,
  };
}
