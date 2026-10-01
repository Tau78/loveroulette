import type { SupabaseClient } from "@supabase/supabase-js";
import { logAvantiBinary } from "@/lib/admin/avanti-binary-log";
import type { EventState } from "@/lib/types";
import type { SpecialTrialChallengeId } from "@/lib/game/special-trial-challenges";
import {
  appendSpecialTrialArchive,
  archiveEntryFromTrial,
} from "./special-trial-archive";
import {
  advanceQuizIndexAfterHold,
  getQuizSessionState,
  type QuizSessionState,
} from "./quiz-state";

export type SpecialTrialStatus =
  | "booked"
  | "setup"
  | "running"
  | "closing"
  | "results";

export type SpecialTrialMode = "scegli" | "chiedi";

export interface SpecialTrialParticipant {
  id: string;
  nickname: string;
}

export interface SpecialTrialState {
  status: SpecialTrialStatus;
  updatedAt: string;
  durationSec: number;
  challengeId: SpecialTrialChallengeId | null;
  mode: SpecialTrialMode | null;
  participants: SpecialTrialParticipant[];
  phaseStartedAt: string | null;
  /** Conteggio voti per participant id (sala). */
  votes: Record<string, number>;
  /** Votante → scelto. */
  ballots: Record<string, string>;
}

export const DEFAULT_SPECIAL_TRIAL_DURATION_SEC = 60;

const METADATA_KEY = "love_roulette_special_trial";

const VALID_STATUSES = new Set<SpecialTrialStatus>([
  "booked",
  "setup",
  "running",
  "closing",
  "results",
]);

const VALID_CHALLENGES = new Set<SpecialTrialChallengeId>([
  "dance",
  "declaration",
  "approach",
  "gaze",
]);

function nowIso(): string {
  return new Date().toISOString();
}

function emptyVotes(): { votes: Record<string, number>; ballots: Record<string, string> } {
  return { votes: {}, ballots: {} };
}

function parseVoteMap(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Record<string, number> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
      out[key] = Math.floor(value);
    }
  }
  return out;
}

function parseBallotMap(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value === "string" && value.trim()) out[key] = value;
  }
  return out;
}

export class SpecialTrialError extends Error {
  constructor(
    message: string,
    readonly status: number = 400,
  ) {
    super(message);
    this.name = "SpecialTrialError";
  }
}

/** Countdown leggibile (dinamico sui minuti scelti): `5:00`, `1:05`, `0:09`. */
export function formatSpecialTrialClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export function specialTrialVoteRanking(
  trial: SpecialTrialState,
): Array<SpecialTrialParticipant & { votes: number }> {
  return [...trial.participants]
    .map((p) => ({
      ...p,
      votes: trial.votes[p.id] ?? 0,
    }))
    .sort((a, b) => b.votes - a.votes || a.nickname.localeCompare(b.nickname));
}

export function getSpecialTrialState(
  metadata: Record<string, unknown> | null | undefined,
): SpecialTrialState | null {
  const raw = metadata?.[METADATA_KEY];
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const record = raw as Record<string, unknown>;
  const status = record.status;
  if (typeof status !== "string" || !VALID_STATUSES.has(status as SpecialTrialStatus)) {
    return null;
  }

  const challengeId = record.challengeId;
  const participants = Array.isArray(record.participants)
    ? record.participants
        .filter(
          (p): p is SpecialTrialParticipant =>
            !!p &&
            typeof p === "object" &&
            typeof (p as SpecialTrialParticipant).id === "string" &&
            typeof (p as SpecialTrialParticipant).nickname === "string",
        )
        .map((p) => ({
          id: p.id,
          nickname: p.nickname,
        }))
    : [];

  return {
    status: status as SpecialTrialStatus,
    updatedAt:
      typeof record.updatedAt === "string" ? record.updatedAt : nowIso(),
    durationSec:
      typeof record.durationSec === "number" && record.durationSec >= 10
        ? Math.min(record.durationSec, 600)
        : DEFAULT_SPECIAL_TRIAL_DURATION_SEC,
    challengeId:
      typeof challengeId === "string" &&
      VALID_CHALLENGES.has(challengeId as SpecialTrialChallengeId)
        ? (challengeId as SpecialTrialChallengeId)
        : null,
    mode:
      record.mode === "scegli" || record.mode === "chiedi" ? record.mode : null,
    participants,
    phaseStartedAt:
      typeof record.phaseStartedAt === "string" ? record.phaseStartedAt : null,
    votes: parseVoteMap(record.votes),
    ballots: parseBallotMap(record.ballots),
  };
}

