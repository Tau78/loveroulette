/** Subset of Love Roulette event snapshot used by CasaPad Mac MVP. */

export type ConnectionStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "pin_required"
  | "error";

export interface QuizSnapshot {
  displayPhase: string | null;
  currentIndex: number | null;
  totalQuestions: number | null;
  updatedAt: string | null;
}

export interface EventSnapshot {
  id: string;
  slug: string;
  title: string;
  runtimeState: string;
  sessionId: string | null;
  animatorPinRequired: boolean;
  quizState: QuizSnapshot | null;
}

export interface SessionStats {
  onlineCount: number;
  participantCount: number;
  pairProgress: number | null;
}

export interface SessionPayload {
  runtimeState: string;
  sessionId: string | null;
  stats: SessionStats;
}

export interface ApiError {
  status: number;
  message: string;
}
