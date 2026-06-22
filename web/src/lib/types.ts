export type EventState =
  | "lobby"
  | "quiz"
  | "matching"
  | "extraction"
  | "elimination"
  | "finals"
  | "winner"
  | "closed";

export type Gender = "male" | "female";

export type PlayerRole = "player" | "finalist" | "audience" | "jury" | "animator";

export type ExtractionMode = "random" | "ranked" | "hybrid";

export type ChallengeId = "dance" | "kiss" | "declaration" | "kamasutra";

export type ThemeId = "dark_fuchsia" | "romantic_elegant" | "neon_party";

export interface EventConfig {
  extraction_mode: ExtractionMode;
  extraction_count: number | null;
  hybrid_random_count: number;
  challenge_order: ChallengeId[];
  stats_visibility: {
    animator_dashboard: boolean;
    projector: boolean;
    player_feedback: boolean;
  };
  chat_enabled: boolean;
  chat_anonymous: boolean;
  jury_enabled: boolean;
  jury_weight: number;
  public_weight: number;
  affinity_algorithm: "simple" | "weighted" | "category";
  theme: ThemeId;
  tie_breaker: "animator_manual" | "sudden_death";
  question_mode: "fixed" | "dynamic";
  data_retention_days: number;
  /** Se true, il giocatore deve inserire il codice badge al join. */
  badge_required: boolean;
}

export const DEFAULT_EVENT_CONFIG: EventConfig = {
  extraction_mode: "random",
  extraction_count: null,
  hybrid_random_count: 3,
  challenge_order: ["dance", "kiss", "declaration", "kamasutra"],
  stats_visibility: {
    animator_dashboard: true,
    projector: false,
    player_feedback: true,
  },
  chat_enabled: true,
  chat_anonymous: true,
  jury_enabled: false,
  jury_weight: 0.3,
  public_weight: 0.7,
  affinity_algorithm: "simple",
  theme: "dark_fuchsia",
  tie_breaker: "animator_manual",
  question_mode: "fixed",
  data_retention_days: 30,
  badge_required: false,
};

/** @deprecated Standalone schema — use LoveRouletteEvent from @/lib/musicpro/types */
export interface Event {
  id: string;
  code: string;
  name: string;
  theme: ThemeId;
  config: EventConfig;
  state: EventState;
  starts_at: string | null;
  created_at: string;
}

/** @deprecated Use LoveRouletteParticipant from @/lib/musicpro/types */
export interface Player {
  id: string;
  event_id: string;
  nickname: string;
  gender: Gender;
  badge_code: string | null;
  role: PlayerRole;
  is_online: boolean;
}

/** @deprecated Use love_roulette_pairs table shape */
export interface Pair {
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

export const CHALLENGE_LABELS: Record<ChallengeId, string> = {
  dance: "Vamos a bailar",
  kiss: "Baciami, stupido!",
  declaration: "In ginocchio da te",
  kamasutra: "Posizione Kamasutra",
};

export const REALTIME_EVENTS = {
  STATE_CHANGED: "state_changed",
  QUESTION_SHOW: "question_show",
  NEXT_COUPLE_SPIN: "next_couple_spin",
  COUPLE_REVEALED: "couple_revealed",
  COUPLE_ELIMINATED: "couple_eliminated",
  FINALISTS_SET: "finalists_set",
  CHALLENGE_STARTED: "challenge_started",
  SWITCH_TO_VOTING: "switch_to_voting",
  VOTE_COUNT_UPDATE: "vote_count_update",
  WINNER_ANNOUNCED: "winner_announced",
} as const;
