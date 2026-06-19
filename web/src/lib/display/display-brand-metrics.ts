/**
 * Cuore e logo Love Roulette sul proiettore — angoli bassi, ai lati della ruota.
 * NON metterli nel footer (solo countdown). NON ridurre sotto queste metriche.
 */
export const DISPLAY_FLOATING_HEART_CLASS =
  "h-[min(10.5vw,120px)] w-[min(10.5vw,120px)]";

/** Compact logo: base 80px × 1.5 */
export const DISPLAY_COMPACT_LOGO_CLASS =
  "h-auto w-[min(10.5vw,120px)] object-contain drop-shadow-[0_8px_32px_rgba(233,30,140,0.55)]";

export const DISPLAY_COMPACT_LOGO_EMBED_CLASS = "w-[7.5rem]";

export const DISPLAY_BRAND_CORNER_POSITION = {
  heart: "absolute bottom-4 left-4 z-[8] md:bottom-6 md:left-6",
  logo: "absolute bottom-4 right-4 z-[8] md:bottom-6 md:right-6",
} as const;
