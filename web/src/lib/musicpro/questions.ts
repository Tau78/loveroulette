import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  LoveRouletteQuestion,
  LoveRouletteQuestionOption,
  LoveRouletteQuestionSource,
} from "./types";

const MAX_QUESTIONS = 27;

/** Inline Q1–Q5 when pool is empty in local development (see docs/06-question-bank.md). */
const DEV_FALLBACK_QUESTIONS: Array<
  Omit<LoveRouletteQuestion, "id" | "options"> & {
    options: Array<Omit<LoveRouletteQuestionOption, "id">>;
  }
> = [
  {
    body: "La serata ideale per te è...",
    category: "lifestyle",
    weight: 1,
    sortOrder: 0,
    options: [
      { sortOrder: 0, label: "Discoteca fino all'alba" },
      { sortOrder: 1, label: "Cena romantica a lume di candela" },
      { sortOrder: 2, label: "Serata Netflix sul divano" },
      { sortOrder: 3, label: "Avventura all'aperto" },
    ],
  },
  {
    body: "Come ti prepari per uscire?",
    category: "lifestyle",
    weight: 1,
    sortOrder: 1,
    options: [
      { sortOrder: 0, label: "Ore davanti allo specchio" },
      { sortOrder: 1, label: "Dieci minuti e via" },
      { sortOrder: 2, label: "Chiedo consiglio a un amico" },
      { sortOrder: 3, label: "Dipende dall'umore" },
    ],
  },
  {
    body: "Il tuo piatto preferito per un primo appuntamento è...",
    category: "lifestyle",
    weight: 1,
    sortOrder: 2,
    options: [
      { sortOrder: 0, label: "Pizza e birra" },
      { sortOrder: 1, label: "Sushi elegante" },
      { sortOrder: 2, label: "Cucina casalinga" },
      { sortOrder: 3, label: "Tapas da condividere" },
    ],
  },
  {
    body: "Domenica mattina tipica?",
    category: "lifestyle",
    weight: 1,
    sortOrder: 3,
    options: [
      { sortOrder: 0, label: "Sport o passeggiata" },
      { sortOrder: 1, label: "Dormire fino a mezzogiorno" },
      { sortOrder: 2, label: "Brunch con amici" },
      { sortOrder: 3, label: "Progetti creativi" },
    ],
  },
  {
    body: "In vacanza preferisci...",
    category: "lifestyle",
    weight: 1,
    sortOrder: 4,
    options: [
      { sortOrder: 0, label: "Mare e relax totale" },
      { sortOrder: 1, label: "Città d'arte e musei" },
      { sortOrder: 2, label: "Trekking e natura" },
      { sortOrder: 3, label: "Feste e nightlife" },
    ],
  },
];

function getDevFallbackQuestions(): LoveRouletteQuestion[] {
  return DEV_FALLBACK_QUESTIONS.map((question, questionIndex) => ({
    ...question,
    id: `00000000-0000-4000-8000-${String(questionIndex + 1).padStart(12, "0")}`,
    options: question.options.map((option, optionIndex) => ({
      ...option,
      id: `10000000-0000-4000-8000-${String(questionIndex + 1).padStart(2, "0")}${String(optionIndex + 1).padStart(10, "0")}`,
    })),
  }));
}

type QuestionRow = {
  id: string;
  body: string;
  category: string;
  weight: number;
  sort_order?: number;
  love_roulette_question_options?: Array<{
    id: string;
    sort_order: number;
    label: string;
  }>;
};

type PoolRow = {
  id: string;
  body: string;
  category: string;
  weight: number;
  love_roulette_question_pool_options?: Array<{
    id: string;
    sort_order: number;
    label: string;
  }>;
};

function mapOptions(
  options: Array<{ id: string; sort_order: number; label: string }> | undefined,
): LoveRouletteQuestionOption[] {
  return (options ?? [])
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((o) => ({
      id: o.id,
      sortOrder: o.sort_order,
      label: o.label,
    }));
}

function mapEventQuestions(rows: QuestionRow[]): LoveRouletteQuestion[] {
  return rows.map((q) => ({
    id: q.id,
    body: q.body,
    category: q.category,
    weight: q.weight,
    sortOrder: q.sort_order ?? 0,
    options: mapOptions(q.love_roulette_question_options),
  }));
}

