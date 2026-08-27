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
};

export type CasaVenue = {
  id: string;
  name: string;
  city: string | null;
};

const storageKey = (eventCode: string) =>
  `lr_casa_prep_${eventCode.toUpperCase()}`;

export function loadPrep(eventCode: string): CasaPrep {
  if (typeof window === "undefined") return DEFAULT_CASA_PREP;
  try {
    const raw = localStorage.getItem(storageKey(eventCode));
    if (!raw) return DEFAULT_CASA_PREP;
    const parsed = JSON.parse(raw) as Partial<CasaPrep>;
    return { ...DEFAULT_CASA_PREP, ...parsed };
  } catch {
    return DEFAULT_CASA_PREP;
  }
}

export function savePrep(eventCode: string, prep: CasaPrep): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(storageKey(eventCode), JSON.stringify(prep));
}

export function venueLabel(venue: CasaVenue): string {
  return venue.city ? `${venue.name} · ${venue.city}` : venue.name;
}
