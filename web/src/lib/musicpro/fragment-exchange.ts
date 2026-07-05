import type { SupabaseClient } from "@supabase/supabase-js";
import { parseLoveRouletteConfig } from "./event-config";

const METADATA_KEY = "love_roulette_fragments";

export interface FragmentExchangeState {
  fragmentIds: string[];
  finalCode: string;
  collected: Record<string, string[]>;
  updatedAt: string;
}

export interface ParticipantFragmentView {
  enabled: boolean;
  owned: string[];
  slots: Array<{ id: string; owned: boolean }>;
  total: number;
  isComplete: boolean;
  canDonate: boolean;
  donateableFragmentIds: string[];
  finalCode: string | null;
}

export interface FragmentDonationTarget {
  id: string;
  nickname: string;
  ownedCount: number;
  missingCount: number;
  missingFragmentIds: string[];
}

function nowIso(): string {
  return new Date().toISOString();
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort();
}

function normalizeCollected(raw: unknown): Record<string, string[]> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const collected: Record<string, string[]> = {};
  for (const [participantId, fragments] of Object.entries(
    raw as Record<string, unknown>,
  )) {
    if (!Array.isArray(fragments)) continue;
    collected[participantId] = fragments.map(String);
  }
  return collected;
}

export function getFragmentExchangeState(
  metadata: Record<string, unknown> | null | undefined,
): FragmentExchangeState | null {
  const raw = metadata?.[METADATA_KEY];
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;

  const record = raw as Record<string, unknown>;
  const fragmentIds = Array.isArray(record.fragmentIds)
    ? record.fragmentIds.map(String)
    : [];
  const finalCode =
    typeof record.finalCode === "string" ? record.finalCode.trim() : "";

  if (fragmentIds.length === 0 || !finalCode) return null;

  return {
    fragmentIds: uniqueSorted(fragmentIds),
    finalCode,
    collected: normalizeCollected(record.collected),
    updatedAt:
      typeof record.updatedAt === "string" ? record.updatedAt : nowIso(),
  };
}

export function resolveFragmentFinalCode(
  metadata: Record<string, unknown>,
): string | null {
  const state = getFragmentExchangeState(metadata);
  if (state?.finalCode) return state.finalCode;

  const config = parseLoveRouletteConfig(metadata);
  if (config.fragment_final_code?.trim()) {
    return config.fragment_final_code.trim().toUpperCase();
  }

  const legacy = metadata.love_roulette_enigma_final_code;
  if (typeof legacy === "string" && legacy.trim()) {
    return legacy.trim().toUpperCase();
  }

  return null;
}

export function isFragmentExchangeEnabled(
  metadata: Record<string, unknown>,
): boolean {
  const config = parseLoveRouletteConfig(metadata);
  if (config.fragment_exchange_enabled === false) return false;
  return resolveFragmentFinalCode(metadata) != null;
}

function hasAllFragments(
  owned: string[],
  fragmentIds: string[],
): boolean {
  const ownedSet = new Set(owned);
  return fragmentIds.every((id) => ownedSet.has(id));
}

function donateableFragments(
  owned: string[],
  fragmentIds: string[],
): string[] {
  if (!hasAllFragments(owned, fragmentIds)) return [];

  const required = new Set(fragmentIds);
  const spare = new Map<string, number>();
  for (const id of owned) {
    spare.set(id, (spare.get(id) ?? 0) + 1);
  }

  const donateable: string[] = [];
  for (const [id, count] of spare) {
    if (!required.has(id)) continue;
    const extras = count - 1;
    for (let i = 0; i < extras; i += 1) {
      donateable.push(id);
    }
  }

  return donateable;
}

export function getParticipantFragmentView(
  state: FragmentExchangeState | null,
  participantId: string,
  enabled: boolean,
): ParticipantFragmentView {
  if (!enabled || !state) {
    return {
      enabled: false,
      owned: [],
      slots: [],
      total: 0,
      isComplete: false,
      canDonate: false,
      donateableFragmentIds: [],
      finalCode: null,
    };
  }

  const owned = state.collected[participantId] ?? [];
  const ownedSet = new Set(owned);
  const slots = state.fragmentIds.map((id) => ({
    id,
    owned: ownedSet.has(id),
  }));
  const isComplete = hasAllFragments(owned, state.fragmentIds);
  const donateableFragmentIds = donateableFragments(owned, state.fragmentIds);

  return {
    enabled: true,
    owned: uniqueSorted(owned),
    slots,
    total: state.fragmentIds.length,
    isComplete,
    canDonate: donateableFragmentIds.length > 0,
    donateableFragmentIds,
    finalCode: isComplete ? state.finalCode : null,
  };
}

