import type { EventState } from "@/lib/types";
import type { LastReveal } from "./extraction";
import type { FinalsShowState } from "./finals-show";
import {
  isPhaseExpired,
  resolveSyncedQuizClock,
} from "./quiz-display";
import {
  isFinalsPhaseExpired,
  resolveFinalsShowClock,
} from "./finals-show";
import type { QuizSessionState } from "./quiz-state";
import type { VotingMetadata } from "./voting";

export type SessionSyncStatus = "live" | "degraded" | "stale" | "resyncing";

export function mergeFinalsShow(
  prev: FinalsShowState | null,
  incoming: FinalsShowState | null,
): FinalsShowState | null {
  if (!incoming) return prev;
  if (!prev) return incoming;

  const prevAt = Date.parse(prev.updatedAt);
  const incomingAt = Date.parse(incoming.updatedAt);

  if (!Number.isNaN(prevAt) && !Number.isNaN(incomingAt)) {
    if (incomingAt > prevAt) return incoming;
    if (incomingAt < prevAt) return prev;
  }

  const prevStarted = Date.parse(prev.phaseStartedAt);
  const incomingStarted = Date.parse(incoming.phaseStartedAt);
  if (
    !Number.isNaN(prevStarted) &&
    !Number.isNaN(incomingStarted) &&
    incomingStarted < prevStarted
  ) {
    return prev;
  }

  return incoming;
}

export function mergeVotingMetadata(
  prev: VotingMetadata,
  incoming: VotingMetadata,
): VotingMetadata {
  const prevCurrent = prev.current;
  const incomingCurrent = incoming.current;

  if (prevCurrent?.updatedAt && incomingCurrent?.updatedAt) {
    const prevAt = Date.parse(prevCurrent.updatedAt);
    const incomingAt = Date.parse(incomingCurrent.updatedAt);
    if (
      !Number.isNaN(prevAt) &&
      !Number.isNaN(incomingAt) &&
      prevAt > incomingAt
    ) {
      return { ...incoming, current: prevCurrent };
    }
  }

  return incoming;
}

export function mergeLastReveal(
  prev: LastReveal | null,
  incoming: LastReveal | null,
): LastReveal | null {
  if (!incoming) return prev;
  if (!prev) return incoming;

  const prevAt = Date.parse(prev.updatedAt);
  const incomingAt = Date.parse(incoming.updatedAt);

  if (!Number.isNaN(prevAt) && !Number.isNaN(incomingAt)) {
    if (incomingAt >= prevAt) return incoming;
    return prev;
  }

  return incoming;
}

export function quizNeedsServerCatchUp(quiz: QuizSessionState): boolean {
  const clock = resolveSyncedQuizClock(quiz);
  if (clock.awaitingServerTick) return true;

  return isPhaseExpired(
    quiz.displayPhase,
    quiz.phaseStartedAt,
    quiz.timing,
  );
}

export function finalsNeedsServerCatchUp(show: FinalsShowState): boolean {
  const clock = resolveFinalsShowClock(show);
  if (clock.awaitingServerTick) return true;

  return isFinalsPhaseExpired(show.phase, show.phaseStartedAt);
}

export interface SessionCatchUpHandlers {
  onQuiz: (
    quiz: QuizSessionState | null,
    runtimeState?: EventState,
  ) => void;
  onFinals: (payload: {
    show: FinalsShowState | null;
    session: import("./voting").VotingSessionState | null;
    runtimeState?: EventState;
  }) => void;
}

/** Allinea il server alle fasi già scadute sul wall-clock condiviso. */
export async function runSessionCatchUp(options: {
  eventSlug: string;
  runtimeState: EventState;
  quiz: QuizSessionState | null;
  finalsShow: FinalsShowState | null;
  handlers: SessionCatchUpHandlers;
  maxSteps?: number;
}): Promise<{ runtimeState: EventState; quiz: QuizSessionState | null; finalsShow: FinalsShowState | null }> {
  const maxSteps = options.maxSteps ?? 12;
  let runtimeState = options.runtimeState;
  let quiz = options.quiz;
  let finalsShow = options.finalsShow;

  for (let step = 0; step < maxSteps; step++) {
    if (
      runtimeState === "quiz" &&
      quiz &&
      quiz.autoplayEnabled === true &&
      quizNeedsServerCatchUp(quiz)
    ) {
      const res = await fetch(
        `/api/events/${encodeURIComponent(options.eventSlug)}/quiz`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "tick" }),
        },
      );
      if (!res.ok) break;

      const data = (await res.json()) as {
        quiz: QuizSessionState | null;
        runtimeState?: EventState;
      };

      quiz = data.quiz ?? null;
      if (data.runtimeState) runtimeState = data.runtimeState;
      options.handlers.onQuiz(quiz, data.runtimeState);
      continue;
    }

    if (
      runtimeState === "finals" &&
      finalsShow &&
      finalsNeedsServerCatchUp(finalsShow)
    ) {
      const res = await fetch(
        `/api/events/${encodeURIComponent(options.eventSlug)}/voting`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "tick" }),
        },
      );
      if (!res.ok) break;

      const data = (await res.json()) as {
        show: FinalsShowState | null;
        session: import("./voting").VotingSessionState | null;
        runtimeState?: EventState;
      };

      finalsShow = data.show ?? finalsShow;
      if (data.runtimeState) runtimeState = data.runtimeState;
      options.handlers.onFinals(data);
      continue;
    }

    break;
  }

  return { runtimeState, quiz, finalsShow };
}

export function deriveSyncStatus(options: {
  lastPollOkAt: number | null;
  lastPollErrorAt: number | null;
  pollIntervalMs: number;
  transport: "realtime" | "polling" | null;
  isResyncing: boolean;
  now?: number;
}): SessionSyncStatus {
  if (options.isResyncing) return "resyncing";

  const now = options.now ?? Date.now();
  const lastOk = options.lastPollOkAt;

  if (options.lastPollErrorAt && (!lastOk || options.lastPollErrorAt > lastOk)) {
    if (now - options.lastPollErrorAt > options.pollIntervalMs * 2) {
      return "stale";
    }
  }

  if (!lastOk || now - lastOk > options.pollIntervalMs * 3) {
    return "stale";
  }

  if (options.transport === "polling" || now - lastOk > options.pollIntervalMs * 1.5) {
    return "degraded";
  }

  return "live";
}
