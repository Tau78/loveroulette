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
}

export function selectNextPair(
  pairs: PairForExtraction[],
  mode: ExtractionMode,
  hybridRandomCount: number,
  randomShownCount: number,
): PairForExtraction | null {
  const available = pairs.filter((p) => !p.was_shown && !p.is_eliminated);
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
