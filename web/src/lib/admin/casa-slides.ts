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
    sub: "Un quiz di affinità in sala: rispondete, formate le coppie, arriviamo alla finale.",
  },
  regole: {
    kicker: "Come si gioca",
    headline: "LE REGOLE",
    sub: "Telefono in mano: ascolta la domanda, scegli la risposta. Più risposte in comune, più alta l’affinità.",
  },
  finale: {
    kicker: "Come si vince",
    headline: "LA FINALE",
    sub: "Le coppie top salgono sul palco: prove live e voto della sala scelgono i vincitori.",
  },
  premio: {
    kicker: "Stasera",
    headline: "IL PREMIO",
    sub: "In palio un premio per la coppia vincitrice — chi arriva in fondo se lo porta a casa.",
  },
  sponsor: {
    kicker: "Grazie a",
    headline: "SPONSOR",
    sub: "Un grazie a chi rende possibile la serata: applauso ai nostri partner.",
  },
  stasera: {
    kicker: "Love Roulette",
    headline: "STASERA",
    sub: "Tenete il telefono pronto: tra poco partono le domande.",
  },
};

export const SIGLA_SRC = "/grafiche/video/sigla.mp4";

/**
 * Audio fallback quando manca `sigla.mp4`.
 * Prova nell’ordine: audio dedicato, poi mp3 accanto al video.
 */
export const SIGLA_AUDIO_CANDIDATES = [
  "/grafiche/audio/sigla.mp3",
  "/grafiche/video/sigla.mp3",
] as const;

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
      const saved = parsed[id];
      if (!saved) continue;
      const base = DEFAULT_SLIDES[id];
      next[id] = {
        kicker: saved.kicker?.trim() ? saved.kicker : base.kicker,
        headline: saved.headline?.trim() ? saved.headline : base.headline,
        // Sottotitolo vuoto in storage = lacuna: usa la frase di default.
        sub: saved.sub?.trim() ? saved.sub : base.sub,
      };
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
