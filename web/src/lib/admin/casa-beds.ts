import { audioUrl } from "@/lib/audio/phase-tracks";
import {
  quizBedSrcForCategory,
  normalizeQuizThemeCategory,
} from "@/lib/audio/quiz-theme-tracks";
import type { CasaBeat } from "@/lib/admin/casa-avanti";
import type { QuizDisplayPhase } from "@/lib/musicpro/quiz-display";
import { CATEGORY_THEME_LABELS } from "@/lib/musicpro/quiz-display";

const LOBBY = audioUrl("dark_fuchsia/loops/LR_01_Lobby_Ambient_A.mp3");
/** Countdown risposte — quando appaiono A–D. */
const QUIZ_COUNTDOWN = audioUrl(
  "dark_fuchsia/loops/LR_03_Quiz_Countdown_A.mp3",
);
/** Hit one-shot all’ingresso % (non è il bed looping). */
export const CASA_QUIZ_RESULTS_REVEAL_SRC = audioUrl(
  "dark_fuchsia/loops/LR_25_Quiz_Results_Reveal_A.mp3",
);
const EXTRACT = audioUrl("dark_fuchsia/loops/LR_05_Extraction_Underscore_A.mp3");

export function casaAutoBedSrc(
  beat: CasaBeat,
  quizPhase?: QuizDisplayPhase | null,
  category?: string | null,
): string | null {
  if (beat === "sigla") return null;
  // Stacco 5–4–3–2–1: parla solo il file countdown (niente bed sotto).
  if (beat === "stacco") return null;
  if (beat === "presenti") return EXTRACT;
  if (beat === "quiz") {
    if (quizPhase === "start_countdown") return null;
    if (quizPhase === "answers") return QUIZ_COUNTDOWN;
    // Tema / domanda / % hold: bed coerente con la tematica.
    return quizBedSrcForCategory(category);
  }
  return LOBBY;
}

export function casaAutoBedLabel(
  beat: CasaBeat,
  quizPhase?: QuizDisplayPhase | null,
  category?: string | null,
): string {
  if (beat === "sigla") return "Pausa — parla la sigla";
  if (beat === "stacco") return "Pausa — countdown";
  if (beat === "presenti") return "Estrazione";
  if (beat === "quiz") {
    if (quizPhase === "start_countdown") return "Pausa — countdown";
    if (quizPhase === "answers") return "Countdown risposte";
    if (quizPhase === "results") return "Reveal % · hold";
    const cat = normalizeQuizThemeCategory(category);
    if (cat && CATEGORY_THEME_LABELS[cat]) {
      return `Tema · ${CATEGORY_THEME_LABELS[cat].title}`;
    }
    return "Tensione quiz";
  }
  return "Lobby";
}

export function resolveCasaBed(
  beat: CasaBeat,
  folder: { name: string; url: string }[] | null,
  index: number,
  quizPhase?: QuizDisplayPhase | null,
  category?: string | null,
): { name: string; url: string } | null {
  if (folder?.length) {
    return folder[index] ?? folder[0] ?? null;
  }
  const url = casaAutoBedSrc(beat, quizPhase, category);
  if (!url) return null;
  return { name: casaAutoBedLabel(beat, quizPhase, category), url };
}
