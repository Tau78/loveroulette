import type { CasaBeat } from "@/lib/admin/casa-avanti";
import { casaQrDisplayCommand } from "@/lib/admin/casa-qr-display";

const OPENING_SLIDE_BEATS = new Set<CasaBeat>([
  "pres",
  "regole",
  "finale",
  "premio",
  "sponsor",
  "stasera",
]);

export type CasaDisplaySyncInput = {
  beat: CasaBeat;
  sigla: "idle" | "warn" | "on" | "hold";
  help: boolean;
  /** Chiave giocatore in «presenti» (roll + nick + sesso). */
  presentiKey: string | null;
  slideHeadline: string | null;
  slideKicker: string | null;
  slideSub: string | null;
  staccoStartedAt: string | null;
};

/**
 * Chiave stabile per evitare POST overlay duplicati (sigla che riparte, flicker SCHERMO).
 * Null = nessun comando display per questo beat.
 */
export function casaBeatDisplaySyncKey(input: CasaDisplaySyncInput): string | null {
  const qrCmd = casaQrDisplayCommand(input.help, input.beat);
  if (qrCmd) {
    return qrCmd.type === "show_qr" ? "cmd:qr:show" : "cmd:qr:clear";
  }

  if (input.beat === "sigla") {
    if (input.sigla === "warn") return "cmd:sigla-warn";
    if (input.sigla === "on" || input.sigla === "hold") return "cmd:sigla-video";
    return "cmd:sigla-idle-clear";
  }

  if (input.beat === "presenti" && input.presentiKey) {
    return `cmd:presenti:${input.presentiKey}`;
  }

  if (input.beat === "stacco" && input.staccoStartedAt) {
    return `cmd:stacco:${input.staccoStartedAt}`;
  }

  if (OPENING_SLIDE_BEATS.has(input.beat) && input.slideHeadline) {
    return [
      "cmd:slide",
      input.beat,
      input.slideKicker ?? "",
      input.slideHeadline,
      input.slideSub ?? "",
    ].join(":");
  }

  return null;
}
