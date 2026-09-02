/** Fasi visuali sincronizzate tra proiettore, mobile e dashboard. */
export type QuizDisplayPhase =
  | "start_countdown"
  | "theme_intro"
  | "question"
  | "answers"
  | "results"
  | "next_question";

export interface QuizTimingConfig {
  startCountdownSeconds: number;
  themeIntroSeconds: number;
  /** Solo testo domanda (senza risposte). */
  questionStemSeconds: number;
  questionSeconds: number;
  resultsSeconds: number;
  /** Slide «Prossima domanda» tra una domanda e la successiva. */
  nextQuestionSeconds: number;
}

export const DEFAULT_QUIZ_TIMING: QuizTimingConfig = {
  startCountdownSeconds: 5,
  themeIntroSeconds: 4,
  questionStemSeconds: 4,
  questionSeconds: 15,
  resultsSeconds: 6,
  nextQuestionSeconds: 3,
};

export interface QuizMancheTheme {
  mancheId: string;
  order: number;
  title: string;
  subtitle?: string;
  questionIds: string[];
}

export const CATEGORY_THEME_LABELS: Record<
  string,
  { title: string; subtitle: string }
> = {
  lifestyle: {
    title: "Stile di vita",
    subtitle: "Abitudini, serate e piccoli piaceri",
  },
  romantic: {
    title: "Romanticismo",
    subtitle: "Cuore, gesti e feeling",
  },
  adventure: {
    title: "Avventura",
    subtitle: "Rischio, viaggi e spontaneità",
  },
  values: {
    title: "Valori",
    subtitle: "Priorità e visione del futuro",
  },
  fun: {
    title: "Divertimento",
    subtitle: "Ironia e situazioni buffe",
  },
  intimacy: {
    title: "Intimità",
    subtitle: "Vicinanza emotiva (PG-18)",
  },
};

export function phaseDurationSeconds(
  phase: QuizDisplayPhase,
  timing: QuizTimingConfig,
): number {
  switch (phase) {
    case "start_countdown":
      return timing.startCountdownSeconds;
    case "theme_intro":
      return timing.themeIntroSeconds;
    case "question":
      return timing.questionStemSeconds;
    case "answers":
      return timing.questionSeconds;
    case "results":
      return timing.resultsSeconds;
    case "next_question":
      return timing.nextQuestionSeconds;
  }
}

/** Etichette regia / UI (italiano). */
export const QUIZ_PHASE_LABELS: Record<QuizDisplayPhase, string> = {
  start_countdown: "Countdown avvio",
  theme_intro: "Tema",
  question: "Domanda",
  answers: "Domanda + risposte",
  results: "Risultati %",
  next_question: "Classifica",
};

/** Ultime N domande senza classifica di accoppiamento (default serata). */
export const DEFAULT_HIDE_RANKING_LAST_N = 5;

/** Fasi che restano in hold fino ad AVANTI (il timer risposte è l'unica chiusura automatica). */
export const QUIZ_CONDUCTOR_HOLD_PHASES: readonly QuizDisplayPhase[] = [
  "theme_intro",
  "question",
  "results",
  "next_question",
];

export function isConductorHoldPhase(phase: QuizDisplayPhase): boolean {
  return QUIZ_CONDUCTOR_HOLD_PHASES.includes(phase);
}

export function normalizeHideRankingLastN(raw: unknown): number {
  if (typeof raw !== "number" || !Number.isFinite(raw)) {
    return DEFAULT_HIDE_RANKING_LAST_N;
  }
  return Math.max(0, Math.min(30, Math.round(raw)));
}

/** True se la domanda corrente deve mostrare la classifica temporanea (punto 5). */
export function shouldShowPairingRanking(
  currentIndex: number,
  total: number,
  hideRankingLastN: number,
): boolean {
  if (total <= 0) return false;
  const hide = normalizeHideRankingLastN(hideRankingLastN);
  return currentIndex < total - hide;
}

/** Il tick server può chiudere da solo solo countdown avvio (e, se Auto è on, le hold). Mai le risposte. */
export function phaseAutoAdvancesOnTick(
  phase: QuizDisplayPhase,
  autoplayEnabled: boolean,
): boolean {
  if (phase === "answers") return false;
  if (phase === "start_countdown") return true;
  return autoplayEnabled && isConductorHoldPhase(phase);
}

export function elapsedMs(sinceIso: string, now = Date.now()): number {
  const start = Date.parse(sinceIso);
  if (Number.isNaN(start)) return 0;
  return Math.max(0, now - start);
}

export function remainingSeconds(
  phase: QuizDisplayPhase,
  phaseStartedAt: string,
  timing: QuizTimingConfig,
  now = Date.now(),
): number {
  const totalMs = phaseDurationSeconds(phase, timing) * 1000;
  const left = totalMs - elapsedMs(phaseStartedAt, now);
  return Math.max(0, Math.ceil(left / 1000));
}

export function isPhaseExpired(
  phase: QuizDisplayPhase,
  phaseStartedAt: string,
  timing: QuizTimingConfig,
  now = Date.now(),
): boolean {
  return remainingSeconds(phase, phaseStartedAt, timing, now) <= 0;
}

/**
 * AVANTI-BINARY-LOCKED — prossima fase quiz (proiettore = anteprima = player).
 * Autorizzato Mauro 2026-08-31: ogni domanda riparte da SLIDE ARGOMENTO.
 * Vedi `.cursor/rules/avanti-binary.mdc`.
 */
