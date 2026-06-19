"use client";

import { useCallback, useEffect, useState } from "react";
import type { EventState } from "@/lib/types";
import type { DisplayOverlay } from "@/lib/musicpro/display-overlay";
import type { LastReveal } from "@/lib/musicpro/extraction";
import type { FinalistCouple, LastElimination } from "@/lib/musicpro/elimination";
import type { LoveRouletteEvent } from "@/lib/musicpro/types";
import type { QuizSessionState } from "@/lib/musicpro/quiz-state";
import type { VotingMetadata } from "@/lib/musicpro/voting";
import {
  subscribeLoveRouletteSession,
  type SessionTransport,
} from "@/lib/musicpro/realtime";

const DISPLAY_POLL_MS = 3000;
const QUIZ_POLL_MS = 1000;

function mergeQuizState(
  prev: QuizSessionState | null,
  incoming: QuizSessionState | null,
): QuizSessionState | null {
  if (!incoming) return null;
  if (!prev) return incoming;

  const prevAt = Date.parse(prev.phaseStartedAt);
  const incomingAt = Date.parse(incoming.phaseStartedAt);
  if (
    !Number.isNaN(incomingAt) &&
    !Number.isNaN(prevAt) &&
    incomingAt < prevAt
  ) {
    return prev;
  }

  return incoming;
}

export interface UseLoveRouletteSessionOptions {
  eventSlug: string;
  /** Event UUID — skips slug→id resolution when set. */
  eventId?: string | null;
  /** SSR or join payload; used until first live update. */
  initialRuntimeState?: EventState;
  enabled?: boolean;
}

export interface UseLoveRouletteSessionResult {
  runtimeState: EventState;
  sessionId: string | null;
  eventId: string | null;
  transport: SessionTransport | null;
  isResolving: boolean;
  displayOverlay: DisplayOverlay | null;
  displayAudioCue: LoveRouletteEvent["displayAudioCue"];
  quizState: QuizSessionState | null;
  lastReveal: LastReveal | null;
  lastElimination: LastElimination | null;
  finalists: FinalistCouple[];
  voting: VotingMetadata;
  joinUrl: string | null;
  /** Apply tick/advance response without waiting for poll. */
  applyQuizUpdate: (
    quiz: QuizSessionState | null,
    runtimeState?: EventState,
  ) => void;
}

function applyEventPayload(
  data: LoveRouletteEvent,
  setters: {
    setEventId: (id: string) => void;
    setRuntimeState: (s: EventState) => void;
    setSessionId: (id: string | null) => void;
    setDisplayOverlay: (o: DisplayOverlay | null) => void;
    setDisplayAudioCue: (c: LoveRouletteEvent["displayAudioCue"]) => void;
    setQuizState: (q: QuizSessionState | null) => void;
    setLastReveal: (r: LastReveal | null) => void;
    setLastElimination: (e: LastElimination | null) => void;
    setFinalists: (f: FinalistCouple[]) => void;
    setVoting: (v: VotingMetadata) => void;
    setJoinUrl: (url: string) => void;
  },
) {
  setters.setEventId(data.id);
  setters.setRuntimeState(data.runtimeState);
  setters.setSessionId(data.sessionId);
  setters.setDisplayOverlay(data.displayOverlay ?? null);
  setters.setDisplayAudioCue(data.displayAudioCue ?? null);
  setters.setQuizState(data.quizState ?? null);
  setters.setLastReveal(data.lastReveal ?? null);
  setters.setLastElimination(data.lastElimination ?? null);
  setters.setFinalists(data.finalists ?? []);
  setters.setVoting(data.voting ?? { current: null, completed: {} });
  setters.setJoinUrl(data.joinUrl);
}