function mapPoolQuestions(rows: PoolRow[]): LoveRouletteQuestion[] {
  return rows.map((q, index) => ({
    id: q.id,
    body: q.body,
    category: q.category,
    weight: q.weight,
    sortOrder: index,
    options: mapOptions(q.love_roulette_question_pool_options),
  }));
}

async function fetchEventQuestions(
  supabase: SupabaseClient,
  eventId: string,
): Promise<LoveRouletteQuestion[]> {
  const { data, error } = await supabase
    .from("love_roulette_questions")
    .select(
      "id, body, category, weight, sort_order, love_roulette_question_options(id, sort_order, label)",
    )
    .eq("event_id", eventId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);
  return mapEventQuestions((data ?? []) as QuestionRow[]);
}

async function fetchPoolQuestions(
  supabase: SupabaseClient,
): Promise<LoveRouletteQuestion[]> {
  const { data, error } = await supabase
    .from("love_roulette_question_pool")
    .select(
      "id, body, category, weight, love_roulette_question_pool_options(id, sort_order, label)",
    )
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(MAX_QUESTIONS);

  if (error) throw new Error(error.message);
  return mapPoolQuestions((data ?? []) as PoolRow[]);
}

export interface QuestionsForEventResult {
  source: LoveRouletteQuestionSource;
  questions: LoveRouletteQuestion[];
}

export async function getQuestionsForEvent(
  supabase: SupabaseClient,
  eventId: string,
): Promise<QuestionsForEventResult> {
  const eventQuestions = await fetchEventQuestions(supabase, eventId);
  if (eventQuestions.length > 0) {
    return { source: "event", questions: eventQuestions };
  }

  const poolQuestions = await fetchPoolQuestions(supabase);
  if (poolQuestions.length > 0) {
    return { source: "pool", questions: poolQuestions };
  }

  if (process.env.NODE_ENV === "development") {
    return { source: "pool", questions: getDevFallbackQuestions() };
  }

  return { source: "pool", questions: [] };
}

/** Copy pool (or dev-fallback) rows into per-event questions so answers can use existing FKs. */
async function insertQuestionsForEvent(
  supabase: SupabaseClient,
  eventId: string,
  questions: LoveRouletteQuestion[],
): Promise<LoveRouletteQuestion[]> {
  const materialized: LoveRouletteQuestion[] = [];

  for (let index = 0; index < questions.length; index++) {
    const poolQuestion = questions[index];

    const { data: questionRow, error: questionError } = await supabase
      .from("love_roulette_questions")
      .insert({
        event_id: eventId,
        body: poolQuestion.body,
        category: poolQuestion.category,
        weight: poolQuestion.weight,
        sort_order: poolQuestion.sortOrder ?? index,
        is_active: true,
      })
      .select("id, body, category, weight, sort_order")
      .single();

    if (questionError) throw new Error(questionError.message);

    const optionRows = poolQuestion.options.map((option) => ({
      question_id: questionRow.id,
      sort_order: option.sortOrder,
      label: option.label,
    }));

    const { data: optionRowsInserted, error: optionError } = await supabase
      .from("love_roulette_question_options")
      .insert(optionRows)
      .select("id, sort_order, label");

    if (optionError) throw new Error(optionError.message);

    materialized.push({
      id: questionRow.id,
      body: questionRow.body,
      category: questionRow.category,
      weight: questionRow.weight,
      sortOrder: questionRow.sort_order ?? index,
      options: mapOptions(optionRowsInserted ?? undefined),
    });
  }

  return materialized;
}

export async function materializePoolQuestionsForEvent(
  supabase: SupabaseClient,
  eventId: string,
  poolQuestions: LoveRouletteQuestion[],
): Promise<LoveRouletteQuestion[]> {
  const existing = await fetchEventQuestions(supabase, eventId);
  if (existing.length > 0) {
    return existing;
  }

  return insertQuestionsForEvent(supabase, eventId, poolQuestions);
}

