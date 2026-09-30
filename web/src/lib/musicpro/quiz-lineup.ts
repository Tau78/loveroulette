/**
 * Scaletta domande variata: con N domande tocca tutti gli argomenti
 * (round-robin sulle categorie), non il prefisso del banco.
 */

export type QuizLineupQuestion = {
  id: string;
  category: string;
};

function normalizeCategory(category: string | null | undefined): string {
  const trimmed = (category ?? "").trim().toLowerCase();
  return trimmed || "other";
}

function shuffleInPlace<T>(items: T[], random: () => number): void {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const tmp = items[i]!;
    items[i] = items[j]!;
    items[j] = tmp;
  }
}

/**
 * Sceglie fino a `count` id dal banco, bilanciando le categorie:
 * - shuffle dentro ogni argomento
 * - round-robin tra argomenti (ordine categorie mescolato)
 * - se un argomento si esaurisce, continua con gli altri
 *
 * Con N ≥ n. categorie → ogni argomento compare almeno una volta
 * (finché ci sono domande). Con N < n. categorie → N argomenti diversi.
 */
export function buildBalancedQuizLineup(
  bank: QuizLineupQuestion[],
  count: number,
  random: () => number = Math.random,
): string[] {
  const n = Math.max(0, Math.min(Math.floor(count), bank.length));
  if (n === 0) return [];

  const byCat = new Map<string, string[]>();
  const catOrder: string[] = [];

  for (const q of bank) {
    const cat = normalizeCategory(q.category);
    let list = byCat.get(cat);
    if (!list) {
      list = [];
      byCat.set(cat, list);
      catOrder.push(cat);
    }
    list.push(q.id);
  }

  for (const list of byCat.values()) {
    shuffleInPlace(list, random);
  }
  shuffleInPlace(catOrder, random);

  const queues = catOrder.map((cat) => byCat.get(cat) ?? []);
  const result: string[] = [];

  while (result.length < n) {
    let progressed = false;
    for (const queue of queues) {
      if (result.length >= n) break;
      const id = queue.shift();
      if (id) {
        result.push(id);
        progressed = true;
      }
    }
    if (!progressed) break;
  }

  return result;
}

/** Conteggio per categoria normalizzata (test / debug). */
export function lineupCategoryCounts(
  bank: QuizLineupQuestion[],
  lineupIds: string[],
): Map<string, number> {
  const byId = new Map(bank.map((q) => [q.id, normalizeCategory(q.category)]));
  const counts = new Map<string, number>();
  for (const id of lineupIds) {
    const cat = byId.get(id) ?? "other";
    counts.set(cat, (counts.get(cat) ?? 0) + 1);
  }
  return counts;
}
