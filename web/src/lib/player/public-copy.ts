export const PLAYER_RESULTS_ANSWERED =
  "Guarda gli schermi per le statistiche";

export const PLAYER_RESULTS_MISSED =
  "Tempo scaduto — guarda gli schermi per i risultati";

export const PLAYER_YOUR_ANSWER_KICKER = "TU HAI RISPOSTO";

export const PLAYER_NEXT_QUESTION = "Prossima domanda in arrivo…";

export const PLAYER_MANCHE_KICKER = "Nuova manche";

export function playerAnswerTimeLabel(seconds: number): string {
  const n = Math.max(1, Math.round(seconds));
  return n === 1 ? "IN 1 SECONDO" : `IN ${n} SECONDI`;
}