export function listDonationTargets(
  state: FragmentExchangeState,
  participants: Array<{ id: string; nickname: string }>,
  fromParticipantId: string,
): FragmentDonationTarget[] {
  const donateable = donateableFragments(
    state.collected[fromParticipantId] ?? [],
    state.fragmentIds,
  );
  if (donateable.length === 0) return [];

  const donateableSet = new Set(donateable);

  return participants
    .filter((participant) => participant.id !== fromParticipantId)
    .map((participant) => {
      const owned = state.collected[participant.id] ?? [];
      const ownedSet = new Set(owned);
      const missingFragmentIds = state.fragmentIds.filter(
        (id) => !ownedSet.has(id),
      );

      return {
        id: participant.id,
        nickname: participant.nickname,
        ownedCount: ownedSet.size,
        missingCount: missingFragmentIds.length,
        missingFragmentIds,
      };
    })
    .filter((participant) => {
      if (participant.missingCount === 0) return false;
      return participant.missingFragmentIds.some((id) => donateableSet.has(id));
    })
    .sort((a, b) => a.missingCount - b.missingCount || a.nickname.localeCompare(b.nickname));
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

async function writeFragmentState(
  supabase: SupabaseClient,
  eventId: string,
  metadata: Record<string, unknown>,
  state: FragmentExchangeState,
): Promise<void> {
  const { error } = await supabase
    .from("events")
    .update({
      metadata: {
        ...metadata,
        [METADATA_KEY]: state,
      },
    })
    .eq("id", eventId);

  if (error) throw new Error(error.message);
}

export async function ensureFragmentExchangeForQuiz(
  supabase: SupabaseClient,
  eventId: string,
  questionIds: string[],
): Promise<FragmentExchangeState | null> {
  const metadata = await readEventMetadata(supabase, eventId);
  if (!isFragmentExchangeEnabled(metadata)) return null;

  const finalCode = resolveFragmentFinalCode(metadata);
  if (!finalCode) return null;

  const fragmentIds = uniqueSorted(questionIds);
  if (fragmentIds.length === 0) return null;

  const existing = getFragmentExchangeState(metadata);
  const nextState: FragmentExchangeState = {
    fragmentIds,
    finalCode,
    collected: existing?.collected ?? {},
    updatedAt: nowIso(),
  };

  if (
    existing &&
    existing.fragmentIds.join("|") === fragmentIds.join("|") &&
    existing.finalCode === finalCode
  ) {
    return existing;
  }

  await writeFragmentState(supabase, eventId, metadata, nextState);
  return nextState;
}

export async function syncFragmentsFromAnswers(
  supabase: SupabaseClient,
  eventId: string,
  state: FragmentExchangeState,
): Promise<FragmentExchangeState> {
  const { data: answers, error } = await supabase
    .from("love_roulette_answers")
    .select("participant_id, question_id")
    .in("question_id", state.fragmentIds);

  if (error) throw new Error(error.message);

  const collected: Record<string, string[]> = { ...state.collected };
  let changed = false;
  for (const row of answers ?? []) {
    const participantId = String(row.participant_id);
    const questionId = String(row.question_id);
    if (!state.fragmentIds.includes(questionId)) continue;
    const current = collected[participantId] ?? [];
    if (!current.includes(questionId)) {
      collected[participantId] = [...current, questionId];
      changed = true;
    }
  }

  if (!changed) return state;

  return {
    ...state,
    collected,
    updatedAt: nowIso(),
  };
}

export async function grantFragmentForAnswer(
  supabase: SupabaseClient,
  eventId: string,
  participantId: string,
  questionId: string,
  questionIds: string[],
): Promise<FragmentExchangeState | null> {
  const metadata = await readEventMetadata(supabase, eventId);
  if (!isFragmentExchangeEnabled(metadata)) return null;

  let state = await ensureFragmentExchangeForQuiz(
    supabase,
    eventId,
    questionIds.length > 0 ? questionIds : [questionId],
  );
  if (!state) return null;

  if (!state.fragmentIds.includes(questionId)) return state;

  const owned = state.collected[participantId] ?? [];
  if (owned.includes(questionId)) return state;

  const nextState: FragmentExchangeState = {
    ...state,
    collected: {
      ...state.collected,
      [participantId]: [...owned, questionId],
    },
    updatedAt: nowIso(),
  };

  await writeFragmentState(supabase, eventId, metadata, nextState);
  return nextState;
}

export class FragmentDonationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FragmentDonationError";
  }
}