export function mergeSpecialTrialState(
  prev: SpecialTrialState | null,
  incoming: SpecialTrialState | null,
): SpecialTrialState | null {
  // null = chiusura esplicita (AVANTI da risultati / poll dopo clear).
  // Non conservare prev: altrimenti plancia resta su PROVA SPECIALE e AVANTI 404.
  if (!incoming) return null;
  if (!prev) return incoming;

  const prevAt = Date.parse(prev.updatedAt);
  const incomingAt = Date.parse(incoming.updatedAt);

  if (!Number.isNaN(prevAt) && !Number.isNaN(incomingAt)) {
    if (incomingAt >= prevAt) return incoming;
    return prev;
  }

  return incoming;
}

export function isSpecialTrialBlockingQuiz(
  trial: SpecialTrialState | null,
): boolean {
  if (!trial) return false;
  return (
    trial.status === "setup" ||
    trial.status === "running" ||
    trial.status === "closing" ||
    trial.status === "results"
  );
}

export function specialTrialRemainingSeconds(
  trial: SpecialTrialState,
  now = Date.now(),
): number {
  if (trial.status !== "running" || !trial.phaseStartedAt) return 0;
  const started = Date.parse(trial.phaseStartedAt);
  if (Number.isNaN(started)) return 0;
  const left = trial.durationSec * 1000 - Math.max(0, now - started);
  return Math.max(0, Math.ceil(left / 1000));
}

export function isSpecialTrialRunningExpired(
  trial: SpecialTrialState,
  now = Date.now(),
): boolean {
  return (
    trial.status === "running" &&
    specialTrialRemainingSeconds(trial, now) <= 0
  );
}

async function readEventMetadata(
  supabase: SupabaseClient,
  eventId: string,
): Promise<Record<string, unknown>> {
  const { data, error } = await supabase
    .from("events")
    .select("metadata")
    .eq("id", eventId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data?.metadata ?? {}) as Record<string, unknown>;
}

async function writeSpecialTrialState(
  supabase: SupabaseClient,
  eventId: string,
  trial: SpecialTrialState | null,
): Promise<SpecialTrialState | null> {
  const metadata = await readEventMetadata(supabase, eventId);
  const nextMetadata = { ...metadata };
  if (trial) {
    nextMetadata[METADATA_KEY] = trial;
  } else {
    delete nextMetadata[METADATA_KEY];
  }

  const { error } = await supabase
    .from("events")
    .update({ metadata: nextMetadata })
    .eq("id", eventId);

  if (error) throw new Error(error.message);
  return trial;
}

/** Esegue l’advance_index rimandato dal gate prova speciale. */
export async function advanceQuizAfterSpecialTrial(
  supabase: SupabaseClient,
  eventId: string,
): Promise<{ quiz: QuizSessionState | null; runtimeState: EventState }> {
  const metadata = await readEventMetadata(supabase, eventId);
  const trialBeforeClose = getSpecialTrialState(metadata);
  const current = getQuizSessionState(metadata);
  if (!current) {
    await writeSpecialTrialState(supabase, eventId, null);
    return { quiz: null, runtimeState: "quiz" };
  }

  const advanced = await advanceQuizIndexAfterHold(supabase, eventId);
  if (trialBeforeClose) {
    const entry = archiveEntryFromTrial(trialBeforeClose, nowIso());
    if (entry) {
      const archived = appendSpecialTrialArchive(metadata, entry);
      const { error: archiveError } = await supabase
        .from("events")
        .update({ metadata: archived })
        .eq("id", eventId);
      if (archiveError) throw new Error(archiveError.message);
    }
  }
  await writeSpecialTrialState(supabase, eventId, null);

  logAvantiBinary("advance", "special_trial closed → next theme", {
    eventId,
    index: advanced.quiz?.currentIndex,
    total: advanced.quiz?.total,
  });

  return advanced;
}

/**
 * Gate AVANTI autorizzato: se prova prenotata, attiva setup invece di advance_index.
 */
