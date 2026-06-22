export interface PlayerAnswerRecap {
  questionId: string;
  optionLabel: string;
  elapsedSeconds: number;
}

function recapKey(eventSlug: string, questionId: string): string {
  return `lr_answer_recap_${eventSlug}_${questionId}`;
}

export function persistPlayerAnswerRecap(
  eventSlug: string,
  recap: PlayerAnswerRecap,
): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      recapKey(eventSlug, recap.questionId),
      JSON.stringify(recap),
    );
  } catch {
    // quota / private mode — in-memory only
  }
}

export function readPlayerAnswerRecap(
  eventSlug: string,
  questionId: string,
): PlayerAnswerRecap | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(recapKey(eventSlug, questionId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PlayerAnswerRecap>;
    if (
      parsed.questionId !== questionId ||
      typeof parsed.optionLabel !== "string" ||
      typeof parsed.elapsedSeconds !== "number"
    ) {
      return null;
    }
    return {
      questionId,
      optionLabel: parsed.optionLabel,
      elapsedSeconds: Math.max(1, Math.round(parsed.elapsedSeconds)),
    };
  } catch {
    return null;
  }
}
