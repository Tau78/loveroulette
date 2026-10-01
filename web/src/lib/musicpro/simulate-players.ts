import type { SupabaseClient } from "@supabase/supabase-js";
import { ensureDefaultGeneratoreImport } from "@/lib/generatore/auto-import";
import type { LoveRouletteAgeBand, LoveRouletteSeeking } from "@/lib/player/identity";
import {
  getQuestionsForEvent,
  materializePoolQuestionsForEvent,
} from "./questions";
import type { LoveRouletteGender, LoveRouletteQuestion } from "./types";
import { createParticipantAdmin } from "./participant-admin";
import { getQuizSessionState, transitionToMatching } from "./quiz-state";
import {
  type VotingSessionState,
  getVotingMetadata,
  readEventMetadata,
  writeVotingMetadataBundle,
} from "./voting";

/** Prefissi legacy (pre-roster con nomi veri). */
export const SIM_BOT_MALE_PREFIX = "Bot U";
export const SIM_BOT_FEMALE_PREFIX = "Bot D";

/** Badge test: TS01…TS20 (e legacy TU/TD/TN). */
const SIM_BOT_BADGE_RE = /^T(?:S|[UDN])\d{2}$/i;

export type SimBotProfile = {
  nickname: string;
  firstName: string;
  lastName: string;
  gender: LoveRouletteGender;
  seeking: LoveRouletteSeeking;
  ageBand: LoveRouletteAgeBand;
  /** Foto stock stabili (randomuser) per demo/regia. */
  photoUrl: string;
};

/**
 * 20 giocatori = 10 «coppie» di test.
 * Mix U/D/NB e cerco uomo / donna / entrambi.
 */
