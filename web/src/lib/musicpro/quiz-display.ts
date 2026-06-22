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
  next_question: "Prossima domanda",
};

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

/** Prossima fase logica — condivisa tra server e client sync clock. */
export function nextQuizDisplayPhase(
  phase: QuizDisplayPhase,
  currentIndex: number,
  total: number,
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
  },
  now = Date.now(),
): SyncedQuizClock {
  let phase = quiz.displayPhase;
  let startedMs = Date.parse(quiz.phaseStartedAt);
  if (Number.isNaN(startedMs)) {
    startedMs = Date.parse(quiz.updatedAt);
  }

  while (true) {
    const durationMs = phaseDurationSeconds(phase, quiz.timing) * 1000;
    const elapsed = now - startedMs;

    if (elapsed < durationMs) {
      const remaining = Math.max(0, Math.ceil((durationMs - elapsed) / 1000));
      return {
        displayPhase: phase,
        phaseStartedAt: new Date(startedMs).toISOString(),
        remaining,
        awaitingServerTick: false,
      };
    }

    const next = nextQuizDisplayPhase(phase, quiz.currentIndex, quiz.total);

    // Countdown avvio: attendi tick server (spettacolo proiettore).
    if (phase === "start_countdown") {
      return {
        displayPhase: phase,
        phaseStartedAt: new Date(startedMs).toISOString(),
        remaining: 0,
        awaitingServerTick: true,
      };
    }

    if (next === "finish" || next === "advance_index") {
      return {
        displayPhase: phase,
        phaseStartedAt: new Date(startedMs).toISOString(),
        remaining: 0,
        awaitingServerTick: true,
      };
    }

    startedMs += durationMs;
    phase = next;
  }
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

/** Slide tematica solo alla prima domanda di ogni manche (non tra domande successive). */
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

export function resolvePhaseAfterQuestionAdvance(
  questionIds: string[],
  newIndex: number,
  manche?: QuizMancheTheme[] | null,
): QuizDisplayPhase {
  return isMancheThemeIntroForIndex(questionIds, newIndex, manche)
    ? "theme_intro"
    : "question";
}
