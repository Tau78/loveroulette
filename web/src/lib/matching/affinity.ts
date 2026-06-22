export interface AnswerMap {
  [questionId: string]: string; // option_id
}

export interface QuestionMeta {
  id: string;
  weight: number;
  category?: string;
}

/**
 * Simple affinity: percentage of matching answers.
 */
export function calculateSimpleAffinity(
  answersA: AnswerMap,
  answersB: AnswerMap,
  questions: QuestionMeta[],
): number {
  let matches = 0;
  let total = 0;

  for (const q of questions) {
    const a = answersA[q.id];
    const b = answersB[q.id];
    if (a && b) {
      total++;
      if (a === b) matches++;
    }
  }

  if (total === 0) return 0;
  return Math.round((matches / total) * 1000) / 10;
}

export interface PairCandidate {
  maleId: string;
  femaleId: string;
  score: number;
}

export function rankPairs(candidates: PairCandidate[]): PairCandidate[] {
  return [...candidates].sort((a, b) => b.score - a.score);
}

export type ExtractionMode = "random" | "ranked" | "hybrid";

export interface PairForExtraction {
  id: string;
  rank: number;
  was_shown: boolean;
  is_eliminated: boolean;
  participant_male_id: string;
  participant_female_id: string;
}

export type ParticipantGender = "male" | "female";

/** Coppia valida solo se 1 uomo (U) + 1 donna (D), id distinti. */
export function isValidMaleFemalePair(
  maleId: string,
  femaleId: string,
  genderById: Map<string, ParticipantGender>,
): boolean {
  if (!maleId || !femaleId || maleId === femaleId) return false;
  return (
    genderById.get(maleId) === "male" &&
    genderById.get(femaleId) === "female"
  );
}

export function filterValidMaleFemalePairs<
  T extends Pick<
    PairForExtraction,
    "participant_male_id" | "participant_female_id"
  >,
>(pairs: T[], genderById: Map<string, ParticipantGender>): T[] {
  return pairs.filter((pair) =>
    isValidMaleFemalePair(
      pair.participant_male_id,
      pair.participant_female_id,
      genderById,
    ),
  );
}

/** Massimo coppie estratte in esclusiva: min(U, D), opzionale cap da config. */
export function maxAllowedExtractions(
  maleCount: number,
  femaleCount: number,
  extractionCountLimit: number | null | undefined,
): number {
  const exclusiveCap = Math.min(maleCount, femaleCount);
  if (
    typeof extractionCountLimit === "number" &&
    extractionCountLimit > 0
  ) {
    return Math.min(exclusiveCap, extractionCountLimit);
  }
  return exclusiveCap;
}

/** Giocatori già in una coppia estratta — non riaccoppiabili fino a nuova partita. */
export function collectLockedParticipantIds(
  pairs: Pick<
    PairForExtraction,
    "was_shown" | "participant_male_id" | "participant_female_id"
  >[],
): Set<string> {
  const locked = new Set<string>();
  for (const pair of pairs) {
    if (!pair.was_shown) continue;
    locked.add(pair.participant_male_id);
    locked.add(pair.participant_female_id);
  }
  return locked;
}

export function filterPairsAvailableForExtraction(
  pairs: PairForExtraction[],
): PairForExtraction[] {
  const locked = collectLockedParticipantIds(pairs);
  return pairs.filter(
    (pair) =>
      !pair.is_eliminated &&
      !pair.was_shown &&
      !locked.has(pair.participant_male_id) &&
      !locked.has(pair.participant_female_id),
  );
}

export function selectNextPair(
  pairs: PairForExtraction[],
  mode: ExtractionMode,
  hybridRandomCount: number,
  randomShownCount: number,
): PairForExtraction | null {
  const available = filterPairsAvailableForExtraction(pairs);
  if (available.length === 0) return null;

  if (mode === "ranked") {
    return available.sort((a, b) => b.rank - a.rank)[0] ?? null;
  }

  if (mode === "hybrid" && randomShownCount < hybridRandomCount) {
    const idx = Math.floor(Math.random() * available.length);
    return available[idx] ?? null;
  }

  // random (default) or hybrid after random phase
  if (mode === "hybrid") {
    return available.sort((a, b) => a.rank - b.rank)[0] ?? null;
  }

  const idx = Math.floor(Math.random() * available.length);
  return available[idx] ?? null;
}

export function getBottomNonFinalistPairs(
  pairs: PairForExtraction[],
  finalistCount = 3,
): PairForExtraction[] {
  const active = pairs.filter((p) => !p.is_eliminated);
  if (active.length <= finalistCount) return [];

  // Higher rank number = lower standing (rank 1 is best after matching).
  const sorted = [...active].sort((a, b) => b.rank - a.rank);
  const toEliminate = sorted.slice(0, active.length - finalistCount);
  return toEliminate;
}
