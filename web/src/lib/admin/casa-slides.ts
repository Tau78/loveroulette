export type CasaSlideId =
  | "pres"
  | "regole"
  | "finale"
  | "premio"
  | "sponsor"
  | "stasera";

export type CasaSlide = {
  kicker: string;
  headline: string;
  sub: string;
};

export const SLIDE_ORDER: CasaSlideId[] = [
  "pres",
  "regole",
  "finale",
  "premio",
  "sponsor",
  "stasera",
];

export const SLIDE_LABELS: Record<CasaSlideId, string> = {
  pres: "Presentazione",
  regole: "Regole",
  finale: "La finale",
  premio: "Premio",
  sponsor: "Sponsor",
  stasera: "Stasera",
};

export const DEFAULT_SLIDES: Record<CasaSlideId, CasaSlide> = {
  pres: {
    kicker: "Love Roulette",
    headline: "BENVENUTI",
    sub: "La serata comincia",
  },
  regole: {
    kicker: "Come si gioca",
    headline: "LE REGOLE",
    sub: "Telefono in mano. Ascolta. Rispondi.",
  },
  finale: {
    kicker: "Come si vince",
    headline: "LA FINALE",
    sub: "In bocca al lupo",
  },
  premio: {
    kicker: "Stasera",
    headline: "IL PREMIO",
    sub: "",
  },
  sponsor: {
    kicker: "Grazie a",
    headline: "SPONSOR",
    sub: "",
  },
  stasera: {
    kicker: "Love Roulette",
    headline: "STASERA",
    sub: "Gioca con noi",
  },
};

export const SIGLA_SRC = "/grafiche/video/sigla.mp4";

const storageKey = (eventCode: string) =>
  `lr_casa_slides_${eventCode.toUpperCase()}`;

export function loadSlides(eventCode: string): Record<CasaSlideId, CasaSlide> {
  if (typeof window === "undefined") return DEFAULT_SLIDES;
  try {
    const raw = localStorage.getItem(storageKey(eventCode));
    if (!raw) return DEFAULT_SLIDES;
    const parsed = JSON.parse(raw) as Partial<Record<CasaSlideId, CasaSlide>>;
    const next = { ...DEFAULT_SLIDES };
    for (const id of SLIDE_ORDER) {
      if (parsed[id]) next[id] = { ...DEFAULT_SLIDES[id], ...parsed[id] };
    }
    return next;
  } catch {
    return DEFAULT_SLIDES;
  }
}

export function saveSlides(
  eventCode: string,
  slides: Record<CasaSlideId, CasaSlide>,
): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(storageKey(eventCode), JSON.stringify(slides));
}
