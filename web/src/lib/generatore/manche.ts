import type { SupabaseClient } from "@supabase/supabase-js";
import type { LoveRouletteQuestion } from "@/lib/musicpro/types";
import { getQuestionsForEvent } from "@/lib/musicpro/questions";
import {
  getQuizMancheFromMetadata,
  getQuizSessionState,
} from "@/lib/musicpro/quiz-state";
import type {
  GeneratoreExportMeta,
  GeneratoreManche,
  GeneratoreMancheDocument,
  GeneratoreQuestion,
} from "./types";
import { GENERATORE_FORMAT_ID } from "./types";
import type { QuizMancheTheme } from "@/lib/musicpro/quiz-display";
import { DEFAULT_QUIZ_TIMING } from "@/lib/musicpro/quiz-display";

function toGeneratoreQuestion(q: LoveRouletteQuestion): GeneratoreQuestion {
  return {
    id: q.id,
    body: q.body,
    category: q.category,
    weight: q.weight,
    options: q.options.map((o, index) => ({
      id: o.id,
      label: o.label,
      sort_order: o.sortOrder ?? index,
    })),
  };
}

export async function exportMancheDocument(
  supabase: SupabaseClient,
  eventId: string,
  eventCode: string,
): Promise<GeneratoreMancheDocument> {
  const { data: eventRow } = await supabase
    .from("events")
    .select("metadata")
    .eq("id", eventId)
    .maybeSingle();

  const metadata = (eventRow?.metadata ?? {}) as Record<string, unknown>;
  const storedManche = getQuizMancheFromMetadata(metadata);
  const { questions } = await getQuestionsForEvent(supabase, eventId);

  const timingRaw = metadata.love_roulette_quiz_timing;
  const meta: GeneratoreExportMeta = {
    start_countdown_seconds: DEFAULT_QUIZ_TIMING.startCountdownSeconds,
    theme_intro_seconds: DEFAULT_QUIZ_TIMING.themeIntroSeconds,
    question_timer_seconds: DEFAULT_QUIZ_TIMING.questionSeconds,
    results_seconds: DEFAULT_QUIZ_TIMING.resultsSeconds,
  };

  if (timingRaw && typeof timingRaw === "object" && !Array.isArray(timingRaw)) {
    const t = timingRaw as Record<string, unknown>;
    if (typeof t.startCountdownSeconds === "number") {
      meta.start_countdown_seconds = t.startCountdownSeconds;
    }
    if (typeof t.themeIntroSeconds === "number") {
      meta.theme_intro_seconds = t.themeIntroSeconds;
    }
    if (typeof t.questionSeconds === "number") {
      meta.question_timer_seconds = t.questionSeconds;
    }
    if (typeof t.resultsSeconds === "number") {
      meta.results_seconds = t.resultsSeconds;
    }
  }

  if (storedManche && storedManche.length > 0) {
    const manche: GeneratoreManche[] = storedManche.map((m) => ({
      id: m.mancheId,
      order: m.order,
      theme_title: m.title,
      theme_subtitle: m.subtitle,
      questions: m.questionIds
        .map((id) => questions.find((q) => q.id === id))
        .filter((q): q is LoveRouletteQuestion => Boolean(q))
        .map(toGeneratoreQuestion),
    }));

    return {
      format: GENERATORE_FORMAT_ID,
      version: 1,
      event_code: eventCode,
      exported_at: new Date().toISOString(),
      manche,
      meta,
    };
  }

  const byCategory = new Map<string, LoveRouletteQuestion[]>();
  for (const q of questions) {
    const list = byCategory.get(q.category) ?? [];
    list.push(q);
    byCategory.set(q.category, list);
  }

  const manche: GeneratoreManche[] = Array.from(byCategory.entries()).map(
    ([category, categoryQuestions], index) => ({
      id: `manche_${category}`,
      order: index + 1,
      theme_title: category.charAt(0).toUpperCase() + category.slice(1),
      theme_subtitle: undefined,
      questions: categoryQuestions.map(toGeneratoreQuestion),
    }),
  );

  return {
    format: GENERATORE_FORMAT_ID,
    version: 1,
    event_code: eventCode,
    exported_at: new Date().toISOString(),
    manche,
    meta,
  };
}

export function validateMancheDocument(
  document: GeneratoreMancheDocument,
): string | null {
  if (document.format !== GENERATORE_FORMAT_ID) {
    return `Formato non supportato: ${String(document.format)}`;
  }
  if (document.version !== 1) {
    return `Versione non supportata: ${String(document.version)}`;
  }
  if (!Array.isArray(document.manche) || document.manche.length === 0) {
    return "Nessuna manche nel documento.";
  }

  for (const manche of document.manche) {
    if (!manche.id?.trim()) {
      return "Manche senza id.";
    }
    if (!manche.theme_title?.trim()) {
      return `Manche ${manche.id}: theme_title mancante.`;
    }
    if (!Array.isArray(manche.questions) || manche.questions.length === 0) {
      return `Manche ${manche.id}: nessuna domanda.`;
    }
    for (const question of manche.questions) {
      if (!question.body?.trim()) {
        return `Domanda ${question.id}: testo mancante.`;
      }
      if (!Array.isArray(question.options) || question.options.length !== 4) {
        return `Domanda ${question.id}: servono esattamente 4 opzioni.`;
      }
      for (const option of question.options) {
        if (!option.label?.trim()) {
          return `Domanda ${question.id}: opzione senza testo.`;
        }
      }
    }
  }

  return null;
}

