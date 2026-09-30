import type { CasaBeat, SiglaGate } from "@/lib/admin/casa-avanti";

/** Default hold per ogni slide/passo apertura senza tempo dedicato. */
export const DEFAULT_OPENING_AUTOPLAY_SEC = 5;

/**
 * Secondi di hold Autoplay prima del prossimo AVANTI locale.
 * `null` = non schedulare (sigla in play → fine video; stacco → countdown; quiz → motore live).
 */
export function openingAutoplayHoldSeconds(input: {
  beat: CasaBeat;
  sigla: SiglaGate;
}): number | null {
  const { beat, sigla } = input;

  if (beat === "quiz") return null;
  if (beat === "stacco") return null;

  if (beat === "sigla") {
    // Warn: slide «Parte ora» — poi video. On/hold: aspetta fine sigla.
    if (sigla === "on" || sigla === "hold") return null;
    return DEFAULT_OPENING_AUTOPLAY_SEC;
  }

  // casa, slides, presenti: sempre un tempo (mai hold infinito).
  return DEFAULT_OPENING_AUTOPLAY_SEC;
}