export const SIM_BOT_ROSTER: readonly SimBotProfile[] = [
  {
    nickname: "Marco",
    firstName: "Marco",
    lastName: "Rossi",
    gender: "male",
    seeking: "female",
    ageBand: "30_39",
    photoUrl: "https://randomuser.me/api/portraits/men/32.jpg",
  },
  {
    nickname: "Giulia",
    firstName: "Giulia",
    lastName: "Bianchi",
    gender: "female",
    seeking: "male",
    ageBand: "18_29",
    photoUrl: "https://randomuser.me/api/portraits/women/44.jpg",
  },
  {
    nickname: "Luca",
    firstName: "Luca",
    lastName: "Ferrari",
    gender: "male",
    seeking: "both",
    ageBand: "30_39",
    photoUrl: "https://randomuser.me/api/portraits/men/11.jpg",
  },
  {
    nickname: "Sofia",
    firstName: "Sofia",
    lastName: "Romano",
    gender: "female",
    seeking: "both",
    ageBand: "18_29",
    photoUrl: "https://randomuser.me/api/portraits/women/68.jpg",
  },
  {
    nickname: "Alex",
    firstName: "Alex",
    lastName: "Rivera",
    gender: "nonbinary",
    seeking: "both",
    ageBand: "18_29",
    photoUrl: "https://randomuser.me/api/portraits/men/75.jpg",
  },
  {
    nickname: "Chiara",
    firstName: "Chiara",
    lastName: "Greco",
    gender: "female",
    seeking: "male",
    ageBand: "30_39",
    photoUrl: "https://randomuser.me/api/portraits/women/21.jpg",
  },
  {
    nickname: "Davide",
    firstName: "Davide",
    lastName: "Ricci",
    gender: "male",
    seeking: "male",
    ageBand: "40_49",
    photoUrl: "https://randomuser.me/api/portraits/men/52.jpg",
  },
  {
    nickname: "Martina",
    firstName: "Martina",
    lastName: "Esposito",
    gender: "female",
    seeking: "female",
    ageBand: "18_29",
    photoUrl: "https://randomuser.me/api/portraits/women/33.jpg",
  },
  {
    nickname: "Sam",
    firstName: "Sam",
    lastName: "Moretti",
    gender: "nonbinary",
    seeking: "female",
    ageBand: "30_39",
    photoUrl: "https://randomuser.me/api/portraits/women/90.jpg",
  },
  {
    nickname: "Elena",
    firstName: "Elena",
    lastName: "Marino",
    gender: "female",
    seeking: "male",
    ageBand: "40_49",
    photoUrl: "https://randomuser.me/api/portraits/women/12.jpg",
  },
  {
    nickname: "Alessandro",
    firstName: "Alessandro",
    lastName: "Conti",
    gender: "male",
    seeking: "female",
    ageBand: "18_29",
    photoUrl: "https://randomuser.me/api/portraits/men/41.jpg",
  },
  {
    nickname: "Francesca",
    firstName: "Francesca",
    lastName: "Costa",
    gender: "female",
    seeking: "both",
    ageBand: "30_39",
    photoUrl: "https://randomuser.me/api/portraits/women/55.jpg",
  },
  {
    nickname: "Kai",
    firstName: "Kai",
    lastName: "Benedetti",
    gender: "nonbinary",
    seeking: "male",
    ageBand: "18_29",
    photoUrl: "https://randomuser.me/api/portraits/men/86.jpg",
  },
  {
    nickname: "Valentina",
    firstName: "Valentina",
    lastName: "Fontana",
    gender: "female",
    seeking: "male",
    ageBand: "30_39",
    photoUrl: "https://randomuser.me/api/portraits/women/26.jpg",
  },
  {
    nickname: "Niccolò",
    firstName: "Niccolò",
    lastName: "Barbieri",
    gender: "male",
    seeking: "both",
    ageBand: "40_49",
    photoUrl: "https://randomuser.me/api/portraits/men/18.jpg",
  },
  {
    nickname: "Giorgia",
    firstName: "Giorgia",
    lastName: "Lombardi",
    gender: "female",
    seeking: "male",
    ageBand: "18_29",
    photoUrl: "https://randomuser.me/api/portraits/women/47.jpg",
  },
  {
    nickname: "Matteo",
    firstName: "Matteo",
    lastName: "Rinaldi",
    gender: "male",
    seeking: "female",
    ageBand: "30_39",
    photoUrl: "https://randomuser.me/api/portraits/men/64.jpg",
  },
  {
    nickname: "Camilla",
    firstName: "Camilla",
    lastName: "Ferretti",
    gender: "female",
    seeking: "both",
    ageBand: "40_49",
    photoUrl: "https://randomuser.me/api/portraits/women/72.jpg",
  },
  {
    nickname: "Jordan",
    firstName: "Jordan",
    lastName: "Pellegrini",
    gender: "nonbinary",
    seeking: "both",
    ageBand: "30_39",
    photoUrl: "https://randomuser.me/api/portraits/women/85.jpg",
  },
  {
    nickname: "Andrea",
    firstName: "Andrea",
    lastName: "Galli",
    gender: "male",
    seeking: "female",
    ageBand: "50_plus",
    photoUrl: "https://randomuser.me/api/portraits/men/29.jpg",
  },
] as const;

export function isSimBotNickname(nickname: string): boolean {
  return (
    nickname.startsWith(SIM_BOT_MALE_PREFIX) ||
    nickname.startsWith(SIM_BOT_FEMALE_PREFIX)
  );
}

export function isSimBotBadge(badgeCode: string | null | undefined): boolean {
  return SIM_BOT_BADGE_RE.test(String(badgeCode ?? "").trim());
}

export function isSimBotParticipant(row: {
  nickname?: unknown;
  badge_code?: unknown;
}): boolean {
  return (
    isSimBotNickname(String(row.nickname ?? "")) ||
    isSimBotBadge(
      row.badge_code === null || row.badge_code === undefined
        ? null
        : String(row.badge_code),
    )
  );
}

export interface SimulatePlayersOptions {
  coupleCount?: number;
  /** Rimuove i bot di test esistenti prima di crearne di nuovi. */
  replace?: boolean;
  /** Calcola affinità e imposta runtime_state = matching. */
  goToMatching?: boolean;
}