export function nextQuizDisplayPhase(
  phase: QuizDisplayPhase,
  currentIndex: number,
  total: number,
  hideRankingLastN: number = DEFAULT_HIDE_RANKING_LAST_N,
): QuizDisplayPhase | "advance_index" | "finish" {
  switch (phase) {
    case "start_countdown":
      return "theme_intro";
    case "theme_intro":
      return "question";
    case "question":
      return "answers";
    case "answers":
      return "results";
    case "results":
      if (currentIndex + 1 >= total) {
        return "finish";
      }
      if (!shouldShowPairingRanking(currentIndex, total, hideRankingLastN)) {
        return "advance_index";
      }
      return "next_question";
    case "next_question":
      return "advance_index";
  }
}

export interface SyncedQuizClock {
  /** Fase da renderizzare — allineata al wall clock condiviso. */
  displayPhase: QuizDisplayPhase;
  phaseStartedAt: string;
  remaining: number;
  /** Server non ha ancora registrato il tick (es. fine manche). */
  awaitingServerTick: boolean;
}

/**
 * Deriva fase e countdown da `phaseStartedAt` + timing — stesso risultato
 * su proiettore, mobile e admin con lo stesso snapshot quiz.
 */
export function resolveSyncedQuizClock(
  quiz: {
    displayPhase: QuizDisplayPhase;
    phaseStartedAt: string;
    updatedAt: string;
    currentIndex: number;
    total: number;
    timing: QuizTimingConfig;
    autoplayEnabled?: boolean;
    hideRankingLastN?: number;
  },
  now = Date.now(),
): SyncedQuizClock {
  const phase = quiz.displayPhase;
  let startedMs = Date.parse(quiz.phaseStartedAt);
  if (Number.isNaN(startedMs)) {
    startedMs = Date.parse(quiz.updatedAt);
  }

  const durationMs = phaseDurationSeconds(phase, quiz.timing) * 1000;
  const elapsed = now - startedMs;
  const remaining = Math.max(0, Math.ceil((durationMs - elapsed) / 1000));

  if (elapsed < durationMs) {
    return {
      displayPhase: phase,
      phaseStartedAt: new Date(startedMs).toISOString(),
      remaining,
      awaitingServerTick: false,
    };
  }

  // Countdown avvio: attendi tick server (spettacolo proiettore).
  if (phase === "start_countdown") {
    return {
      displayPhase: phase,
      phaseStartedAt: new Date(startedMs).toISOString(),
      remaining: 0,
      awaitingServerTick: true,
    };
  }

  // Risposte: il timer chiude da solo (tastiere lock) ma AVANTI rivela le %.
  if (phase === "answers") {
    return {
      displayPhase: phase,
      phaseStartedAt: new Date(startedMs).toISOString(),
      remaining: 0,
      awaitingServerTick: false,
    };
  }

  // Hold conduttore: restano visibili fino ad AVANTI (Auto può tickare il server).
  if (isConductorHoldPhase(phase)) {
    return {
      displayPhase: phase,
      phaseStartedAt: new Date(startedMs).toISOString(),
      remaining: 0,
      awaitingServerTick: quiz.autoplayEnabled === true,
    };
  }

  return {
    displayPhase: phase,
    phaseStartedAt: new Date(startedMs).toISOString(),
    remaining: 0,
    awaitingServerTick: false,
  };
}

export function categoryThemeLabel(category: string): {
  title: string;
  subtitle: string;
} {
  return (
    CATEGORY_THEME_LABELS[category] ?? {
      title: category.charAt(0).toUpperCase() + category.slice(1),
      subtitle: "Nuova manche del quiz",
    }
  );
}

export function resolveThemeForQuestion(
  questionId: string,
  category: string,
  manche?: QuizMancheTheme[] | null,
): { title: string; subtitle: string } {
  const fromManche = manche?.find((m) => m.questionIds.includes(questionId));
  if (fromManche) {
    return {
      title: fromManche.title,
      subtitle:
        fromManche.subtitle ??
        (category
          ? categoryThemeLabel(category).subtitle
          : "Preparatevi alla prossima domanda"),
    };
  }
  if (category) return categoryThemeLabel(category);
  return {
    title: "Nuova manche",
    subtitle: "La domanda sta per iniziare",
  };
}

/** Tema per la domanda corrente — manche Generatore, altrimenti categoria. */
export function resolveThemeForQuizIndex(
  questionIds: string[],
  currentIndex: number,
  manche?: QuizMancheTheme[] | null,
  category?: string,
): { title: string; subtitle: string } | null {
  const questionId = questionIds[currentIndex];
  if (!questionId) return null;
  return resolveThemeForQuestion(questionId, category ?? "", manche);
}

/** Slide tematica alla prima domanda di ogni manche (metadata Generatore). */
export function isMancheThemeIntroForIndex(
  questionIds: string[],
  index: number,
  manche?: QuizMancheTheme[] | null,
): boolean {
  const questionId = questionIds[index];
  if (!questionId) return false;

  if (!manche?.length) {
    return index === 0;
  }

  for (const block of manche) {
    if (!block.questionIds.includes(questionId)) continue;
    return block.questionIds[0] === questionId;
  }

  return index === 0;
}

/**
 * AVANTI-BINARY-LOCKED — fase dopo advance_index.
 * Autorizzato Mauro 2026-08-31: dopo le % si riparte sempre da SLIDE ARGOMENTO
 * (theme_intro). Il countdown 5-4-3 resta solo all'avvio quiz (start_countdown).
 */
export function resolvePhaseAfterQuestionAdvance(
  _questionIds: string[],
  _newIndex: number,
  _manche?: QuizMancheTheme[] | null,
): QuizDisplayPhase {
  return "theme_intro";
}
