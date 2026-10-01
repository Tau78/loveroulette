import type { SupabaseClient } from "@supabase/supabase-js";
import { logAvantiBinary } from "@/lib/admin/avanti-binary-log";
import type { EventState } from "@/lib/types";
import { computeAndPersistPairs, computePreviewPairs } from "./matching";
import {
  getQuestionsForEvent,
  materializePoolQuestionsForEvent,
} from "./questions";
import {
  DEFAULT_HIDE_RANKING_LAST_N,
  DEFAULT_QUIZ_TIMING,
  DEFAULT_RANKING_EVERY_N,
  RANKING_MAX_COUPLES,
  rankingCouplePageCount,
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
import { buildBalancedQuizLineup } from "./quiz-lineup";
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
  /**
   * Classifica intermedia: 0 = slide «CLASSIFICA PROVVISORIA»,
   * 1..N = pagine da 5 coppie (senza %).
   */
  rankingPage?: number;
  /** Quante pagine coppie dopo il titolo (min 1). */
  rankingCouplePages?: number;
}

function nowIso(): string {
  return new Date().toISOString();
}

function normalizeTiming(raw: unknown): QuizTimingConfig {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ...DEFAULT_QUIZ_TIMING };
  }
  const record = raw as Record<string, unknown>;
  /** Hold / slide: minimo 5s così Autoplay non resta bloccato senza tempo. */
  const num = (
    key: keyof QuizTimingConfig,
    fallback: number,
    minSec = 5,
  ) => {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return Math.max(minSec, Math.min(120, Math.round(value)));
    }
    return fallback;
  };
  return {
    startCountdownSeconds: num("startCountdownSeconds", 5),
    themeIntroSeconds: num("themeIntroSeconds", 5),
    questionStemSeconds: num("questionStemSeconds", 5),
    questionSeconds: num("questionSeconds", 15, 3),
    resultsSeconds: num("resultsSeconds", 6),
    nextQuestionSeconds: num("nextQuestionSeconds", 5),
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
  /**
   * Se true, tiene Autoplay acceso anche dopo stacco (skipLaunch).
   * Default storico: skipLaunch → autoplay off (hold AVANTI sul tema).
   */
  autoplayEnabled?: boolean;
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

  const rankingPage =
    typeof record.rankingPage === "number" &&
    Number.isFinite(record.rankingPage)
      ? Math.max(0, Math.min(20, Math.round(record.rankingPage)))
      : 0;
  const rankingCouplePages =
    typeof record.rankingCouplePages === "number" &&
    Number.isFinite(record.rankingCouplePages)
      ? Math.max(1, Math.min(20, Math.round(record.rankingCouplePages)))
      : 1;

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
    rankingPage,
    rankingCouplePages,
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
  extras?: Partial<
    Pick<
      QuizSessionState,
      "gongCueKey" | "rankingPage" | "rankingCouplePages"
    >
  >,
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

async function resolveRankingCouplePages(
  supabase: SupabaseClient,
  eventId: string,
  quiz: QuizSessionState,
): Promise<number> {
  const preview = await computePreviewPairs(supabase, eventId, {
    questionIds: quiz.questionIds.slice(0, quiz.currentIndex + 1),
    limit: RANKING_MAX_COUPLES,
  });
  return rankingCouplePageCount(preview.pairs.length);
}

const RECENT_QUESTION_IDS_KEY = "love_roulette_recent_question_ids";

function readRecentQuestionIds(
  metadata: Record<string, unknown>,
): string[] {
  const raw = metadata[RECENT_QUESTION_IDS_KEY];
  if (!Array.isArray(raw)) return [];
  return raw.map(String).filter(Boolean);
}

async function persistRecentQuestionIds(
  supabase: SupabaseClient,
  eventId: string,
  questionIds: string[],
): Promise<void> {
  const { data: row, error: fetchError } = await supabase
    .from("events")
    .select("metadata")
    .eq("id", eventId)
    .maybeSingle();
  if (fetchError || !row) return;

  const metadata = (row.metadata ?? {}) as Record<string, unknown>;
  const prev = readRecentQuestionIds(metadata);
  // Tieni le ultime ~2 manche per evitare ripetizioni immediate.
  const merged = [...questionIds, ...prev].slice(0, Math.max(questionIds.length * 2, 30));
  const unique: string[] = [];
  for (const id of merged) {
    if (!unique.includes(id)) unique.push(id);
  }

  await supabase
    .from("events")
    .update({
      metadata: {
        ...metadata,
        [RECENT_QUESTION_IDS_KEY]: unique,
      },
    })
    .eq("id", eventId);
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

  const poolSnapshot = questions;
  const quizQuestions =
    source === "pool"
      ? await materializePoolQuestionsForEvent(supabase, eventId, questions)
      : questions;

  const bankById = new Map(quizQuestions.map((q) => [q.id, q]));
  /** Plancia pre-quiz manda id pool; dopo materialize servono id evento. */
  const aliasToEventId = new Map<string, string>();
  if (source === "pool") {
    for (let i = 0; i < poolSnapshot.length; i++) {
      const poolQ = poolSnapshot[i];
      if (!poolQ) continue;
      const eventQ =
        quizQuestions.find((q) => q.body === poolQ.body) ?? quizQuestions[i];
      if (eventQ) aliasToEventId.set(poolQ.id, eventQ.id);
    }
  }

  let questionIds: string[];

  if (options.questionIds?.length) {
    const unique: string[] = [];
    for (const id of options.questionIds) {
      const resolved = bankById.has(id) ? id : aliasToEventId.get(id);
      if (!resolved || !bankById.has(resolved) || unique.includes(resolved)) {
        continue;
      }
      unique.push(resolved);
    }
    if (unique.length === 0) {
      throw new Error("Scaletta domande non valida.");
    }
    questionIds = unique;
  } else {
    // N domande variate su tutti gli argomenti (non il prefisso del banco).
    const count =
      options.questionCount !== undefined
        ? Math.max(1, Math.min(quizQuestions.length, options.questionCount))
        : quizQuestions.length;
    const recent = readRecentQuestionIds(metadata);
    questionIds = buildBalancedQuizLineup(
      quizQuestions.map((q) => ({ id: q.id, category: q.category })),
      count,
      Math.random,
      { excludeIds: recent },
    );
  }

  await persistRecentQuestionIds(supabase, eventId, questionIds);

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
    // Dopo stacco: di default hold AVANTI; plancia può chiedere Autoplay già on.
    autoplayEnabled:
      options.autoplayEnabled !== undefined
        ? options.autoplayEnabled === true
        : skipLaunch
          ? false
          : true,
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

    // Classifica intermedia: titolo (page 0) → pagine da 5 coppie → poi advance.
    if (fromPhase === "next_question") {
      const page = current.rankingPage ?? 0;
      const couplePages = Math.max(1, current.rankingCouplePages ?? 1);
      if (page < couplePages) {
        const nextPage = page + 1;
        logAvantiBinary(
          "advance",
          `ranking page ${page}→${nextPage} (couples)`,
          {
            eventId,
            from: fromPhase,
            to: "next_question",
            index: fromIndex,
            total: current.total,
            force,
          },
        );
        current = freshPhase(
          {
            ...current,
            rankingPage: nextPage,
            rankingCouplePages: couplePages,
          },
          "next_question",
        );
        await writeQuizState(supabase, eventId, current);
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
        continue;
      }
    }

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
          rankingPage: 0,
          rankingCouplePages: 1,
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

      let rankingExtras:
        | Pick<QuizSessionState, "rankingPage" | "rankingCouplePages">
        | undefined;
      if (next === "next_question" && fromPhase !== "next_question") {
        const couplePages = await resolveRankingCouplePages(
          supabase,
          eventId,
          current,
        );
        rankingExtras = {
          rankingPage: 0,
          rankingCouplePages: couplePages,
        };
        logAvantiBinary("info", "ranking hold ready", {
          eventId,
          from: fromPhase,
          to: next,
          index: fromIndex,
          total: current.total,
          force,
        });
      } else if (next !== "next_question") {
        rankingExtras = { rankingPage: 0, rankingCouplePages: 1 };
      }

      current = freshPhase(current, next, {
        ...(gongCueKey ? { gongCueKey } : {}),
        ...rankingExtras,
      });
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
 * Sostituisce la domanda allo slot con un'altra della stessa
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

export type LineupReplacement =
  | { kind: "replace"; questionId: string }
  | { kind: "swap"; withIndex: number };

/**
 * «Cambia domanda»: solo stesso argomento, fuori scaletta.
 * Niente fallback cross-categoria né swap (evita di cambiare tema).
 */
export function pickLineupReplacement(
  bank: { id: string; category: string }[],
  questionIds: string[],
  targetIndex: number,
  random: () => number = Math.random,
): LineupReplacement | null {
  const sameCat = pickSameCategoryReplacementId(
    bank,
    questionIds,
    targetIndex,
    random,
  );
  if (sameCat) return { kind: "replace", questionId: sameCat };
  return null;
}

export function applyLineupReplacement(
  questionIds: string[],
  targetIndex: number,
  replacement: LineupReplacement,
): string[] {
  const next = [...questionIds];
  if (replacement.kind === "replace") {
    next[targetIndex] = replacement.questionId;
    return next;
  }
  const a = next[targetIndex];
  const b = next[replacement.withIndex];
  if (a == null || b == null) return questionIds;
  next[targetIndex] = b;
  next[replacement.withIndex] = a;
  return next;
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

  const replacement = pickLineupReplacement(bank, current.questionIds, index);

  if (!replacement) {
    throw new Error(
      "Nessuna altra domanda di questo argomento da mettere al posto.",
    );
  }

  const questionIds = applyLineupReplacement(
    current.questionIds,
    index,
    replacement,
  );

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
  let rankingExtras:
    | Pick<QuizSessionState, "rankingPage" | "rankingCouplePages">
    | undefined;
  if (displayPhase === "next_question") {
    const couplePages = await resolveRankingCouplePages(
      supabase,
      eventId,
      current,
    );
    rankingExtras = { rankingPage: 0, rankingCouplePages: couplePages };
  } else {
    rankingExtras = { rankingPage: 0, rankingCouplePages: 1 };
  }
  const quiz = freshPhase(current, displayPhase, rankingExtras);
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
