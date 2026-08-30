export type CasaBeat =
  | "casa"
  | "sigla"
  | "pres"
  | "regole"
  | "finale"
  | "premio"
  | "sponsor"
  | "stasera"
  | "presenti"
  | "stacco"
  | "quiz";

export type SiglaGate = "idle" | "warn" | "on" | "hold";

export const CASA_BEAT_ORDER: CasaBeat[] = [
  "casa",
  "sigla",
  "pres",
  "regole",
  "finale",
  "premio",
  "sponsor",
  "stasera",
  "presenti",
  "stacco",
  "quiz",
];

export function stepAvanti(input: {
  beat: CasaBeat;
  sigla: SiglaGate;
  roll: number;
  guestCount: number;
}): { beat: CasaBeat; sigla: SiglaGate; roll: number; stacco?: boolean } {
  const { beat, sigla, roll, guestCount } = input;

  if (beat === "casa") {
    return { beat: "sigla", sigla: "warn", roll };
  }
  if (beat === "sigla") {
    if (sigla === "warn") return { beat: "sigla", sigla: "on", roll };
    return { beat: "pres", sigla: "idle", roll };
  }
  if (beat === "presenti") {
    if (guestCount === 0 || roll >= guestCount - 1) {
      return { beat: "stacco", sigla, roll, stacco: true };
    }
    return { beat: "presenti", sigla, roll: roll + 1 };
  }
  if (beat === "stacco" || beat === "quiz") {
    return { beat: "quiz", sigla, roll };
  }
  const i = CASA_BEAT_ORDER.indexOf(beat);
  const next = CASA_BEAT_ORDER[i + 1] ?? beat;
  return { beat: next, sigla, roll: next === "presenti" ? 0 : roll };
}

/**
 * Live GO (skipPhase / matching / …) only after the session left lobby.
 * Opening beats + local tema stay on local AVANTI so we can start the quiz
 * with real feedback (instead of a silent handoff at beat===quiz).
 */
export function shouldUseLiveGo(input: {
  live: boolean;
  beat: CasaBeat;
  runtimeState: string;
}): boolean {
  if (!input.live) return false;
  return input.runtimeState !== "lobby";
}

export function avantiLabel(input: {
  beat: CasaBeat;
  sigla: SiglaGate;
  roll: number;
  guestCount: number;
}): string {
  const { beat, sigla, roll, guestCount } = input;
  if (beat === "casa") return "Sigla";
  if (beat === "sigla" && sigla === "warn") return "Parte ora";
  if (beat === "presenti") {
    return roll < guestCount - 1 ? "Prossimo" : "Si comincia";
  }
  if (beat === "stacco") return "Salta al quiz";
  return "Avanti";
}
