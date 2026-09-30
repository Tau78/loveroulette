import type { SupabaseClient } from "@supabase/supabase-js";
import { logAvantiBinary } from "@/lib/admin/avanti-binary-log";
import type { EventState } from "@/lib/types";
import { computeAndPersistPairs } from "./matching";
import {
  getQuestionsForEvent,
  materializePoolQuestionsForEvent,
} from "./questions";
import {
  DEFAULT_HIDE_RANKING_LAST_N,
  DEFAULT_QUIZ_TIMING,
  DEFAULT_RANKING_EVERY_N,
  type QuizDisplayPhase,
  type QuizMancheTheme,
  type QuizTimingConfig,
  isPhaseExpired,
  nextQuizDisplayPhase,
  normalizeHideRankingLastN,
  normalizeRankingEveryN,
  phaseAutoAdvancesOnTick,
  resolvePhaseAfterQuestionAdvance,
} from "./quiz-display";
import type { LoveRouletteQuestionSource } from "./types";
import { updateSessionRuntimeState } from "./session";
import {
  getSpecialTrialState,
  isSpecialTrialBlockingQuiz,
  tryActivateSpecialTrialAtGate,
} from "./special-trial";

/**
 * AVANTI-BINARY-LOCKED — advance/tick quiz server.
 * Non modificare le transizioni senza autorizzazione espressa di Mauro.
 * Vedi `.cursor/rules/avanti-binary.mdc`.
 */
export interface QuizSessionState {
  questionIds: string[];
  currentIndex: number;
  total: number;
  source: LoveRouletteQuestionSource;
  /** Legacy autoplay — allineato a questionSeconds. */
  autoplaySeconds: number;
  /** Se true, display/admin avanzano fase al termine countdown. */
  autoplayEnabled: boolean;
  updatedAt: string;
  displayPhase: QuizDisplayPhase;
  phaseStartedAt: string;
  timing: QuizTimingConfig;
  /** Manche importate dal Generatore (slide tematiche). */
  manche?: QuizMancheTheme[];
  /** Suona gong solo quando il countdown risposte scade (non su AVANTI). */
  gongCueKey?: string;
  /** Ultime N domande senza classifica di accoppiamento (al buio). */
  hideRankingLastN: number;
  /** Classifiche intermedie ogni N domande (mai sull’ultima). */
  rankingEveryN: number;
  /**
   * Al Buio live: salta le % (fase results) da ora fino a fine manche.
   * Acceso dalla plancia mid-serata.
   */
  skipResults?: boolean;
}

function nowIso(): string {
  return new Date().toISOString();
}

function normalizeTiming(raw: unknown): QuizTimingConfig {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ...DEFAULT_QUIZ_TIMING };
  }
  const record = raw as Record<string, unknown>;
  const num = (key: keyof QuizTimingConfig, fallback: number) => {
    const value = record[key];
    return typeof value === "number" && value >= 1 && value <= 120
      ? value
      : fallback;
  };
  return {
    startCountdownSeconds: num("startCountdownSeconds", 5),
    themeIntroSeconds: num("themeIntroSeconds", 4),
    questionStemSeconds: num("questionStemSeconds", 4),
    questionSeconds: num("questionSeconds", 15),
    resultsSeconds: num("resultsSeconds", 6),
    nextQuestionSeconds: num("nextQuestionSeconds", 3),
  };
}

function normalizeManche(raw: unknown): QuizMancheTheme[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const manche: QuizMancheTheme[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    const questionIds = record.questionIds;
    if (
      typeof record.mancheId !== "string" ||
      typeof record.title !== "string" ||
      !Array.isArray(questionIds)
    ) {
      continue;
    }
    manche.push({
      mancheId: record.mancheId,
      order: typeof record.order === "number" ? record.order : manche.length + 1,
      title: record.title,
      subtitle:
        typeof record.subtitle === "string" ? record.subtitle : undefined,
      questionIds: questionIds.map(String),
    });
  }
  return manche.length > 0 ? manche : undefined;
}

