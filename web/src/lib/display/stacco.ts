/** Overlay stacco 5–4–3–2–1 (CasaPad → /display). */
export const STACCO_KICKER = "Si parte";

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
