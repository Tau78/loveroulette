import { audioUrl } from "@/lib/audio/phase-tracks";
import type { CasaBeat } from "@/lib/admin/casa-avanti";
import type { QuizDisplayPhase } from "@/lib/musicpro/quiz-display";

const LOBBY = audioUrl("dark_fuchsia/loops/LR_01_Lobby_Ambient_A.mp3");
/** Musica misteriosa — tema, lettura domanda, hold sotto le %. */
const QUIZ_MYSTERY = audioUrl("dark_fuchsia/loops/LR_02_Quiz_Tension_A.mp3");
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
): string | null {
  if (beat === "sigla") return null;
  if (beat === "presenti" || beat === "stacco") return EXTRACT;
  if (beat === "quiz") {
    if (quizPhase === "answers") return QUIZ_COUNTDOWN;
    // %: bed lungo (mystery); l’hit LR_25 è one-shot a parte.
    return QUIZ_MYSTERY;
  }
  return LOBBY;
}

export function casaAutoBedLabel(
  beat: CasaBeat,
  quizPhase?: QuizDisplayPhase | null,
): string {
  if (beat === "sigla") return "Pausa — parla la sigla";
  if (beat === "presenti" || beat === "stacco") return "Estrazione";
  if (beat === "quiz") {
    if (quizPhase === "answers") return "Countdown risposte";
    if (quizPhase === "results") return "Reveal % · hold";
    return "Tensione quiz";
  }
  return "Lobby";
}

export function resolveCasaBed(
  beat: CasaBeat,
  folder: { name: string; url: string }[] | null,
  index: number,
  quizPhase?: QuizDisplayPhase | null,
): { name: string; url: string } | null {
  if (folder?.length) {
    return folder[index] ?? folder[0] ?? null;
  }
  const url = casaAutoBedSrc(beat, quizPhase);
  if (!url) return null;
  return { name: casaAutoBedLabel(beat, quizPhase), url };
}