export async function tryActivateSpecialTrialAtGate(
  supabase: SupabaseClient,
  eventId: string,
): Promise<boolean> {
  const metadata = await readEventMetadata(supabase, eventId);
  const trial = getSpecialTrialState(metadata);
  if (!trial || trial.status !== "booked") return false;

  const at = nowIso();
  await writeSpecialTrialState(supabase, eventId, {
    ...trial,
    status: "setup",
    updatedAt: at,
    phaseStartedAt: at,
    ...emptyVotes(),
  });

  logAvantiBinary("advance", "gate → special_trial setup (hold quiz)", {
    eventId,
  });

  return true;
}

export type SpecialTrialAction =
  | "book"
  | "unbook"
  | "setDuration"
  | "pickChallenge"
  | "pickMode"
  | "setParticipants"
  | "start"
  | "close"
  | "advance"
  | "tick"
  | "vote";

export interface SpecialTrialActionInput {
  action: SpecialTrialAction;
  durationSec?: number;
  challengeId?: SpecialTrialChallengeId;
  mode?: SpecialTrialMode;
  participants?: SpecialTrialParticipant[];
  /** Votante (giocatore in sala). */
  voterId?: string;
  /** Partecipante in prova votato. */
  choiceId?: string;
}

export async function handleSpecialTrialAction(
  supabase: SupabaseClient,
  eventId: string,
  input: SpecialTrialActionInput,
): Promise<{
  specialTrial: SpecialTrialState | null;
  quiz: QuizSessionState | null;
  runtimeState: EventState;
}> {
  const metadata = await readEventMetadata(supabase, eventId);
  const quiz = getQuizSessionState(metadata);
  let trial = getSpecialTrialState(metadata);
  const at = nowIso();

  if (input.action === "book") {
    if (trial && trial.status !== "booked") {
      throw new SpecialTrialError("Prova già in corso.", 409);
    }
    trial = {
      status: "booked",
      updatedAt: at,
      durationSec: input.durationSec ?? DEFAULT_SPECIAL_TRIAL_DURATION_SEC,
      challengeId: null,
      mode: null,
      participants: [],
      phaseStartedAt: null,
      ...emptyVotes(),
    };
    await writeSpecialTrialState(supabase, eventId, trial);
    return { specialTrial: trial, quiz, runtimeState: "quiz" };
  }

  if (input.action === "unbook") {
    if (
      trial?.status === "running" ||
      trial?.status === "closing" ||
      trial?.status === "results"
    ) {
      throw new SpecialTrialError("Prova in corso — chiudi prima.", 409);
    }
    await writeSpecialTrialState(supabase, eventId, null);
    return { specialTrial: null, quiz, runtimeState: "quiz" };
  }

  if (!trial) {
    throw new SpecialTrialError("Nessuna prova attiva.", 404);
  }

  if (input.action === "setDuration") {
    if (
      trial.status === "running" ||
      trial.status === "closing" ||
      trial.status === "results"
    ) {
      throw new SpecialTrialError("Durata bloccata durante la prova.", 409);
    }
    trial = {
      ...trial,
      durationSec: input.durationSec ?? trial.durationSec,
      updatedAt: at,
    };
    await writeSpecialTrialState(supabase, eventId, trial);
    return { specialTrial: trial, quiz, runtimeState: "quiz" };
  }

  if (input.action === "pickChallenge") {
    if (trial.status !== "setup") {
      throw new SpecialTrialError("Seleziona la prova in setup.", 409);
    }
    if (!input.challengeId || !VALID_CHALLENGES.has(input.challengeId)) {
      throw new SpecialTrialError("Tipo prova non valido.", 400);
    }
    trial = {
      ...trial,
      challengeId: input.challengeId,
      updatedAt: at,
    };
    await writeSpecialTrialState(supabase, eventId, trial);
    return { specialTrial: trial, quiz, runtimeState: "quiz" };
  }

  if (input.action === "pickMode") {
    if (trial.status !== "setup" || !trial.challengeId) {
      throw new SpecialTrialError("Scegli prima il tipo di prova.", 409);
    }
    if (input.mode !== "scegli" && input.mode !== "chiedi") {
      throw new SpecialTrialError("Modalità non valida.", 400);
    }
    if (input.mode === "chiedi") {
      throw new SpecialTrialError("CHIEDI — in arrivo. Usa SCEGLI.", 501);
    }
    trial = {
      ...trial,
      mode: input.mode,
      updatedAt: at,
    };
    await writeSpecialTrialState(supabase, eventId, trial);
    return { specialTrial: trial, quiz, runtimeState: "quiz" };
  }

  if (input.action === "setParticipants") {
    if (trial.status !== "setup" || trial.mode !== "scegli") {
      throw new SpecialTrialError("Seleziona giocatori in modalità SCEGLI.", 409);
    }
    const participants = (input.participants ?? []).filter(
      (p) => p.id && p.nickname,
    );
    if (participants.length === 0) {
      throw new SpecialTrialError("Seleziona almeno un giocatore.", 400);
    }
    trial = {
      ...trial,
      participants,
      updatedAt: at,
    };
    await writeSpecialTrialState(supabase, eventId, trial);
    return { specialTrial: trial, quiz, runtimeState: "quiz" };
  }

  if (input.action === "start") {
    if (trial.status !== "setup" || !trial.challengeId || !trial.mode) {
      throw new SpecialTrialError("Completa setup prima di VIA.", 409);
    }
    if (trial.mode === "scegli" && trial.participants.length === 0) {
      throw new SpecialTrialError("Seleziona almeno un giocatore.", 400);
    }
    trial = {
      ...trial,
      status: "running",
      updatedAt: at,
      phaseStartedAt: at,
      ...emptyVotes(),
    };
    await writeSpecialTrialState(supabase, eventId, trial);
    return { specialTrial: trial, quiz, runtimeState: "quiz" };
  }

  if (input.action === "tick") {
    if (trial.status === "running" && isSpecialTrialRunningExpired(trial)) {
      trial = {
        ...trial,
        status: "closing",
        updatedAt: at,
      };
      await writeSpecialTrialState(supabase, eventId, trial);
      logAvantiBinary("advance", "special_trial → FINE PROVA (timer)", {
        eventId,
      });
    }
    return { specialTrial: trial, quiz, runtimeState: "quiz" };
  }

  if (input.action === "vote") {
    if (trial.status !== "running" && trial.status !== "closing") {
      throw new SpecialTrialError("Votazione chiusa.", 409);
    }
    const voterId = input.voterId?.trim();
    const choiceId = input.choiceId?.trim();
    if (!voterId || !choiceId) {
      throw new SpecialTrialError("Voto incompleto.", 400);
    }
    if (!trial.participants.some((p) => p.id === choiceId)) {
      throw new SpecialTrialError("Scelta non in prova.", 400);
    }

    const ballots = { ...trial.ballots };
    const votes = { ...trial.votes };
    const previous = ballots[voterId];
    if (previous && votes[previous] != null) {
      votes[previous] = Math.max(0, (votes[previous] ?? 0) - 1);
    }
    ballots[voterId] = choiceId;
    votes[choiceId] = (votes[choiceId] ?? 0) + 1;

    trial = {
      ...trial,
      ballots,
      votes,
      updatedAt: at,
    };
    await writeSpecialTrialState(supabase, eventId, trial);
    return { specialTrial: trial, quiz, runtimeState: "quiz" };
  }

  if (input.action === "advance") {
    if (trial.status === "running" && isSpecialTrialRunningExpired(trial)) {
      trial = {
        ...trial,
        status: "closing",
        updatedAt: at,
      };
      await writeSpecialTrialState(supabase, eventId, trial);
      return { specialTrial: trial, quiz, runtimeState: "quiz" };
    }

    if (trial.status === "closing") {
      trial = {
        ...trial,
        status: "results",
        updatedAt: at,
      };
      await writeSpecialTrialState(supabase, eventId, trial);
      logAvantiBinary("advance", "special_trial FINE PROVA → risultati", {
        eventId,
      });
      return { specialTrial: trial, quiz, runtimeState: "quiz" };
    }

    if (trial.status === "results") {
      const advanced = await advanceQuizAfterSpecialTrial(supabase, eventId);
      return {
        specialTrial: null,
        quiz: advanced.quiz,
        runtimeState: advanced.runtimeState,
      };
    }

    throw new SpecialTrialError("Niente da avanzare ora.", 409);
  }

  if (input.action === "close") {
    if (
      trial.status !== "closing" &&
      trial.status !== "running" &&
      trial.status !== "results"
    ) {
      throw new SpecialTrialError("Nessuna prova da chiudere.", 409);
    }
    const advanced = await advanceQuizAfterSpecialTrial(supabase, eventId);
    return {
      specialTrial: null,
      quiz: advanced.quiz,
      runtimeState: advanced.runtimeState,
    };
  }

  throw new SpecialTrialError("Azione non valida.", 400);
}
