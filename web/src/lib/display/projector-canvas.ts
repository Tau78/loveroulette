/**
 * Layout bloccato Full HD (1920×1080) — anteprima e proiettore identici.
 * Tutte le metriche sono px fissi calibrati su questo frame.
 */
export const PROJECTOR_CANVAS = {
  width: 1920,
  height: 1080,
} as const;

/** Roulette animata estrazione (canvas 1920×1080) */
export const PROJECTOR_EXTRACTION_WHEEL_PX = 520;

/** Roulette sullo sfondo */
export const PROJECTOR_ROULETTE_CLASS =
  "h-auto w-[880px] max-h-[842px] object-contain";

/** Logo fuori quiz — angolo basso-destra */
export const PROJECTOR_LOBBY_LOGO_CLASS =
  "h-auto w-[120px] object-contain drop-shadow-[0_8px_32px_rgba(233,30,140,0.55)]";

export const PROJECTOR_LOBBY_LOGO_FULL_CLASS =
  "h-auto w-[320px] object-contain drop-shadow-[0_8px_32px_rgba(233,30,140,0.55)]";

/** Header proiettore (badge fase) */
export const PROJECTOR_HEADER_CLASS =
  "relative z-10 flex shrink-0 items-center justify-end gap-3 px-10 py-5";

/** Quiz — header domanda */
export const PROJECTOR_QUIZ_HEADER_HEIGHT = "h-[152px]";

/** Quiz — contenuto centrale padding */
export const PROJECTOR_QUIZ_MAIN_PAD = "px-4 py-3";