async function resolvePoolQuestionForAnswer(
  supabase: SupabaseClient,
  eventId: string,
  questionId: string,
  optionId: string,
): Promise<{ questionId: string; optionId: string } | null> {
  const { data: poolQuestion, error: poolQuestionError } = await supabase
    .from("love_roulette_question_pool")
    .select(
      "id, body, category, weight, love_roulette_question_pool_options(id, sort_order, label)",
    )
    .eq("id", questionId)
    .eq("is_active", true)
    .maybeSingle();

  if (poolQuestionError) throw new Error(poolQuestionError.message);
  if (!poolQuestion) return null;

  const poolOptions = mapOptions(
    (poolQuestion as PoolRow).love_roulette_question_pool_options,
  );
  const poolOption = poolOptions.find((option) => option.id === optionId);
  if (!poolOption) {
    throw new Error("Option not found for this question");
  }

  const poolAsQuestion: LoveRouletteQuestion = {
    id: poolQuestion.id,
    body: poolQuestion.body,
    category: poolQuestion.category,
    weight: poolQuestion.weight,
    sortOrder: 0,
    options: poolOptions,
  };

  const eventQuestions = await fetchEventQuestions(supabase, eventId);
  let materialized =
    eventQuestions.find((question) => question.body === poolQuestion.body) ??
    null;

  if (!materialized) {
    [materialized] = await insertQuestionsForEvent(supabase, eventId, [
      poolAsQuestion,
    ]);
  }

  const eventOption = materialized.options.find(
    (option) => option.sortOrder === poolOption.sortOrder,
  );
  if (!eventOption) {
    throw new Error("Option not found for this question");
  }

  return {
    questionId: materialized.id,
    optionId: eventOption.id,
  };
}

export interface SubmitAnswerInput {
  eventId: string;
  participantId: string;
  questionId: string;
  optionId: string;
}

export interface LoveRouletteAnswer {
  id: string;
  participantId: string;
  questionId: string;
  optionId: string;
  answeredAt: string;
}

export async function submitAnswer(
  supabase: SupabaseClient,
  input: SubmitAnswerInput,
): Promise<LoveRouletteAnswer> {
  const { data: participant, error: participantError } = await supabase
    .from("love_roulette_participants")
    .select("id, event_id")
    .eq("id", input.participantId)
    .maybeSingle();

  if (participantError) throw new Error(participantError.message);
  if (!participant || participant.event_id !== input.eventId) {
    throw new Error("Participant not found for this event");
  }

  let questionId = input.questionId;
  let optionId = input.optionId;

  const { data: question, error: questionError } = await supabase
    .from("love_roulette_questions")
    .select("id")
    .eq("id", questionId)
    .eq("event_id", input.eventId)
    .eq("is_active", true)
    .maybeSingle();

  if (questionError) throw new Error(questionError.message);
  if (!question) {
    const resolved = await resolvePoolQuestionForAnswer(
      supabase,
      input.eventId,
      questionId,
      optionId,
    );
    if (!resolved) {
      const devQuestion = getDevFallbackQuestions().find(
        (candidate) => candidate.id === questionId,
      );
      if (devQuestion && process.env.NODE_ENV === "development") {
        const eventQuestions = await fetchEventQuestions(supabase, input.eventId);
        let materialized =
          eventQuestions.find(
            (candidate) => candidate.body === devQuestion.body,
          ) ?? null;

        if (!materialized) {
          [materialized] = await insertQuestionsForEvent(
            supabase,
            input.eventId,
            [devQuestion],
          );
        }

        const devOption = materialized.options.find(
          (option) =>
            option.sortOrder ===
            devQuestion.options.find((candidate) => candidate.id === optionId)
              ?.sortOrder,
        );
        if (!devOption) {
          throw new Error("Option not found for this question");
        }
        questionId = materialized.id;
        optionId = devOption.id;
      } else {
        throw new Error("Question not found for this event");
      }
    } else {
      questionId = resolved.questionId;
      optionId = resolved.optionId;
    }
  }

  const { data: option, error: optionError } = await supabase
    .from("love_roulette_question_options")
    .select("id")
    .eq("id", optionId)
    .eq("question_id", questionId)
    .maybeSingle();

  if (optionError) throw new Error(optionError.message);
  if (!option) {
    throw new Error("Option not found for this question");
  }

  const { data, error } = await supabase
    .from("love_roulette_answers")
    .insert({
      participant_id: input.participantId,
      question_id: questionId,
      option_id: optionId,
    })
    .select("id, participant_id, question_id, option_id, answered_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("Answer already submitted for this question");
    }
    throw new Error(error.message);
  }

  return {
    id: data.id,
    participantId: data.participant_id,
    questionId: data.question_id,
    optionId: data.option_id,
    answeredAt: data.answered_at,
  };
}
