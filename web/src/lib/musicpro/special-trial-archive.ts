import type { SpecialTrialState } from "./special-trial";
import type { SpecialTrialChallengeId } from "@/lib/game/special-trial-challenges";

export const SPECIAL_TRIAL_ARCHIVE_KEY = "love_roulette_special_trial_archive";

export interface SpecialTrialArchiveEntry {
  challengeId: SpecialTrialChallengeId;
  closedAt: string;
  participantIds: string[];
  /** Voti sala per participant id al momento della chiusura. */
  votes: Record<string, number>;
}

export function getSpecialTrialArchive(
  metadata: Record<string, unknown> | null | undefined,
): SpecialTrialArchiveEntry[] {
  const raw = metadata?.[SPECIAL_TRIAL_ARCHIVE_KEY];
  if (!Array.isArray(raw)) return [];
  const out: SpecialTrialArchiveEntry[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const record = item as Record<string, unknown>;
    const challengeId = record.challengeId;
    const closedAt = record.closedAt;
    if (typeof challengeId !== "string" || typeof closedAt !== "string") {
      continue;
    }
    const participantIds = Array.isArray(record.participantIds)
      ? record.participantIds.filter((id): id is string => typeof id === "string")
      : [];
    const votes: Record<string, number> = {};
    if (
      record.votes &&
      typeof record.votes === "object" &&
      !Array.isArray(record.votes)
    ) {
      for (const [key, value] of Object.entries(
        record.votes as Record<string, unknown>,
      )) {
        if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
          votes[key] = Math.floor(value);
        }
      }
    }
    out.push({
      challengeId: challengeId as SpecialTrialChallengeId,
      closedAt,
      participantIds,
      votes,
    });
  }
  return out;
}

export function archiveEntryFromTrial(
  trial: SpecialTrialState,
  closedAt: string,
): SpecialTrialArchiveEntry | null {
  if (trial.status !== "results" && trial.status !== "closing") return null;
  if (!trial.challengeId || trial.participants.length === 0) return null;
  return {
    challengeId: trial.challengeId,
    closedAt,
    participantIds: trial.participants.map((p) => p.id),
    votes: { ...trial.votes },
  };
}

export function appendSpecialTrialArchive(
  metadata: Record<string, unknown>,
  entry: SpecialTrialArchiveEntry,
): Record<string, unknown> {
  const prev = getSpecialTrialArchive(metadata);
  return {
    ...metadata,
    [SPECIAL_TRIAL_ARCHIVE_KEY]: [...prev, entry],
  };
}

/** Prove in cui entrambi i giocatori erano in palco; punteggio = somma voti dei due. */
export function pairTrialStatsFromArchive(
  archive: SpecialTrialArchiveEntry[],
  participantAId: string,
  participantBId: string,
): { trialsCount: number; trialsScore: number } {
  let trialsCount = 0;
  let trialsScore = 0;
  for (const entry of archive) {
    const ids = new Set(entry.participantIds);
    if (!ids.has(participantAId) || !ids.has(participantBId)) continue;
    trialsCount++;
    trialsScore +=
      (entry.votes[participantAId] ?? 0) + (entry.votes[participantBId] ?? 0);
  }
  return { trialsCount, trialsScore };
}