export interface SimulatePlayersResult {
  malesCreated: number;
  femalesCreated: number;
  nonbinaryCreated: number;
  malesReused: number;
  femalesReused: number;
  nonbinaryReused: number;
  answersInserted: number;
  questionCount: number;
  pairCount?: number;
  runtimeState?: "matching";
}

function padIndex(index: number): string {
  return String(index).padStart(2, "0");
}

function botBadge(index: number): string {
  return `TS${padIndex(index)}`;
}

async function listSimBotIds(
  supabase: SupabaseClient,
  eventId: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .from("love_roulette_participants")
    .select("id, nickname, badge_code")
    .eq("event_id", eventId);

  if (error) throw new Error(error.message);

  return (data ?? [])
    .filter((row) => isSimBotParticipant(row))
    .map((row) => String(row.id));
}

async function listEligibleSimBotVoters(
  supabase: SupabaseClient,
  eventId: string,
): Promise<Array<{ id: string }>> {
  const { data, error } = await supabase
    .from("love_roulette_participants")
    .select("id, nickname, badge_code, role")
    .eq("event_id", eventId);

  if (error) throw new Error(error.message);

  return (data ?? [])
    .filter((row) => isSimBotParticipant(row) && row.role !== "finalist")
    .map((row) => ({ id: String(row.id) }));
}

/** Distribuisce i voti favorendo la coppia con rank migliore per evitare parità. */
function pickBotVotePairId(
  botIndex: number,
  finalists: VotingSessionState["finalists"],
): string {
  if (finalists.length === 0) {
    throw new Error("Nessun finalista in votazione.");
  }

  const slot = botIndex % 10;
  if (slot < 7) return finalists[0].pairId;
  if (slot < 9 && finalists[1]) return finalists[1].pairId;
  return (finalists[2] ?? finalists[0]).pairId;
}

export async function submitSimBotVotesForSession(
  supabase: SupabaseClient,
  eventId: string,
  session: VotingSessionState,
): Promise<{ session: VotingSessionState; votesSubmitted: number }> {
  if (session.status !== "open") {
    return { session, votesSubmitted: 0 };
  }

  const voters = await listEligibleSimBotVoters(supabase, eventId);
  if (voters.length === 0) {
    return { session, votesSubmitted: 0 };
  }

  const counts = { ...session.counts };
  const ballots = { ...session.ballots };
  let votesSubmitted = 0;

  for (let index = 0; index < voters.length; index += 1) {
    const voterId = voters[index].id;
    const pairId = pickBotVotePairId(index, session.finalists);
    if (ballots[voterId] === pairId) continue;

    const previousPairId = ballots[voterId];
    if (previousPairId && counts[previousPairId] !== undefined) {
      counts[previousPairId] = Math.max(0, (counts[previousPairId] ?? 0) - 1);
    }

    counts[pairId] = (counts[pairId] ?? 0) + 1;
    ballots[voterId] = pairId;
    votesSubmitted += 1;
  }

  if (votesSubmitted === 0) {
    return { session, votesSubmitted: 0 };
  }

  const updated: VotingSessionState = {
    ...session,
    counts,
    ballots,
    updatedAt: new Date().toISOString(),
  };

  const metadata = await readEventMetadata(supabase, eventId);
  const votingMeta = getVotingMetadata(metadata);
  await writeVotingMetadataBundle(supabase, eventId, {
    ...votingMeta,
    current: updated,
  });

  return { session: updated, votesSubmitted };
}