export function getQuizMancheFromMetadata(
  metadata: Record<string, unknown> | null | undefined,
): QuizMancheTheme[] | undefined {
  return normalizeManche(metadata?.love_roulette_manche);
}

export interface QuizSetupPrefs {
  /** Ultima scelta animatore (null = tutte le domande caricate). */
  questionCount: number | null;
  questionSeconds: number;
  /** Ultime N senza classifica intermedia (Al Buio). */
  hideRankingLastN: number;
  /** Classifiche intermedie ogni N domande. */
  rankingEveryN: number;
}

export function getQuizSetupPrefs(
  metadata: Record<string, unknown> | null | undefined,
): QuizSetupPrefs {
  const timing = normalizeTiming(metadata?.love_roulette_quiz_timing);
  const raw = metadata?.love_roulette_quiz_prefs;
  let questionCount: number | null = null;
  let hideRankingLastN = DEFAULT_HIDE_RANKING_LAST_N;
  let rankingEveryN = DEFAULT_RANKING_EVERY_N;
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const prefs = raw as Record<string, unknown>;
    const value = prefs.questionCount;
    if (typeof value === "number" && value >= 1) {
      questionCount = value;
    }
    if (prefs.hideRankingLastN !== undefined) {
      hideRankingLastN = normalizeHideRankingLastN(prefs.hideRankingLastN);
    }
    if (prefs.rankingEveryN !== undefined) {
      rankingEveryN = normalizeRankingEveryN(prefs.rankingEveryN);
    }
  }
  return {
    questionCount,
    questionSeconds: timing.questionSeconds,
    hideRankingLastN,
    rankingEveryN,
  };
}

export interface StartQuizSessionOptions {
  questionCount?: number;
  questionSeconds?: number;
  hideRankingLastN?: number;
  rankingEveryN?: number;
  /**
   * Dopo stacco 5–4–3–2–1: salta il secondo countdown e parte da theme_intro.
   * Autorizzato Mauro: fine countdown → argomento senza click.
   */
  skipStartCountdown?: boolean;
  /** Scaletta già preparata in plancia (es. dopo Cambia domanda in partenza/sigla). */
  questionIds?: string[];
}

async function persistQuizSetupMetadata(
  supabase: SupabaseClient,
  eventId: string,
  prefs: QuizSetupPrefs,
  timing: QuizTimingConfig,
): Promise<void> {
  const { data: row, error: fetchError } = await supabase
    .from("events")
    .select("metadata")
    .eq("id", eventId)
    .maybeSingle();

  if (fetchError || !row) {
    throw new Error(fetchError?.message ?? "Event not found");
  }

  const metadata = (row.metadata ?? {}) as Record<string, unknown>;
  const nextMetadata = {
    ...metadata,
    love_roulette_quiz_timing: timing,
    love_roulette_quiz_prefs: {
      questionCount: prefs.questionCount,
      questionSeconds: prefs.questionSeconds,
      hideRankingLastN: prefs.hideRankingLastN,
      rankingEveryN: prefs.rankingEveryN,
    },
  };

  const { error: updateError } = await supabase
    .from("events")
    .update({ metadata: nextMetadata })
    .eq("id", eventId);

  if (updateError) {
    throw new Error(updateError.message);
  }
}