export function useLoveRouletteSession(
  options: UseLoveRouletteSessionOptions,
): UseLoveRouletteSessionResult {
  const {
    eventSlug,
    eventId: eventIdProp,
    initialRuntimeState = "lobby",
    enabled = true,
  } = options;

  const [runtimeState, setRuntimeState] = useState<EventState>(initialRuntimeState);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [eventId, setEventId] = useState<string | null>(eventIdProp ?? null);
  const [transport, setTransport] = useState<SessionTransport | null>(null);
  const [isResolving, setIsResolving] = useState(enabled && !eventIdProp);
  const [displayOverlay, setDisplayOverlay] = useState<DisplayOverlay | null>(
    null,
  );
  const [displayAudioCue, setDisplayAudioCue] =
    useState<LoveRouletteEvent["displayAudioCue"]>(null);
  const [quizState, setQuizState] = useState<QuizSessionState | null>(null);
  const [lastReveal, setLastReveal] = useState<LastReveal | null>(null);
  const [lastElimination, setLastElimination] = useState<LastElimination | null>(
    null,
  );
  const [finalists, setFinalists] = useState<FinalistCouple[]>([]);
  const [voting, setVoting] = useState<VotingMetadata>({
    current: null,
    completed: {},
  });
  const [joinUrl, setJoinUrl] = useState<string | null>(null);

  const applyQuizUpdate = useCallback(
    (quiz: QuizSessionState | null, nextRuntimeState?: EventState) => {
      setQuizState(quiz);
      if (nextRuntimeState) {
        setRuntimeState(nextRuntimeState);
      }
    },
    [],
  );

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    async function setup() {
      setIsResolving(true);
      let resolvedId = eventIdProp ?? null;
      let state = initialRuntimeState;
      let sid: string | null = null;

      if (!resolvedId) {
        try {
          const res = await fetch(
            `/api/events/${encodeURIComponent(eventSlug)}`,
          );
          if (!cancelled && res.ok) {
            const data = (await res.json()) as LoveRouletteEvent;
            resolvedId = data.id;
            state = data.runtimeState;
            sid = data.sessionId;
            applyEventPayload(data, {
              setEventId,
              setRuntimeState,
              setSessionId,
              setDisplayOverlay,
              setDisplayAudioCue,
              setQuizState,
              setLastReveal,
              setLastElimination,
              setFinalists,
              setVoting,
              setJoinUrl,
            });
          }
        } catch {
          // subscription may still attach once eventId is known
        }
      }

      if (cancelled) return;

      if (resolvedId) {
        setEventId(resolvedId);
        setRuntimeState(state);
        setSessionId(sid);
      }
      setIsResolving(false);

      if (!resolvedId || cancelled) return;

      unsubscribe = subscribeLoveRouletteSession({
        eventId: resolvedId,
        eventSlug,
        onUpdate: (payload, t) => {
          if (cancelled) return;
          setRuntimeState(payload.runtimeState);
          setSessionId(payload.sessionId);
          setTransport(t);
        },
        onTransport: (t) => {
          if (!cancelled) setTransport(t);
        },
      });
    }

    void setup();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [enabled, eventSlug, eventIdProp, initialRuntimeState]);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    async function pollDisplay() {
      try {
        const res = await fetch(
          `/api/events/${encodeURIComponent(eventSlug)}`,
        );
        if (!res.ok || cancelled) return;

        const data = (await res.json()) as LoveRouletteEvent;
        if (cancelled) return;

        setDisplayOverlay(data.displayOverlay ?? null);
        setDisplayAudioCue(data.displayAudioCue ?? null);
        setQuizState((prev) => mergeQuizState(prev, data.quizState ?? null));
        setLastReveal(data.lastReveal ?? null);
        setLastElimination(data.lastElimination ?? null);
        setFinalists(data.finalists ?? []);
        setVoting(data.voting ?? { current: null, completed: {} });
        setJoinUrl(data.joinUrl);
        setRuntimeState(data.runtimeState);
      } catch {
        // keep last known overlay
      }
    }

    void pollDisplay();
    const intervalMs =
      runtimeState === "quiz"
        ? QUIZ_POLL_MS
        : runtimeState === "finals" && voting?.current?.status === "open"
          ? 1000
          : DISPLAY_POLL_MS;
    const interval = window.setInterval(pollDisplay, intervalMs);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [enabled, eventSlug, runtimeState, voting.current?.status]);

  return {
    runtimeState,
    sessionId,
    eventId,
    transport,
    isResolving,
    displayOverlay,
    displayAudioCue,
    quizState,
    lastReveal,
    lastElimination,
    finalists,
    voting,
    joinUrl,
    applyQuizUpdate,
  };
}