async function deleteSimBots(
  supabase: SupabaseClient,
  eventId: string,
): Promise<void> {
  const botIds = await listSimBotIds(supabase, eventId);
  if (botIds.length === 0) return;

  const { error: answersError } = await supabase
    .from("love_roulette_answers")
    .delete()
    .in("participant_id", botIds);

  if (answersError) throw new Error(answersError.message);

  // Tutte le coppie dell’evento: l’OR per-bot esplode (URL) e faceva fallire il replace.
  const { error: pairsError } = await supabase
    .from("love_roulette_pairs")
    .delete()
    .eq("event_id", eventId);

  if (pairsError) throw new Error(pairsError.message);

  const { error: deleteError } = await supabase
    .from("love_roulette_participants")
    .delete()
    .in("id", botIds);

  if (deleteError) throw new Error(deleteError.message);
}

async function resolveEventQuestions(
  supabase: SupabaseClient,
  eventId: string,
  eventSlug: string,
  metadata: Record<string, unknown>,
): Promise<LoveRouletteQuestion[]> {
  await ensureDefaultGeneratoreImport(supabase, eventId, eventSlug, metadata);

  const { source, questions } = await getQuestionsForEvent(supabase, eventId);

  if (questions.length === 0) {
    throw new Error(
      "Nessuna domanda disponibile. Importa le manche o esegui il seed del pool.",
    );
  }

  let resolved =
    source === "pool"
      ? await materializePoolQuestionsForEvent(supabase, eventId, questions)
      : questions;

  const quizState = getQuizSessionState(metadata);
  if (quizState?.questionIds?.length) {
    const byId = new Map(resolved.map((question) => [question.id, question]));
    const fromQuiz = quizState.questionIds
      .map((id) => byId.get(id))
      .filter((question): question is LoveRouletteQuestion => question != null);

    if (fromQuiz.length > 0) {
      resolved = fromQuiz;
    }
  }

  return resolved;
}

function pickOptionIndex(
  participantSeed: number,
  questionIndex: number,
  optionCount: number,
): number {
  if (optionCount <= 0) return 0;
  return (participantSeed + questionIndex * 7) % optionCount;
}

async function markBotOnlineAndProfile(
  supabase: SupabaseClient,
  participantId: string,
  profile: SimBotProfile,
): Promise<void> {
  const { error } = await supabase
    .from("love_roulette_participants")
    .update({
      is_online: true,
      last_seen_at: new Date().toISOString(),
      gender: profile.gender,
      seeking: profile.seeking,
      age_band: profile.ageBand,
      real_name: `${profile.firstName} ${profile.lastName}`,
      first_name: profile.firstName,
      last_name: profile.lastName,
      photo_url: profile.photoUrl,
      nick: profile.nickname,
      public_name_mode: "first",
    })
    .eq("id", participantId);

  if (error) {
    // Colonne profilo opzionali: riprova solo online/genere/cerco.
    const { error: fallbackError } = await supabase
      .from("love_roulette_participants")
      .update({
        is_online: true,
        last_seen_at: new Date().toISOString(),
        gender: profile.gender,
        seeking: profile.seeking,
      })
      .eq("id", participantId);
    if (fallbackError) throw new Error(fallbackError.message);
  }
}

async function ensureBotParticipant(
  supabase: SupabaseClient,
  eventId: string,
  profile: SimBotProfile,
  index: number,
): Promise<{ id: string; created: boolean; gender: LoveRouletteGender }> {
  const badgeCode = botBadge(index);

  const { data: byBadge, error: badgeError } = await supabase
    .from("love_roulette_participants")
    .select("id")
    .eq("event_id", eventId)
    .eq("badge_code", badgeCode)
    .maybeSingle();

  if (badgeError) throw new Error(badgeError.message);

  if (byBadge?.id) {
    await markBotOnlineAndProfile(supabase, String(byBadge.id), profile);
    return { id: String(byBadge.id), created: false, gender: profile.gender };
  }

  const { data: byNick, error: nickError } = await supabase
    .from("love_roulette_participants")
    .select("id, badge_code")
    .eq("event_id", eventId)
    .eq("nickname", profile.nickname)
    .maybeSingle();

  if (nickError) throw new Error(nickError.message);

  if (byNick?.id && isSimBotBadge(byNick.badge_code as string | null)) {
    await markBotOnlineAndProfile(supabase, String(byNick.id), profile);
    return { id: String(byNick.id), created: false, gender: profile.gender };
  }

  const nickname =
    byNick?.id && !isSimBotBadge(byNick.badge_code as string | null)
      ? `${profile.nickname}${padIndex(index)}`
      : profile.nickname;

  const participant = await createParticipantAdmin(supabase, {
    eventId,
    nickname,
    gender: profile.gender,
    seeking: profile.seeking,
    ageBand: profile.ageBand,
    badgeCode,
    realName: `${profile.firstName} ${profile.lastName}`,
  });

  await markBotOnlineAndProfile(supabase, participant.id, profile);

  return { id: participant.id, created: true, gender: profile.gender };
}

