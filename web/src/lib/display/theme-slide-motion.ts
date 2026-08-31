import type { TargetAndTransition, Transition } from "framer-motion";
import {
  isQuizThemeSlideCategory,
  type QuizThemeSlideCategory,
} from "@/lib/display/quiz-theme-slides";

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;
const EASE_OUT_BACK = [0.34, 1.56, 0.64, 1] as const;

export type ThemeArtMotion = {
  /** Extra scale so pan/zoom never shows empty edges. */
  className: string;
  initial: TargetAndTransition;
  animate: TargetAndTransition;
  transition: Transition;
};

export type ThemeTextMotion = {
  kicker: {
    initial: TargetAndTransition;
    animate: TargetAndTransition;
    transition: Transition;
  };
  title: {
    initial: TargetAndTransition;
    animate: TargetAndTransition;
    transition: Transition;
  };
  subtitle: {
    initial: TargetAndTransition;
    animate: TargetAndTransition;
    transition: Transition;
  };
};

/** Ken Burns / drift continuo — uno stile per categoria. */
export const THEME_ART_MOTION: Record<QuizThemeSlideCategory, ThemeArtMotion> = {
  /** Lounge: zoom lento verso il cocktail. */
  lifestyle: {
    className: "scale-[1.18]",
    initial: { scale: 1.08, x: "0%", y: "0%" },
    animate: { scale: 1.2, x: "-3%", y: "2%" },
    transition: { duration: 14, ease: "linear", repeat: Infinity, repeatType: "reverse" },
  },
  /** Romanticismo: deriva verso l’alto tra i cuori. */
  romantic: {
    className: "scale-[1.2]",
    initial: { scale: 1.12, x: "0%", y: "4%" },
    animate: { scale: 1.22, x: "0%", y: "-4%" },
    transition: { duration: 16, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" },
  },
  /** Avventura: spinta dinamica dal basso-destra (bussola). */
  adventure: {
    className: "scale-[1.28]",
    initial: { scale: 1.14, x: "6%", y: "5%" },
    animate: { scale: 1.28, x: "-4%", y: "-3%" },
    transition: { duration: 11, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" },
  },
  /** Valori: zoom-out solenne dalle bilance. */
  values: {
    className: "scale-[1.22]",
    initial: { scale: 1.24, x: "0%", y: "0%" },
    animate: { scale: 1.1, x: "0%", y: "0%" },
    transition: { duration: 15, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" },
  },
  /** Divertimento: zoom energico con leggero sway. */
  fun: {
    className: "scale-[1.24]",
    initial: { scale: 1.1, x: "-3%", y: "0%", rotate: -0.6 },
    animate: { scale: 1.24, x: "3%", y: "0%", rotate: 0.6 },
    transition: { duration: 9, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" },
  },
  /** Intimità: pan lento sulle nastri + soft zoom. */
  intimacy: {
    className: "scale-[1.26]",
    initial: { scale: 1.12, x: "-5%", y: "2%" },
    animate: { scale: 1.22, x: "5%", y: "-2%" },
    transition: { duration: 18, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" },
  },
};

const FALLBACK_ART: ThemeArtMotion = THEME_ART_MOTION.lifestyle;

/** Ingresso copy: grosso, veloce, scenico — variato per categoria. */
export const THEME_TEXT_MOTION: Record<QuizThemeSlideCategory, ThemeTextMotion> = {
  lifestyle: {
    kicker: {
      initial: { opacity: 0, y: -28, letterSpacing: "0.8em" },
      animate: { opacity: 1, y: 0, letterSpacing: "0.45em" },
      transition: { duration: 0.35, ease: EASE_OUT_EXPO },
    },
    title: {
      initial: { opacity: 0, scale: 2.35, filter: "blur(18px)", y: 24 },
      animate: { opacity: 1, scale: 1, filter: "blur(0px)", y: 0 },
      transition: { duration: 0.42, ease: EASE_OUT_EXPO, delay: 0.05 },
    },
    subtitle: {
      initial: { opacity: 0, y: 36 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.32, ease: EASE_OUT_EXPO, delay: 0.22 },
    },
  },
  romantic: {
    kicker: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.3, ease: EASE_OUT_EXPO },
    },
    title: {
      initial: { opacity: 0, y: 120, scale: 0.82, filter: "blur(12px)" },
      animate: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" },
      transition: { duration: 0.48, ease: EASE_OUT_BACK, delay: 0.04 },
    },
    subtitle: {
      initial: { opacity: 0, y: 28 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.34, ease: EASE_OUT_EXPO, delay: 0.28 },
    },
  },
  adventure: {
    kicker: {
      initial: { opacity: 0, x: -40 },
      animate: { opacity: 1, x: 0 },
      transition: { duration: 0.28, ease: EASE_OUT_EXPO },
    },
    title: {
      initial: { opacity: 0, x: -220, skewX: -8, scale: 1.15 },
      animate: { opacity: 1, x: 0, skewX: 0, scale: 1 },
      transition: { duration: 0.38, ease: EASE_OUT_EXPO, delay: 0.04 },
    },
    subtitle: {
      initial: { opacity: 0, x: 80 },
      animate: { opacity: 1, x: 0 },
      transition: { duration: 0.3, ease: EASE_OUT_EXPO, delay: 0.24 },
    },
  },
  values: {
    kicker: {
      initial: { opacity: 0, y: -40 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.28, ease: EASE_OUT_EXPO },
    },
    title: {
      initial: { opacity: 0, y: -160, scale: 1.4, filter: "blur(10px)" },
      animate: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" },
      transition: { duration: 0.4, ease: EASE_OUT_EXPO, delay: 0.05 },
    },
    subtitle: {
      initial: { opacity: 0, scale: 0.9 },
      animate: { opacity: 1, scale: 1 },
      transition: { duration: 0.32, ease: EASE_OUT_EXPO, delay: 0.26 },
    },
  },
  fun: {
    kicker: {
      initial: { opacity: 0, rotate: -8, scale: 0.6 },
      animate: { opacity: 1, rotate: 0, scale: 1 },
      transition: { duration: 0.28, ease: EASE_OUT_BACK },
    },
    title: {
      initial: { opacity: 0, scale: 0.2, rotate: -12 },
      animate: { opacity: 1, scale: 1, rotate: 0 },
      transition: { duration: 0.45, ease: EASE_OUT_BACK, delay: 0.03 },
    },
    subtitle: {
      initial: { opacity: 0, y: 40, rotate: 3 },
      animate: { opacity: 1, y: 0, rotate: 0 },
      transition: { duration: 0.3, ease: EASE_OUT_BACK, delay: 0.26 },
    },
  },
  intimacy: {
    kicker: {
      initial: { opacity: 0, letterSpacing: "0.9em" },
      animate: { opacity: 1, letterSpacing: "0.45em" },
      transition: { duration: 0.4, ease: EASE_OUT_EXPO },
    },
    title: {
      initial: { opacity: 0, scale: 1.85, filter: "blur(22px)" },
      animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
      transition: { duration: 0.5, ease: EASE_OUT_EXPO, delay: 0.06 },
    },
    subtitle: {
      initial: { opacity: 0, y: 24 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.36, ease: EASE_OUT_EXPO, delay: 0.3 },
    },
  },
};

const FALLBACK_TEXT: ThemeTextMotion = THEME_TEXT_MOTION.lifestyle;

export function resolveThemeArtMotion(
  category: string | null | undefined,
): ThemeArtMotion {
  if (isQuizThemeSlideCategory(category)) return THEME_ART_MOTION[category];
  return FALLBACK_ART;
}

export function resolveThemeTextMotion(
  category: string | null | undefined,
): ThemeTextMotion {
  if (isQuizThemeSlideCategory(category)) return THEME_TEXT_MOTION[category];
  return FALLBACK_TEXT;
}
