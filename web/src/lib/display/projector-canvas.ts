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

/**
 * Fascia bassa riservata — logo Love Roulette (dx), sync indicator (sx), footer quiz/finalisti.
 * Il contenuto del `<main>` non deve mai invadere questa area (1920×1080).
 */
export const PROJECTOR_BOTTOM_SAFE_ZONE_PX = 152;

/** Padding bottom sul main quando il footer finalisti non è visibile. */
export const PROJECTOR_MAIN_BOTTOM_SAFE_CLASS = "pb-[152px]";

/** Footer finalisti a tre colonne — altezza minima nel flex column. */
export const PROJECTOR_FINALISTS_FOOTER_MIN_CLASS = "shrink-0 min-h-[168px]";

/** Finali — fascia titolo fissa (px su 1080p), corpo sotto con minmax(0,1fr). */
export const PROJECTOR_FINALS_HEADER_HEIGHT_PX = 220;

export const PROJECTOR_FINALS_ZONE_GRID_CLASS =
  "grid h-full min-h-0 w-full grid-rows-[220px_minmax(0,1fr)] gap-3";