export function getQuizSessionState(
  metadata: Record<string, unknown> | null | undefined,
): QuizSessionState | null {
  const raw = metadata?.love_roulette_quiz;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return null;
  }

  const record = raw as Record<string, unknown>;
  const questionIds = record.questionIds;
  const currentIndex = record.currentIndex;
  const total = record.total;
  const updatedAt = record.updatedAt;

  if (
    !Array.isArray(questionIds) ||
    questionIds.length === 0 ||
    typeof currentIndex !== "number" ||
    typeof total !== "number" ||
    typeof updatedAt !== "string"
  ) {
    return null;
  }

  const source =
    record.source === "pool" || record.source === "event"
      ? record.source
      : "event";

  const timing = normalizeTiming(record.timing);
  /** Countdown uses timing.questionSeconds (15 default), not legacy autoplaySeconds. */
  const autoplaySeconds = timing.questionSeconds;

  const displayPhase =
    record.displayPhase === "start_countdown" ||
    record.displayPhase === "theme_intro" ||
    record.displayPhase === "question" ||
    record.displayPhase === "answers" ||
    record.displayPhase === "results" ||
    record.displayPhase === "next_question"
      ? record.displayPhase
      : "question";

  const phaseStartedAt =
    typeof record.phaseStartedAt === "string"
      ? record.phaseStartedAt
      : updatedAt;

  const autoplayEnabled = record.autoplayEnabled === true;

  const gongCueKey =
    typeof record.gongCueKey === "string" ? record.gongCueKey : undefined;

  return {
    questionIds: questionIds.map(String),
    currentIndex,
    total,
    source,
    autoplaySeconds,
    autoplayEnabled,
    updatedAt,
    displayPhase,
    phaseStartedAt,
    timing,
    manche: normalizeManche(record.manche),
    gongCueKey,
    hideRankingLastN: normalizeHideRankingLastN(record.hideRankingLastN),
    rankingEveryN: normalizeRankingEveryN(record.rankingEveryN),
    skipResults: record.skipResults === true,
  };
}

/**
 * Merge a write onto the DB snapshot just re-read in writeQuizState.
 * Conserva Autoplay / Al Buio contro tick stale; non fa rollback di fase
 * se setAutoplay arriva dopo un advance.
 */
export function mergeQuizWriteWithExisting(
  existing: QuizSessionState | null,
  quiz: QuizSessionState,
): QuizSessionState {
  if (!existing) return quiz;

  const phaseMoved =
    existing.currentIndex !== quiz.currentIndex ||
    existing.displayPhase !== quiz.displayPhase ||
    existing.phaseStartedAt !== quiz.phaseStartedAt;
  if (!phaseMoved) return quiz;

  const existingStarted = Date.parse(existing.phaseStartedAt);
  const quizStarted = Date.parse(quiz.phaseStartedAt);
  const quizPhaseIsStale =
    !Number.isNaN(existingStarted) &&
    !Number.isNaN(quizStarted) &&
    quizStarted < existingStarted;

  if (quizPhaseIsStale) {
    return {
      ...existing,
      autoplayEnabled: quiz.autoplayEnabled,
      skipResults: quiz.skipResults === true,
      updatedAt: quiz.updatedAt,
    };
  }

  return {
    ...quiz,
    autoplayEnabled: existing.autoplayEnabled,
    skipResults: existing.skipResults === true,
  };
}

