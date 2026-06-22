import type { EventConfig, EventState, ThemeId } from "@/lib/types";
import {
  CLOSED_COPY,
  ELIMINATION_COPY,
  EXTRACTION_COPY,
  FINALS_COPY,
  MATCHING_COPY,
} from "@/lib/game/late-game-copy";

export function mergeEventConfig(
  partial?: Partial<EventConfig> | Record<string, unknown>,
): EventConfig {
  const base: EventConfig = {
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

  if (!partial) return base;
  return { ...base, ...partial } as EventConfig;
}

export function themeClass(theme: ThemeId): string {
  return `theme-${theme.replace("_", "-")}`;
}

export const THEME_OPTIONS: { id: ThemeId; label: string }[] = [
  { id: "dark_fuchsia", label: "Dark Fuchsia" },
  { id: "romantic_elegant", label: "Romantic Elegant" },
  { id: "neon_party", label: "Neon Party" },
];

/** Etichette italiane per lo stato serata (UI giocatore). */
export const RUNTIME_STATE_LABELS: Record<EventState, string> = {
  lobby: "In attesa dell'inizio",
  quiz: "Quiz in corso",
  matching: MATCHING_COPY.badge,
  extraction: EXTRACTION_COPY.badge,
  elimination: ELIMINATION_COPY.badge,
  finals: FINALS_COPY.badge,
  winner: FINALS_COPY.displayWinnerKicker,
  closed: CLOSED_COPY.badge,
};

export function runtimeStateLabel(state: EventState): string {
  return RUNTIME_STATE_LABELS[state] ?? state;
}
