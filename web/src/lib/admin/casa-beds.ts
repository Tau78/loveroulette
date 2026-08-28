import { audioUrl } from "@/lib/audio/phase-tracks";
import type { CasaBeat } from "@/lib/admin/casa-avanti";

const LOBBY = audioUrl("dark_fuchsia/loops/LR_01_Lobby_Ambient_A.mp3");
const QUIZ = audioUrl("dark_fuchsia/loops/LR_02_Quiz_Tension_A.mp3");
const EXTRACT = audioUrl("dark_fuchsia/loops/LR_05_Extraction_Underscore_A.mp3");

export function casaAutoBedSrc(beat: CasaBeat): string | null {
  if (beat === "sigla") return null;
  if (beat === "presenti" || beat === "stacco") return EXTRACT;
  if (beat === "quiz") return QUIZ;
  return LOBBY;
}

export function casaAutoBedLabel(beat: CasaBeat): string {
  if (beat === "sigla") return "Pausa — parla la sigla";
  if (beat === "presenti" || beat === "stacco") return "Estrazione";
  if (beat === "quiz") return "Tensione quiz";
  return "Lobby";
}

export function resolveCasaBed(
  beat: CasaBeat,
  folder: { name: string; url: string }[] | null,
  index: number,
): { name: string; url: string } | null {
  if (folder?.length) {
    return folder[index] ?? folder[0] ?? null;
  }
  const url = casaAutoBedSrc(beat);
  if (!url) return null;
  return { name: casaAutoBedLabel(beat), url };
}