async function insertAnswersForParticipants(
  supabase: SupabaseClient,
  participantIds: string[],
  questions: LoveRouletteQuestion[],
): Promise<number> {
  if (participantIds.length === 0 || questions.length === 0) return 0;

  const { error: clearError } = await supabase
    .from("love_roulette_answers")
    .delete()
    .in("participant_id", participantIds);

  if (clearError) throw new Error(clearError.message);

  const rows: Array<{
    participant_id: string;
    question_id: string;
    option_id: string;
  }> = [];

  participantIds.forEach((participantId, participantIndex) => {
    questions.forEach((question, questionIndex) => {
      if (question.options.length === 0) return;
      const optionIndex = pickOptionIndex(
        participantIndex + 1,
        questionIndex,
        question.options.length,
      );
      rows.push({
        participant_id: participantId,
        question_id: question.id,
        option_id: question.options[optionIndex].id,
      });
    });
  });

  if (rows.length === 0) return 0;

  const { error: insertError } = await supabase
    .from("love_roulette_answers")
    .insert(rows);

  if (insertError) throw new Error(insertError.message);
  return rows.length;
}

export async function simulatePlayersForEvent(
  supabase: SupabaseClient,
  eventId: string,
  eventSlug: string,
  metadata: Record<string, unknown>,
  options?: SimulatePlayersOptions,
): Promise<SimulatePlayersResult> {
  const coupleCount = Math.min(Math.max(options?.coupleCount ?? 10, 1), 20);
  const replace = options?.replace ?? true;
  const playerCount = Math.min(coupleCount * 2, SIM_BOT_ROSTER.length);

  if (replace) {
    await deleteSimBots(supabase, eventId);
  }

  const questions = await resolveEventQuestions(
    supabase,
    eventId,
    eventSlug,
    metadata,
  );

  let malesCreated = 0;
  let femalesCreated = 0;
  let nonbinaryCreated = 0;
  let malesReused = 0;
  let femalesReused = 0;
  let nonbinaryReused = 0;
  const participantIds: string[] = [];

  for (let index = 1; index <= playerCount; index += 1) {
    const profile = SIM_BOT_ROSTER[index - 1];
    const bot = await ensureBotParticipant(supabase, eventId, profile, index);
    participantIds.push(bot.id);

    if (bot.gender === "male") {
      if (bot.created) malesCreated += 1;
      else malesReused += 1;
    } else if (bot.gender === "female") {
      if (bot.created) femalesCreated += 1;
      else femalesReused += 1;
    } else if (bot.created) {
      nonbinaryCreated += 1;
    } else {
      nonbinaryReused += 1;
    }
  }

  const answersInserted = await insertAnswersForParticipants(
    supabase,
    participantIds,
    questions,
  );

  const result: SimulatePlayersResult = {
    malesCreated,
    femalesCreated,
    nonbinaryCreated,
    malesReused,
    femalesReused,
    nonbinaryReused,
    answersInserted,
    questionCount: questions.length,
  };

  if (options?.goToMatching) {
    const matching = await transitionToMatching(supabase, eventId, {
      questionIds: questions.map((question) => question.id),
      force: true,
    });
    result.pairCount = matching.pairCount;
    result.runtimeState = "matching";
  }

  return result;
}
