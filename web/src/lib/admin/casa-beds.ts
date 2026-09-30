import { audioUrl } from "@/lib/audio/phase-tracks";
import {
  quizBedSrcForCategory,
  normalizeQuizThemeCategory,
} from "@/lib/audio/quiz-theme-tracks";
import type { CasaBeat, SiglaGate } from "@/lib/admin/casa-avanti";
import type { BoardDisplayCueId } from "@/lib/admin/board-display-cues";
import type { QuizDisplayPhase } from "@/lib/musicpro/quiz-display";
import { CATEGORY_THEME_LABELS } from "@/lib/musicpro/quiz-display";

const LOBBY = audioUrl("dark_fuchsia/loops/LR_01_Lobby_Ambient_A.mp3");
/**
 * Pre-show «STIAMO PER INIZIARE / PRENDI POSTO» + cue Tra 5′.
 * Stand-in elettrizzante finché non arriva la colonna dedicata (Suno → LR_26).
 */
const PRESHOW = audioUrl("dark_fuchsia/loops/LR_02_Quiz_Adventure_A.mp3");
/** Countdown risposte — quando appaiono A–D. */
const QUIZ_COUNTDOWN = audioUrl(
  "dark_fuchsia/loops/LR_03_Quiz_Countdown_A.mp3",
);
/** Hit one-shot all’ingresso % (non è il bed looping). */
export const CASA_QUIZ_RESULTS_REVEAL_SRC = audioUrl(
  "dark_fuchsia/loops/LR_25_Quiz_Results_Reveal_A.mp3",
);
const EXTRACT = audioUrl("dark_fuchsia/loops/LR_05_Extraction_Underscore_A.mp3");

export const CASA_LOBBY_BED = { name: "Lobby", url: LOBBY } as const;

/** Target file per la colonna Suno dedicata (quando la generiamo). */
export const CASA_PRESHOW_BED_TARGET =
  "dark_fuchsia/loops/LR_26_PreShow_TakeSeats_A.mp3";

export type CasaBedOpts = {
  sigla?: SiglaGate | null;
  displayCue?: BoardDisplayCueId | null;
  /** Prova speciale in onda → bed countdown (non tema quiz). */
  specialTrial?: "running" | "closing" | "setup" | "results" | "booked" | null;
};

function wantsPreshow(
  beat: CasaBeat,
  opts?: CasaBedOpts | null,
): boolean {
  if (beat === "sigla" && (opts?.sigla === "warn" || opts?.sigla === "idle")) {
    return true;
  }
  if (opts?.displayCue === "tra5") return true;
  return false;
}

function wantsSpecialTrialBed(opts?: CasaBedOpts | null): boolean {
  return opts?.specialTrial === "running" || opts?.specialTrial === "closing";
}

export function casaAutoBedSrc(
  beat: CasaBeat,
  quizPhase?: QuizDisplayPhase | null,
  category?: string | null,
  opts?: CasaBedOpts | null,
): string | null {
  // Sigla video in onda: niente bed sotto (il Play usa comunque il fallback lobby).
  if (beat === "sigla" && opts?.sigla !== "warn" && opts?.sigla !== "idle") {
    return null;
  }
  if (wantsPreshow(beat, opts)) return PRESHOW;
  // Prova speciale: pulse countdown (votazione sala sul telefono).
  if (beat === "quiz" && wantsSpecialTrialBed(opts)) return QUIZ_COUNTDOWN;
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
  opts?: CasaBedOpts | null,
): string {
  if (beat === "sigla" && opts?.sigla !== "warn" && opts?.sigla !== "idle") {
    return "Pausa — parla la sigla";
  }
  if (wantsPreshow(beat, opts)) return "Pre-show · prendete posto";
  if (beat === "quiz" && wantsSpecialTrialBed(opts)) {
    return "Prova speciale · countdown";
  }
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
  opts?: CasaBedOpts | null,
): { name: string; url: string } | null {
  if (folder?.length) {
    return folder[index] ?? folder[0] ?? null;
  }
  const url = casaAutoBedSrc(beat, quizPhase, category, opts);
  if (!url) return null;
  return { name: casaAutoBedLabel(beat, quizPhase, category, opts), url };
}

/** Mai null: se la fase non ha bed (sigla on / stacco), resta la lobby pronta al Play. */
export function resolveCasaBedOrLobby(
  beat: CasaBeat,
  folder: { name: string; url: string }[] | null,
  index: number,
  quizPhase?: QuizDisplayPhase | null,
  category?: string | null,
  opts?: CasaBedOpts | null,
): { name: string; url: string } {
  return (
    resolveCasaBed(beat, folder, index, quizPhase, category, opts) ??
    CASA_LOBBY_BED
  );
}