/** Content-only view for import/export round-trip checks (ignores ids and timestamps). */
export function snapshotGeneratoreContent(
  document: GeneratoreMancheDocument,
): unknown {
  return {
    manche: [...document.manche]
      .sort((a, b) => a.order - b.order)
      .map((manche) => ({
        order: manche.order,
        theme_title: manche.theme_title.trim(),
        theme_subtitle: manche.theme_subtitle?.trim() || undefined,
        questions: manche.questions.map((question, questionIndex) => ({
          body: question.body.trim(),
          category: question.category || "lifestyle",
          weight: question.weight ?? 1,
          options: question.options.map((option, optionIndex) => ({
            label: option.label.trim(),
            sort_order: option.sort_order ?? optionIndex,
          })),
        })),
      })),
    meta: document.meta ?? null,
  };
}

export interface ImportMancheResult {
  manche: QuizMancheTheme[];
  questionCount: number;
  timing: typeof DEFAULT_QUIZ_TIMING;
}

export async function importMancheDocument(
  supabase: SupabaseClient,
  eventId: string,
  document: GeneratoreMancheDocument,
): Promise<ImportMancheResult> {
  const validationError = validateMancheDocument(document);
  if (validationError) {
    throw new Error(validationError);
  }

  const { error: deactivateError } = await supabase
    .from("love_roulette_questions")
    .update({ is_active: false })
    .eq("event_id", eventId)
    .eq("is_active", true);

  if (deactivateError) throw new Error(deactivateError.message);

  const mancheThemes: QuizMancheTheme[] = [];
  let globalSort = 0;

  for (const manche of [...document.manche].sort((a, b) => a.order - b.order)) {
    const questionIds: string[] = [];

    for (const question of manche.questions) {
      const { data: questionRow, error: questionError } = await supabase
        .from("love_roulette_questions")
        .insert({
          event_id: eventId,
          body: question.body.trim(),
          category: question.category || "lifestyle",
          weight: question.weight ?? 1,
          sort_order: globalSort,
          is_active: true,
        })
        .select("id")
        .single();

      if (questionError) throw new Error(questionError.message);

      const optionRows = question.options.map((option, index) => ({
        question_id: questionRow.id,
        sort_order: option.sort_order ?? index,
        label: option.label.trim(),
      }));

      const { error: optionError } = await supabase
        .from("love_roulette_question_options")
        .insert(optionRows);

      if (optionError) throw new Error(optionError.message);

      questionIds.push(questionRow.id);
      globalSort += 1;
    }

    mancheThemes.push({
      mancheId: manche.id,
      order: manche.order,
      title: manche.theme_title.trim(),
      subtitle: manche.theme_subtitle?.trim(),
      questionIds,
    });
  }

  const meta = document.meta;
  const timing = {
    startCountdownSeconds:
      meta?.start_countdown_seconds ?? DEFAULT_QUIZ_TIMING.startCountdownSeconds,
    themeIntroSeconds:
      meta?.theme_intro_seconds ?? DEFAULT_QUIZ_TIMING.themeIntroSeconds,
    questionStemSeconds:
      meta?.question_stem_seconds ?? DEFAULT_QUIZ_TIMING.questionStemSeconds,
    questionSeconds:
      meta?.question_timer_seconds ?? DEFAULT_QUIZ_TIMING.questionSeconds,
    resultsSeconds:
      meta?.results_seconds ?? DEFAULT_QUIZ_TIMING.resultsSeconds,
    nextQuestionSeconds:
      meta?.next_question_seconds ?? DEFAULT_QUIZ_TIMING.nextQuestionSeconds,
  };

  const { data: row } = await supabase
    .from("events")
    .select("metadata")
    .eq("id", eventId)
    .maybeSingle();

  const metadata = (row?.metadata ?? {}) as Record<string, unknown>;
  const quiz = getQuizSessionState(metadata);

  const nextMetadata: Record<string, unknown> = {
    ...metadata,
    love_roulette_manche: mancheThemes,
    love_roulette_quiz_timing: timing,
  };

  if (quiz) {
    delete nextMetadata.love_roulette_quiz;
  }

  const { error: updateError } = await supabase
    .from("events")
    .update({ metadata: nextMetadata })
    .eq("id", eventId);

  if (updateError) throw new Error(updateError.message);

  return {
    manche: mancheThemes,
    questionCount: globalSort,
    timing,
  };
}
