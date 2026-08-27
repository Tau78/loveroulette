/** Banner WhatsApp / flicker: non mostrare l'overlay. */
export const RESUME_BLUR_IGNORE_MS = 300;

/** Tempo minimo per coprire il frame stantio prima del nuovo snapshot. */
export const RESUME_OVERLAY_MIN_MS = 200;

/** Non bloccare il gioco se il resync è lento. */
export const RESUME_OVERLAY_MAX_MS = 1200;

export const PLAYER_RESUME_OVERLAY_COPY = "Allineamento alla sala…";

export function shouldHoldResumeOverlay(input: {
  hiddenDurationMs: number;
  overlayAgeMs: number;
  resyncing: boolean;
}): boolean {
  if (input.hiddenDurationMs < RESUME_BLUR_IGNORE_MS) return false;
  if (input.overlayAgeMs >= RESUME_OVERLAY_MAX_MS) return false;
  if (input.overlayAgeMs < RESUME_OVERLAY_MIN_MS) return true;
  return input.resyncing;
}
