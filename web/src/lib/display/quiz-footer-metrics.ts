/**
 * Footer quiz unificato — maschera SVG + countdown + cuore/logo (1920×1080).
 * La maschera copre tutta la larghezza canvas fino a cuore e logo ai lati.
 */
export const QUIZ_FOOTER_MASK_VIEWBOX = { width: 1920, height: 108 } as const;

export const QUIZ_FOOTER_MASK_BUMP_RADIUS = 48;

export const QUIZ_FOOTER_MASK_PATH = [
  "M 40 108",
  "L 40 56",
  "Q 40 44 56 42",
  "Q 140 24 280 34",
  "Q 420 42 580 40",
  "L 912 40",
  `A ${QUIZ_FOOTER_MASK_BUMP_RADIUS} ${QUIZ_FOOTER_MASK_BUMP_RADIUS} 0 0 1 1008 40`,
  "L 1340 40",
  "Q 1500 42 1640 34",
  "Q 1780 24 1864 42",
  "Q 1880 44 1880 56",
  "L 1880 108",
  "Z",
].join(" ");

export const QUIZ_FOOTER_COUNTDOWN_RING_RADIUS = 30;
export const QUIZ_FOOTER_COUNTDOWN_VIEWBOX = 64;
export const QUIZ_FOOTER_COUNTDOWN_SLOT_CLASS =
  "relative flex size-[112px] items-center justify-center";

export const QUIZ_FOOTER_COUNTDOWN_DIGIT_CLASS =
  "relative font-display font-bold tabular-nums text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.85)] text-[60px]";

export const QUIZ_FOOTER_MASK_BAR_CLASS = "relative h-[80px] w-full";

export const QUIZ_FOOTER_BRAND_HEART_CLASS = "size-[104px]";

export const QUIZ_FOOTER_BRAND_LOGO_CLASS =
  "h-auto w-[156px] object-contain drop-shadow-[0_6px_24px_rgba(233,30,140,0.55)]";