export async function donateFragment(
  supabase: SupabaseClient,
  eventId: string,
  fromParticipantId: string,
  toParticipantId: string,
  fragmentId: string,
): Promise<FragmentExchangeState> {
  if (fromParticipantId === toParticipantId) {
    throw new FragmentDonationError("Non puoi donare un frammento a te stesso.");
  }

  const metadata = await readEventMetadata(supabase, eventId);
  const state = getFragmentExchangeState(metadata);
  if (!state) {
    throw new FragmentDonationError("Scambio frammenti non attivo per questo evento.");
  }

  if (!state.fragmentIds.includes(fragmentId)) {
    throw new FragmentDonationError("Frammento non valido.");
  }

  const fromOwned = state.collected[fromParticipantId] ?? [];
  const donateable = donateableFragments(fromOwned, state.fragmentIds);
  if (!donateable.includes(fragmentId)) {
    throw new FragmentDonationError(
      "Hai bisogno di tutti i frammenti e di un duplicato per donare.",
    );
  }

  const toOwned = state.collected[toParticipantId] ?? [];
  if (hasAllFragments(toOwned, state.fragmentIds)) {
    throw new FragmentDonationError("Questo giocatore ha già tutti i frammenti.");
  }
  if (toOwned.includes(fragmentId)) {
    throw new FragmentDonationError("Il destinatario ha già questo frammento.");
  }

  const nextFromOwned = [...fromOwned];
  const removeIndex = nextFromOwned.indexOf(fragmentId);
  if (removeIndex < 0) {
    throw new FragmentDonationError("Frammento non disponibile.");
  }
  nextFromOwned.splice(removeIndex, 1);

  const nextState: FragmentExchangeState = {
    ...state,
    collected: {
      ...state.collected,
      [fromParticipantId]: nextFromOwned,
      [toParticipantId]: [...toOwned, fragmentId],
    },
    updatedAt: nowIso(),
  };

  await writeFragmentState(supabase, eventId, metadata, nextState);
  return nextState;
}

export async function getFragmentExchangePayload(
  supabase: SupabaseClient,
  eventId: string,
  participantId: string,
  questionIds: string[] = [],
): Promise<{
  view: ParticipantFragmentView;
  targets: FragmentDonationTarget[];
}> {
  const metadata = await readEventMetadata(supabase, eventId);
  const enabled = isFragmentExchangeEnabled(metadata);

  if (!enabled) {
    return {
      view: getParticipantFragmentView(null, participantId, false),
      targets: [],
    };
  }

  let state = getFragmentExchangeState(metadata);
  if (!state && questionIds.length > 0) {
    state = await ensureFragmentExchangeForQuiz(supabase, eventId, questionIds);
  }

  if (!state) {
    return {
      view: getParticipantFragmentView(null, participantId, true),
      targets: [],
    };
  }

  const synced = await syncFragmentsFromAnswers(supabase, eventId, state);
  const collectedChanged =
    JSON.stringify(synced.collected) !== JSON.stringify(state.collected);
  if (collectedChanged) {
    await writeFragmentState(supabase, eventId, metadata, synced);
    state = synced;
  }

  const view = getParticipantFragmentView(state, participantId, true);

  const { data: participants, error } = await supabase
    .from("love_roulette_participants")
    .select("id, nickname")
    .eq("event_id", eventId)
    .eq("is_online", true);

  if (error) throw new Error(error.message);

  const targets = listDonationTargets(
    state,
    (participants ?? []).map((row) => ({
      id: String(row.id),
      nickname: String(row.nickname),
    })),
    participantId,
  );

  return { view, targets };
}