async function writeQuizState(
  supabase: SupabaseClient,
  eventId: string,
  quiz: QuizSessionState | null,
): Promise<QuizSessionState | null> {
  const { data: row, error: fetchError } = await supabase
    .from("events")
    .select("metadata")
    .eq("id", eventId)
    .maybeSingle();

  if (fetchError || !row) {
    throw new Error(fetchError?.message ?? "Event not found");
  }

  const metadata = (row.metadata ?? {}) as Record<string, unknown>;
  const nextMetadata = { ...metadata };

  if (quiz) {
    const existing = getQuizSessionState(metadata);
    const toWrite = mergeQuizWriteWithExisting(existing, quiz);
    nextMetadata.love_roulette_quiz = toWrite;
    quiz = toWrite;
  } else {
    delete nextMetadata.love_roulette_quiz;
  }

  const { error: updateError } = await supabase
    .from("events")
    .update({ metadata: nextMetadata })
    .eq("id", eventId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  return quiz;
}

function freshPhase(
  current: QuizSessionState,
  displayPhase: QuizDisplayPhase,
  extras?: Pick<QuizSessionState, "gongCueKey">,
): QuizSessionState {
  const at = nowIso();
  const { gongCueKey: _prevCue, ...rest } = current;
  return {
    ...rest,
    displayPhase,
    phaseStartedAt: at,
    updatedAt: at,
    autoplaySeconds: current.timing.questionSeconds,
    ...extras,
  };
}

export async function startQuizSession(
  supabase: SupabaseClient,
  eventId: string,
  options: StartQuizSessionOptions = {},
): Promise<QuizSessionState> {
  const { data: eventRow } = await supabase
    .from("events")
    .select("metadata")
    .eq("id", eventId)
    .maybeSingle();

  const metadata = (eventRow?.metadata ?? {}) as Record<string, unknown>;
  const manche = getQuizMancheFromMetadata(metadata);
  let timing = normalizeTiming(metadata.love_roulette_quiz_timing);

  if (options.questionSeconds !== undefined) {
    const seconds = Math.max(5, Math.min(120, options.questionSeconds));
    timing = { ...timing, questionSeconds: seconds };
  }

  const setupPrefs = getQuizSetupPrefs(metadata);
  const hideRankingLastN = normalizeHideRankingLastN(
    options.hideRankingLastN ?? setupPrefs.hideRankingLastN,
  );
  const rankingEveryN = normalizeRankingEveryN(
    options.rankingEveryN ?? setupPrefs.rankingEveryN,
  );

  const { questions, source } = await getQuestionsForEvent(supabase, eventId);

  if (questions.length === 0) {
    throw new Error("Nessuna domanda disponibile per questo evento.");
  }

  const quizQuestions =
    source === "pool"
      ? await materializePoolQuestionsForEvent(supabase, eventId, questions)
      : questions;

  const bankById = new Map(quizQuestions.map((q) => [q.id, q]));
  let questionIds: string[];

  if (options.questionIds?.length) {
    const unique: string[] = [];
    for (const id of options.questionIds) {
      if (!bankById.has(id) || unique.includes(id)) continue;
      unique.push(id);
    }
    if (unique.length === 0) {
      throw new Error("Scaletta domande non valida.");
    }
    questionIds = unique;
  } else {
    questionIds = quizQuestions.map((q) => q.id);
  }

  if (options.questionCount !== undefined && !options.questionIds?.length) {
    const limit = Math.max(1, Math.min(questionIds.length, options.questionCount));
    questionIds = questionIds.slice(0, limit);
  }

  await persistQuizSetupMetadata(supabase, eventId, {
    questionCount: questionIds.length,
    questionSeconds: timing.questionSeconds,
    hideRankingLastN,
    rankingEveryN,
  }, timing);

  const at = nowIso();
  const skipLaunch = options.skipStartCountdown === true;
  const quiz: QuizSessionState = {
    questionIds,
    currentIndex: 0,
    total: questionIds.length,
    source: source === "pool" ? "event" : source,
    autoplaySeconds: timing.questionSeconds,
    // Dopo stacco: hold sull’argomento (AVANTI). Altrimenti legacy Auto on.
    autoplayEnabled: skipLaunch ? false : true,
    updatedAt: at,
    displayPhase: skipLaunch ? "theme_intro" : "start_countdown",
    phaseStartedAt: at,
    timing,
    manche,
    hideRankingLastN,
    rankingEveryN,
  };

  await updateSessionRuntimeState(supabase, eventId, "quiz");
  await writeQuizState(supabase, eventId, quiz);
  return quiz;
}

async function loadCurrentQuiz(
  supabase: SupabaseClient,
  eventId: string,
): Promise<QuizSessionState> {
  const { data: row } = await supabase
    .from("events")
    .select("metadata")
    .eq("id", eventId)
    .maybeSingle();

  const metadata = (row?.metadata ?? {}) as Record<string, unknown>;
  const current = getQuizSessionState(metadata);

  if (!current) {
    throw new Error("Quiz non avviato.");
  }

  return current;
}

function nextDisplayPhase(
  current: QuizSessionState,
): QuizDisplayPhase | "advance_index" | "finish" {
  return nextQuizDisplayPhase(
    current.displayPhase,
    current.currentIndex,
    current.total,
    current.hideRankingLastN,
    current.rankingEveryN,
    current.skipResults === true,
  );
}

async function loadEventMetadata(
  supabase: SupabaseClient,
  eventId: string,
): Promise<Record<string, unknown>> {
  const { data } = await supabase
    .from("events")
    .select("metadata")
    .eq("id", eventId)
    .maybeSingle();
  return (data?.metadata ?? {}) as Record<string, unknown>;
}

export async function tickQuizPhase(
  supabase: SupabaseClient,
  eventId: string,
  force = false,
): Promise<{ quiz: QuizSessionState | null; runtimeState: EventState }> {
  let current = await loadCurrentQuiz(supabase, eventId);
  const metadata = await loadEventMetadata(supabase, eventId);
  const specialTrial = getSpecialTrialState(metadata);

  if (isSpecialTrialBlockingQuiz(specialTrial)) {
    return { quiz: current, runtimeState: "quiz" };
  }

  if (!force) {
    const canAuto = phaseAutoAdvancesOnTick(
      current.displayPhase,
      current.autoplayEnabled,
    );
    if (
      !canAuto ||
      !isPhaseExpired(
        current.displayPhase,
        current.phaseStartedAt,
        current.timing,
      )
    ) {
      return { quiz: current, runtimeState: "quiz" };
    }
  }

  const maxSteps = 8;

  for (let step = 0; step < maxSteps; step++) {
    const fromPhase = current.displayPhase;
    const fromIndex = current.currentIndex;
    const next = nextDisplayPhase(current);

    if (fromPhase === "results" && next === "next_question") {
      logAvantiBinary("advance", "results → ranking hold (intermediate)", {
        eventId,
        from: fromPhase,
        to: next,
        index: fromIndex,
        total: current.total,
        force,
      });
    } else if (fromPhase === "results" && next === "advance_index") {
      logAvantiBinary("advance", "results → next theme (no ranking hold)", {
        eventId,
        from: fromPhase,
        to: "advance_index",
        index: fromIndex,
        total: current.total,
        force,
      });
    } else if (force) {
      logAvantiBinary("advance", "forced AVANTI / skip phase", {
        eventId,
        from: fromPhase,
        to: next,
        index: fromIndex,
      });
    } else if (fromPhase === "answers" && next === "results") {
      logAvantiBinary("advance", "answers timer → results %", {
        eventId,
        from: fromPhase,
        to: next,
        index: fromIndex,
      });
    } else if (
      fromPhase === "answers" &&
      current.skipResults === true &&
      (next === "advance_index" || next === "next_question" || next === "finish")
    ) {
      logAvantiBinary("advance", "answers → Al Buio (skip %)", {
        eventId,
        from: fromPhase,
        to: next,
        index: fromIndex,
      });
    }

    if (next === "finish") {
      await computeAndPersistPairs(supabase, eventId, {
        questionIds: current.questionIds,
      });
      await writeQuizState(supabase, eventId, null);
      await updateSessionRuntimeState(supabase, eventId, "matching");
      return { quiz: null, runtimeState: "matching" };
    }

    if (next === "advance_index") {
      if (force && (await tryActivateSpecialTrialAtGate(supabase, eventId))) {
        return { quiz: current, runtimeState: "quiz" };
      }

      const newIndex = current.currentIndex + 1;
      current = freshPhase(
        {
          ...current,
          currentIndex: newIndex,
        },
        resolvePhaseAfterQuestionAdvance(
          current.questionIds,
          newIndex,
          current.manche,
        ),
      );
      await writeQuizState(supabase, eventId, current);
    } else {
      const gongCueKey =
        !force &&
        current.displayPhase === "answers" &&
        next === "results"
          ? `${current.currentIndex}:${current.phaseStartedAt}`
          : undefined;

      current = freshPhase(
        current,
        next,
        gongCueKey ? { gongCueKey } : undefined,
      );
      await writeQuizState(supabase, eventId, current);
    }

    if (
      force ||
      !isPhaseExpired(
        current.displayPhase,
        current.phaseStartedAt,
        current.timing,
      )
    ) {
      return { quiz: current, runtimeState: "quiz" };
    }
  }

  return { quiz: current, runtimeState: "quiz" };
}

/** Avanza indice domanda dopo hold (classifica o prova speciale). */
export async function advanceQuizIndexAfterHold(
  supabase: SupabaseClient,
  eventId: string,
): Promise<{ quiz: QuizSessionState | null; runtimeState: EventState }> {
  const current = await loadCurrentQuiz(supabase, eventId);
  const newIndex = current.currentIndex + 1;
  const quiz = freshPhase(
    {
      ...current,
      currentIndex: newIndex,
    },
    resolvePhaseAfterQuestionAdvance(
      current.questionIds,
      newIndex,
      current.manche,
    ),
  );
  await writeQuizState(supabase, eventId, quiz);
  return { quiz, runtimeState: "quiz" };
}

export async function skipQuizPhase(
  supabase: SupabaseClient,
  eventId: string,
): Promise<{ quiz: QuizSessionState | null; runtimeState: EventState }> {
  return tickQuizPhase(supabase, eventId, true);
}

export async function advanceQuizQuestion(
  supabase: SupabaseClient,
  eventId: string,
): Promise<{ quiz: QuizSessionState | null; runtimeState: EventState }> {
  /** Legacy alias — avanza alla prossima fase, non salta domanda. */
  return skipQuizPhase(supabase, eventId);
}

export async function backQuizQuestion(
  supabase: SupabaseClient,
  eventId: string,
): Promise<QuizSessionState> {
  const current = await loadCurrentQuiz(supabase, eventId);
  const newIndex = Math.max(0, current.currentIndex - 1);

  const quiz = freshPhase(
    {
      ...current,
      currentIndex: newIndex,
    },
    resolvePhaseAfterQuestionAdvance(
      current.questionIds,
      newIndex,
      current.manche,
    ),
  );

  await writeQuizState(supabase, eventId, quiz);
  return quiz;
}

/**
 * Sostituisce la prossima domanda (currentIndex+1) con un'altra della stessa
 * categoria non già in scaletta. Non tocca fase/indice — fuori dal binario AVANTI.
 */
export function pickSameCategoryReplacementId(
  bank: { id: string; category: string }[],
  questionIds: string[],
  targetIndex: number,
  random: () => number = Math.random,
): string | null {
  const targetId = questionIds[targetIndex];
  if (!targetId) return null;

  const target = bank.find((q) => q.id === targetId);
  if (!target) return null;

  const cat = target.category.trim().toLowerCase();
  const used = new Set(questionIds);
  const candidates = bank.filter(
    (q) =>
      q.id !== targetId &&
      q.category.trim().toLowerCase() === cat &&
      !used.has(q.id),
  );
  if (candidates.length === 0) return null;

  const pick = Math.floor(random() * candidates.length);
  return candidates[Math.min(pick, candidates.length - 1)]?.id ?? null;
}

export async function replaceNextQuizQuestion(
  supabase: SupabaseClient,
  eventId: string,
  targetIndex?: number,
): Promise<QuizSessionState> {
  const current = await loadCurrentQuiz(supabase, eventId);
  const index =
    targetIndex !== undefined
      ? targetIndex
      : current.currentIndex + 1;

  if (index < 0 || index >= current.total) {
    throw new Error("Non c’è una domanda da cambiare in questa posizione.");
  }

  const { questions, source } = await getQuestionsForEvent(supabase, eventId);
  const bank =
    source === "pool"
      ? await materializePoolQuestionsForEvent(supabase, eventId, questions)
      : questions;

  const replacementId = pickSameCategoryReplacementId(
    bank,
    current.questionIds,
    index,
  );

  if (!replacementId) {
    throw new Error("Nessuna altra domanda disponibile in questa categoria.");
  }

  const questionIds = [...current.questionIds];
  questionIds[index] = replacementId;

  const quiz: QuizSessionState = {
    ...current,
    questionIds,
    updatedAt: nowIso(),
  };

  await writeQuizState(supabase, eventId, quiz);
  return quiz;
}

export async function transitionToMatching(
  supabase: SupabaseClient,
  eventId: string,
  options?: { questionIds?: string[]; force?: boolean },
): Promise<{ pairCount: number; skipped: boolean }> {
  const result = await computeAndPersistPairs(supabase, eventId, {
    questionIds: options?.questionIds,
    force: options?.force ?? false,
  });
  await writeQuizState(supabase, eventId, null);
  await updateSessionRuntimeState(supabase, eventId, "matching");
  return result;
}

export async function finishQuizSession(
  supabase: SupabaseClient,
  eventId: string,
): Promise<EventState> {
  const { data: row } = await supabase
    .from("events")
    .select("metadata")
    .eq("id", eventId)
    .maybeSingle();

  const metadata = (row?.metadata ?? {}) as Record<string, unknown>;
  const current = getQuizSessionState(metadata);

  await transitionToMatching(supabase, eventId, {
    questionIds: current?.questionIds,
  });
  return "matching";
}

export async function setQuizAutoplayEnabled(
  supabase: SupabaseClient,
  eventId: string,
  enabled: boolean,
): Promise<QuizSessionState> {
  const current = await loadCurrentQuiz(supabase, eventId);

  const quiz: QuizSessionState = {
    ...current,
    autoplayEnabled: enabled,
    updatedAt: nowIso(),
  };

  await writeQuizState(supabase, eventId, quiz);
  return quiz;
}

export async function setQuizAutoplaySeconds(
  supabase: SupabaseClient,
  eventId: string,
  autoplaySeconds: number,
): Promise<QuizSessionState> {
  const current = await loadCurrentQuiz(supabase, eventId);
  const seconds = Math.max(3, Math.min(120, autoplaySeconds));

  const quiz: QuizSessionState = {
    ...current,
    autoplaySeconds: seconds,
    timing: { ...current.timing, questionSeconds: seconds },
    updatedAt: nowIso(),
  };

  await writeQuizState(supabase, eventId, quiz);
  return quiz;
}

/** Recovery leggero: riparte da Qn (1-based → index) su theme_intro, senza wipe. */
export async function resumeQuizAtIndex(
  supabase: SupabaseClient,
  eventId: string,
  targetIndex: number,
): Promise<QuizSessionState> {
  const current = await loadCurrentQuiz(supabase, eventId);
  if (
    !Number.isInteger(targetIndex) ||
    targetIndex < 0 ||
    targetIndex >= current.total
  ) {
    throw new Error("Domanda fuori range.");
  }

  const quiz = freshPhase(
    {
      ...current,
      currentIndex: targetIndex,
    },
    resolvePhaseAfterQuestionAdvance(
      current.questionIds,
      targetIndex,
      current.manche,
    ),
  );

  logAvantiBinary("info", "resume quiz at index (recovery)", {
    eventId,
    from: current.displayPhase,
    to: quiz.displayPhase,
    index: targetIndex,
    total: current.total,
  });

  await writeQuizState(supabase, eventId, quiz);
  return quiz;
}

export async function setQuizDisplayPhase(
  supabase: SupabaseClient,
  eventId: string,
  displayPhase: QuizDisplayPhase,
): Promise<QuizSessionState> {
  const current = await loadCurrentQuiz(supabase, eventId);
  const quiz = freshPhase(current, displayPhase);
  await writeQuizState(supabase, eventId, quiz);
  return quiz;
}

/** Al Buio live: salta le % fino a fine manche. Se già su results, avanza subito. */
export async function setQuizSkipResults(
  supabase: SupabaseClient,
  eventId: string,
  skipResults: boolean,
): Promise<{ quiz: QuizSessionState | null; runtimeState: EventState }> {
  const current = await loadCurrentQuiz(supabase, eventId);
  const patched: QuizSessionState = {
    ...current,
    skipResults,
    updatedAt: nowIso(),
  };
  await writeQuizState(supabase, eventId, patched);

  if (skipResults && patched.displayPhase === "results") {
    return tickQuizPhase(supabase, eventId, true);
  }

  return { quiz: patched, runtimeState: "quiz" };
}
