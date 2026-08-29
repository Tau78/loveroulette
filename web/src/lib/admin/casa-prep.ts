export type CasaStile = "ironico" | "romantico" | "mix";
export type CasaRipescaggio = "off" | "wildcard" | "salva";

export type CasaPrep = {
  venueId: string | null;
  venueName: string;
  stile: CasaStile;
  ripescaggio: CasaRipescaggio;
  ship: boolean;
  luci: boolean;
  lampo: boolean;
  foto: boolean;
  pausa: boolean;
  chemistry: boolean;
  speed: boolean;
  recap: boolean;
  /** Top N coppie in ship (1–20). */
  shipTopN: number;
  /** Durata flash messaggio e spotlight luci in secondi (1–60). */
  luciFlashSec: number;
  /** Secondi del ripescaggio Salva sala (5–120). */
  salvaSec: number;
};

export const DEFAULT_CASA_PREP: CasaPrep = {
  venueId: null,
  venueName: "",
  stile: "ironico",
  ripescaggio: "salva",
  ship: true,
  luci: true,
  lampo: true,
  foto: true,
  pausa: true,
  chemistry: true,
  speed: true,
  recap: true,
  shipTopN: 3,
  luciFlashSec: 8,
  salvaSec: 30,
};

export type CasaVenue = {
  id: string;
  name: string;
  city: string | null;
};

const storageKey = (eventCode: string) =>
  `lr_casa_prep_${eventCode.toUpperCase()}`;

function clampInt(n: unknown, min: number, max: number, fallback: number): number {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v)) return fallback;
  return Math.min(max, Math.max(min, Math.round(v)));
}

/** Merge + clamp numeri prep (topN 1–20, flash 1–60, salva 5–120). */
export function sanitizePrep(raw: Partial<CasaPrep>): CasaPrep {
  const merged = { ...DEFAULT_CASA_PREP, ...raw };
  return {
    ...merged,
    shipTopN: clampInt(merged.shipTopN, 1, 20, DEFAULT_CASA_PREP.shipTopN),
    luciFlashSec: clampInt(merged.luciFlashSec, 1, 60, DEFAULT_CASA_PREP.luciFlashSec),
    salvaSec: clampInt(merged.salvaSec, 5, 120, DEFAULT_CASA_PREP.salvaSec),
  };
}

export function loadPrep(eventCode: string): CasaPrep {
  if (typeof window === "undefined") return DEFAULT_CASA_PREP;
  try {
    const raw = localStorage.getItem(storageKey(eventCode));
    if (!raw) return DEFAULT_CASA_PREP;
    const parsed = JSON.parse(raw) as Partial<CasaPrep>;
    return sanitizePrep(parsed);
  } catch {
    return DEFAULT_CASA_PREP;
  }
}

export function savePrep(eventCode: string, prep: CasaPrep): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(storageKey(eventCode), JSON.stringify(sanitizePrep(prep)));
}

export function venueLabel(venue: CasaVenue): string {
  return venue.city ? `${venue.name} · ${venue.city}` : venue.name;
}
