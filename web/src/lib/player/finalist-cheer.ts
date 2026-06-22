import type { VotingFinalist } from "@/lib/musicpro/voting";

/** Frasi per finalisti che non votano — rotazione casuale. */
export const FINALIST_CHEER_LINES = [
  "Vai campione! 💪",
  "Vai campionessa! ✨",
  "Mi raccomando, spacca tutto!",
  "Bomber! 🔥",
  "Sei tu la star stasera!",
  "Fai vedere chi commanda!",
  "Forza, cuore in gola!",
  "Questa è la tua serata!",
  "Tensione al massimo — tu di più!",
  "Il pubblico ti adora già!",
  "Non mollare un attimo!",
  "Sei puro spettacolo!",
] as const;

export function isParticipantInFinalists(
  nickname: string,
  finalists: VotingFinalist[],
): boolean {
  const nick = nickname.trim().toLowerCase();
  if (!nick || finalists.length === 0) return false;
  return finalists.some(
    (f) =>
      f.maleNick.trim().toLowerCase() === nick ||
      f.femaleNick.trim().toLowerCase() === nick,
  );
}

export function pickFinalistCheerLine(seed?: number): string {
  const index =
    seed !== undefined
      ? Math.abs(seed) % FINALIST_CHEER_LINES.length
      : Math.floor(Math.random() * FINALIST_CHEER_LINES.length);
  return FINALIST_CHEER_LINES[index] ?? FINALIST_CHEER_LINES[0];
}
