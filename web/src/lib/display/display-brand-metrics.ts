/**
 * Cuore e logo Love Roulette sul proiettore (1920×1080).
 * Stessa baseline bassa (bottom) a sx e dx — niente offset diversi.
 * Durante il quiz sono nel footer unificato (DisplayQuizFooter).
 */

/** Inset dal bordo basso del canvas — identico per cuore e logo. */
export const DISPLAY_BRAND_BOTTOM_INSET_CLASS = "bottom-6";

/** Altezza visuale condivisa (cuore e wordmark sulla stessa riga). ×2 vs 72. */
export const DISPLAY_BRAND_MARK_HEIGHT_PX = 144;

export const DISPLAY_FLOATING_HEART_CLASS = "size-[144px]";

export const DISPLAY_BRAND_CORNER_POSITION = {
  heart: "absolute bottom-6 left-6 z-[8]",
  logo: "absolute bottom-6 right-6 z-[8]",
} as const;
