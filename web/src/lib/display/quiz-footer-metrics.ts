/**
 * Footer quiz unificato — maschera SVG + countdown + cuore/logo (1920×1080).
 */
export const QUIZ_FOOTER_MASK_VIEWBOX = { width: 1200, height: 108 } as const;

export const QUIZ_FOOTER_MASK_BUMP_RADIUS = 48;

export const QUIZ_FOOTER_MASK_PATH = [
  "M 14 108",
  "L 14 58",
  "Q 14 46 30 44",
  "Q 88 28 168 38",
  "Q 248 46 352 42",
  "L 528 42",
  `A ${QUIZ_FOOTER_MASK_BUMP_RADIUS} ${QUIZ_FOOTER_MASK_BUMP_RADIUS} 0 0 1 672 42`,
  "L 848 42",
  "Q 952 46 1032 38",
  "Q 1112 28 1170 44",
  "Q 1186 46 1186 58",
  "L 1186 108",
  "Q 1186 108 1172 108",
  "L 28 108",
  "Q 14 108 14 108",
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
  "h-auto w-[104px] object-contain drop-shadow-[0_6px_24px_rgba(233,30,140,0.55)]";
