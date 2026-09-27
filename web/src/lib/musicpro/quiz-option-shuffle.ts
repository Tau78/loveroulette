import type { LoveRouletteQuestionOption } from "@/lib/musicpro/types";

/**
 * Mischia le risposte a video per ogni domanda (seed stabile = stesso ordine
 * su proiettore, player e admin). I conteggi/matching usano sempre option.id —
 * la lettera A–D è solo la posizione a schermo.
 */

function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Mulberry32 — deterministico, abbastanza buono per 4 elementi. */
function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function quizOptionShuffleSeed(
  eventSlug: string,
  questionId: string,
): string {
  return `${eventSlug.trim().toUpperCase()}::${questionId}`;
}

export function seededShuffleIds(ids: string[], seed: string): string[] {
  const out = [...ids];
  if (out.length <= 1) return out;
  const rand = mulberry32(hashSeed(seed));
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = out[i]!;
    out[i] = out[j]!;
    out[j] = tmp;
  }
  return out;
}

/** Riordina le opzioni per la serata (stesso seed → stesso ordine ovunque). */
export function orderOptionsForQuizDisplay<
  T extends { id: string },
>(options: T[], eventSlug: string, questionId: string): T[] {
  if (options.length <= 1) return options;
  const order = seededShuffleIds(
    options.map((o) => o.id),
    quizOptionShuffleSeed(eventSlug, questionId),
  );
  const byId = new Map(options.map((o) => [o.id, o]));
  const ordered: T[] = [];
  for (const id of order) {
    const opt = byId.get(id);
    if (opt) ordered.push(opt);
  }
  // Opzioni nuove non nello shuffle (edge): in coda, ordine originale.
  for (const opt of options) {
    if (!order.includes(opt.id)) ordered.push(opt);
  }
  return ordered;
}

export function orderOptionLabelsForQuizDisplay(
  options: LoveRouletteQuestionOption[],
  eventSlug: string,
  questionId: string,
): string[] {
  return orderOptionsForQuizDisplay(options, eventSlug, questionId).map(
    (o) => o.label,
  );
}
