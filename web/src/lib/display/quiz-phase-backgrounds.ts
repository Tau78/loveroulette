import type { QuizDisplayPhase } from "@/lib/musicpro/quiz-display";

export interface QuizPhaseBackgroundConfig {
  /** Base tint over video / fallback. */
  base: string;
  /** Animated glow layer. */
  glow: string;
  /** Secondary accent sweep. */
  accent: string;
  /** Video opacity multiplier (0–1). */
  videoOpacity: number;
  /** Roulette wheel opacity (0–1). */
  rouletteOpacity: number;
  /** Roulette rotation duration (seconds). */
  rouletteDuration: number;
  /** Extra vignette. */
  vignette: string;
}

export const QUIZ_PHASE_BACKGROUNDS: Record<
  QuizDisplayPhase,
  QuizPhaseBackgroundConfig
> = {
  start_countdown: {
    base: "linear-gradient(180deg, #050208 0%, #120818 50%, #0a0410 100%)",
    glow: "radial-gradient(ellipse 55% 45% at 50% 50%, rgba(233,30,140,0.45) 0%, transparent 70%)",
    accent:
      "radial-gradient(ellipse 40% 30% at 50% 80%, rgba(255,71,87,0.25) 0%, transparent 65%)",
    videoOpacity: 0.35,
    rouletteOpacity: 0.55,
    rouletteDuration: 18,
    vignette:
      "radial-gradient(ellipse 70% 60% at 50% 50%, transparent 20%, rgba(0,0,0,0.65) 100%)",
  },
  theme_intro: {
    base: "linear-gradient(180deg, #0f0308 0%, #1a0610 45%, #120408 100%)",
    glow: "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(120,18,38,0.35) 0%, transparent 68%)",
    accent:
      "radial-gradient(ellipse 45% 35% at 30% 70%, rgba(180,40,70,0.2) 0%, transparent 60%)",
    videoOpacity: 0.42,
    rouletteOpacity: 0.38,
    rouletteDuration: 32,
    vignette:
      "radial-gradient(ellipse 55% 50% at 50% 50%, transparent 0%, rgba(0,0,0,0.5) 100%)",
  },
  question: {
    base: "linear-gradient(180deg, #080612 0%, #0e0820 55%, #06040e 100%)",
    glow: "radial-gradient(ellipse 50% 40% at 50% 35%, rgba(107,33,168,0.32) 0%, transparent 72%)",
    accent:
      "radial-gradient(ellipse 35% 25% at 70% 75%, rgba(88,28,135,0.18) 0%, transparent 55%)",
    videoOpacity: 0.48,
    rouletteOpacity: 0.22,
    rouletteDuration: 40,
    vignette:
      "radial-gradient(ellipse 65% 55% at 50% 45%, transparent 15%, rgba(0,0,0,0.55) 100%)",
  },
  answers: {
    base: "linear-gradient(180deg, #0a0412 0%, #180818 50%, #0d0510 100%)",
    glow: "radial-gradient(ellipse 55% 45% at 50% 55%, rgba(233,30,140,0.5) 0%, transparent 68%)",
    accent:
      "radial-gradient(ellipse 40% 35% at 20% 30%, rgba(255,71,87,0.28) 0%, transparent 58%)",
    videoOpacity: 0.62,
    rouletteOpacity: 0.48,
    rouletteDuration: 14,
    vignette:
      "radial-gradient(ellipse 75% 65% at 50% 50%, transparent 10%, rgba(0,0,0,0.45) 100%)",
  },
  results: {
    base: "linear-gradient(180deg, #0c0610 0%, #1a1008 48%, #0a0608 100%)",
    glow: "radial-gradient(ellipse 50% 45% at 50% 50%, rgba(255,180,80,0.28) 0%, rgba(233,30,140,0.22) 45%, transparent 72%)",
    accent:
      "radial-gradient(ellipse 35% 30% at 80% 25%, rgba(255,215,120,0.2) 0%, transparent 55%)",
    videoOpacity: 0.52,
    rouletteOpacity: 0.3,
    rouletteDuration: 36,
    vignette:
      "radial-gradient(ellipse 60% 50% at 50% 50%, transparent 5%, rgba(0,0,0,0.48) 100%)",
  },
  next_question: {
    base: "linear-gradient(180deg, #06040c 0%, #140818 50%, #080410 100%)",
    glow: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(233,30,140,0.38) 0%, transparent 70%)",
    accent:
      "conic-gradient(from 0deg at 50% 50%, transparent 0deg, rgba(233,30,140,0.12) 90deg, transparent 180deg, rgba(107,33,168,0.1) 270deg, transparent 360deg)",
    videoOpacity: 0.55,
    rouletteOpacity: 0.65,
    rouletteDuration: 10,
    vignette:
      "radial-gradient(ellipse 70% 60% at 50% 50%, transparent 0%, rgba(0,0,0,0.52) 100%)",
  },
};
