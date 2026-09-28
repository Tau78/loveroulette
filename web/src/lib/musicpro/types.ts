import type { EventConfig, EventState } from "@/lib/types";
import type {
  LoveRouletteAgeBand,
  LoveRouletteGender,
  LoveRouletteSeeking,
  PublicNameMode,
} from "@/lib/player/identity";
import type { DisplayOverlay } from "./display-overlay";
import type { LastReveal } from "./extraction";
import type { FinalistCouple, LastElimination } from "./elimination";
import type { QuizSessionState, QuizSetupPrefs } from "./quiz-state";
import type { VotingMetadata } from "./voting";
import type { FinalsShowState } from "./finals-show";
import type { SpecialTrialState } from "./special-trial";

export type EventGameFormat = "cervellone" | "love_roulette";

export type {
  LoveRouletteAgeBand,
  LoveRouletteGender,
  LoveRouletteSeeking,
  PublicNameMode,
} from "@/lib/player/identity";

export type ParticipantDataVisibility = "everyone" | "matched" | "none";

export type LoveRouletteParticipantRole =
  | "player"
  | "finalist"
  | "audience"
  | "jury"
  | "animator";

/** Row shape from public.events (subset). */
export interface MusicProEventRow {
  id: string;
  game_format: EventGameFormat;
  event_date: string;
  event_time: string | null;
  metadata: Record<string, unknown> | null;
  venues?: { name: string } | { name: string }[] | null;
}

export interface LoveRouletteSessionRow {
  id: string;
  runtime_state: EventState;
  session_number: number;
}

/** View model for Love Roulette UI + API. */
export interface LoveRouletteEvent {
  id: string;
  /** Code in URL (metadata love_roulette_code or event id). */
  slug: string;
  joinCode: string | null;
  title: string;
  gameFormat: "love_roulette";
  eventDate: string;
  eventTime: string | null;
  runtimeState: EventState;
  sessionId: string | null;
  config: EventConfig;
  venueName: string | null;
  displayOverlay: DisplayOverlay | null;
  /** Timestamp ultimo comando audio da dashboard → proiettore. */
  displayAudioCue: { enabled: boolean; updatedAt: string } | null;
  /** Stato quiz corrente (domanda attiva, indice, totale). */
  quizState: QuizSessionState | null;
  /** Preferenze regia quiz (numero domande, secondi risposta). */
  quizSetup: QuizSetupPrefs;
  /** Ultima coppia estratta (sync mobile). */
  lastReveal: LastReveal | null;
  /** Ultima coppia eliminata (sync display). */
  lastElimination: LastElimination | null;
  /** Top 3 finalisti correnti. */
  finalists: FinalistCouple[];
  /** Votazione finali (metadata love_roulette_voting). */
  voting: VotingMetadata;
  /** Spettacolo finali (slide prove, countdown, podio). */
  finalsShow: FinalsShowState | null;
  /** Prova speciale mid-quiz (prenotazione / setup / timer). */
  specialTrial: SpecialTrialState | null;
  joinUrl: string;
  /** True when `metadata.animator_pin` is set for this event. */
  animatorPinRequired: boolean;
}

export interface LoveRouletteParticipant {
  id: string;
  event_id: string;
  nickname: string;
  /** Nome anagrafico completo, non è il nome in sala. */
  real_name?: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  email: string | null;
  photo_url: string | null;
  /** Nick facoltativo. Il nome in sala è `nickname`. */
  nick: string | null;
  public_name_mode: PublicNameMode;
  gender: LoveRouletteGender;
  /** Obbligatorio per entrare in coppia. Null = escluso dal matching. */
  seeking: LoveRouletteSeeking | null;
  /** Raccolta in ingresso. Il matching non la filtra ancora. */
  age_band: LoveRouletteAgeBand | null;
  badge_code: string | null;
  role: LoveRouletteParticipantRole;
  is_online: boolean;
  data_visibility: ParticipantDataVisibility;
}

/** Row shape from love_roulette_pairs. */
export interface LoveRoulettePair {
  id: string;
  event_id: string;
  participant_male_id: string;
  participant_female_id: string;
  affinity_score: number;
  rank: number;
  is_finalist: boolean;
  is_eliminated: boolean;
  was_shown: boolean;
}

export type LoveRouletteQuestionSource = "event" | "pool";

export interface LoveRouletteQuestionOption {
  id: string;
  sortOrder: number;
  label: string;
}

export interface LoveRouletteQuestion {
  id: string;
  body: string;
  category: string;
  weight: number;
  sortOrder: number;
  options: LoveRouletteQuestionOption[];
}
