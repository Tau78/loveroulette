import type { SupabaseClient } from "@supabase/supabase-js";
import type { EventState } from "@/lib/types";
import { computeAndPersistPairs } from "./matching";
import {
  getQuestionsForEvent,
  materializePoolQuestionsForEvent,
} from "./questions";
import {
  DEFAULT_QUIZ_TIMING,
  type QuizDisplayPhase,
  type QuizMancheTheme,
  type QuizTimingConfig,
  isPhaseExpired,
  nextQuizDisplayPhase,
  resolvePhaseAfterQuestionAdvance,
} from "./quiz-display";
import type { LoveRouletteQuestionSource } from "./types";
import { updateSessionRuntimeState } from "./session";

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
}

export function getQuizSetupPrefs(
  metadata: Record<string, unknown> | null | undefined,
): QuizSetupPrefs {
  const timing = normalizeTiming(metadata?.love_roulette_quiz_timing);
  const raw = metadata?.love_roulette_quiz_prefs;
  let questionCount: number | null = null;
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const value = (raw as Record<string, unknown>).questionCount;
    if (typeof value === "number" && value >= 1) {
      questionCount = value;
    }
  }
  return {
    questionCount,
    questionSeconds: timing.questionSeconds,
  };
}

export interface StartQuizSessionOptions {
  questionCount?: number;
  questionSeconds?: number;
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
    nextMetadata.love_roulette_quiz = quiz;
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

  const { questions, source } = await getQuestionsForEvent(supabase, eventId);

  if (questions.length === 0) {
    throw new Error("Nessuna domanda disponibile per questo evento.");
  }

  const quizQuestions =
    source === "pool"
      ? await materializePoolQuestionsForEvent(supabase, eventId, questions)
      : questions;

  let questionIds = quizQuestions.map((q) => q.id);
  if (options.questionCount !== undefined) {
    const limit = Math.max(1, Math.min(questionIds.length, options.questionCount));
    questionIds = questionIds.slice(0, limit);
  }

  await persistQuizSetupMetadata(supabase, eventId, {
    questionCount: questionIds.length,
    questionSeconds: timing.questionSeconds,
  }, timing);

  const at = nowIso();
  const quiz: QuizSessionState = {
    questionIds,
    currentIndex: 0,
    total: questionIds.length,
    source: source === "pool" ? "event" : source,
    autoplaySeconds: timing.questionSeconds,
    autoplayEnabled: true,
    updatedAt: at,
    displayPhase: "start_countdown",
    phaseStartedAt: at,
    timing,
    manche,
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
  );
}

export async function tickQuizPhase(
  supabase: SupabaseClient,
  eventId: string,
  force = false,
): Promise<{ quiz: QuizSessionState | null; runtimeState: EventState }> {
  let current = await loadCurrentQuiz(supabase, eventId);

  if (
    !force &&
    !isPhaseExpired(
      current.displayPhase,
      current.phaseStartedAt,
      current.timing,
    )
  ) {
    return { quiz: current, runtimeState: "quiz" };
  }

  const maxSteps = 8;

  for (let step = 0; step < maxSteps; step++) {
    const next = nextDisplayPhase(current);

    if (next === "finish") {
      await computeAndPersistPairs(supabase, eventId, {
        questionIds: current.questionIds,
      });
      await writeQuizState(supabase, eventId, null);
      await updateSessionRuntimeState(supabase, eventId, "matching");
      return { quiz: null, runtimeState: "matching" };
    }

    if (next === "advance_index") {
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
