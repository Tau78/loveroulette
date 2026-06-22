"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { EventState } from "@/lib/types";
import type { DisplayOverlay } from "@/lib/musicpro/display-overlay";
import type { LastReveal } from "@/lib/musicpro/extraction";
import type { FinalistCouple, LastElimination } from "@/lib/musicpro/elimination";
import type { LoveRouletteEvent } from "@/lib/musicpro/types";
import type { QuizSessionState } from "@/lib/musicpro/quiz-state";
import type { FinalsShowState } from "@/lib/musicpro/finals-show";
import type { VotingMetadata, VotingSessionState } from "@/lib/musicpro/voting";
import {
  deriveSyncStatus,
  finalsNeedsServerCatchUp,
  mergeFinalsShow,
  mergeLastReveal,
  mergeVotingMetadata,
  runSessionCatchUp,
  type SessionSyncStatus,
} from "@/lib/musicpro/session-sync";
import {
  subscribeLoveRouletteSession,
  type SessionTransport,
} from "@/lib/musicpro/realtime";

const DISPLAY_POLL_MS = 3000;
const QUIZ_POLL_MS = 350;
const FINALS_FAST_POLL_MS = 350;

function mergeQuizState(
  prev: QuizSessionState | null,
  incoming: QuizSessionState | null,
): QuizSessionState | null {
  if (!incoming) return null;
  if (!prev) return incoming;

  const prevUpdated = Date.parse(prev.updatedAt);
  const incomingUpdated = Date.parse(incoming.updatedAt);

  if (!Number.isNaN(prevUpdated) && !Number.isNaN(incomingUpdated)) {
    if (incomingUpdated > prevUpdated) return incoming;
    if (incomingUpdated < prevUpdated) return prev;
  }

  const prevStarted = Date.parse(prev.phaseStartedAt);
  const incomingStarted = Date.parse(incoming.phaseStartedAt);
  if (
    !Number.isNaN(incomingStarted) &&
    !Number.isNaN(prevStarted) &&
    incomingStarted < prevStarted
  ) {
    return prev;
  }

  return incoming;
}

export interface UseLoveRouletteSessionOptions {
  eventSlug: string;
  /** Event UUID — skips slug→id resolution when set. */
  eventId?: string | null;
  /** Snapshot completo (es. admin reload) — evita flash a null prima del poll. */
  initialEvent?: LoveRouletteEvent | null;
  /** SSR or join payload; used until first live update. */
  initialRuntimeState?: EventState;
  enabled?: boolean;
  /** Dopo resync, allinea fasi quiz/finali scadute sul server. */
  catchUpOnResync?: boolean;
}

export interface UseLoveRouletteSessionResult {
  runtimeState: EventState;
  sessionId: string | null;
  eventId: string | null;
  transport: SessionTransport | null;
  isResolving: boolean;
  syncStatus: SessionSyncStatus;
  lastSyncedAt: number | null;
  displayOverlay: DisplayOverlay | null;
  displayAudioCue: LoveRouletteEvent["displayAudioCue"];
  quizState: QuizSessionState | null;
  lastReveal: LastReveal | null;
  lastElimination: LastElimination | null;
  finalists: FinalistCouple[];
  voting: VotingMetadata;
  finalsShow: FinalsShowState | null;
  joinUrl: string | null;
  resyncNow: () => Promise<void>;
  applyQuizUpdate: (
    quiz: QuizSessionState | null,
    runtimeState?: EventState,
  ) => void;
  applyFinalsUpdate: (payload: {
    show?: FinalsShowState | null;
    session?: VotingSessionState | null;
    runtimeState?: EventState;
    voting?: VotingMetadata;
  }) => void;
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
    setFinalsShow: (s: FinalsShowState | null) => void;
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
  setters.setFinalsShow(data.finalsShow ?? null);
  setters.setJoinUrl(data.joinUrl);
}

function pollIntervalMs(
  runtimeState: EventState,
  voting: VotingMetadata,
  finalsShow: FinalsShowState | null,
): number {
  if (runtimeState === "quiz") return QUIZ_POLL_MS;
  if (
    runtimeState === "finals" &&
    (voting.current?.status === "open" ||
      finalsShow?.phase === "voting_prep" ||
      finalsShow?.phase === "voting" ||
      finalsShow?.phase === "winner_spectacle")
  ) {
    return FINALS_FAST_POLL_MS;
  }
  return DISPLAY_POLL_MS;
}

export function useLoveRouletteSession(
  options: UseLoveRouletteSessionOptions,
): UseLoveRouletteSessionResult {
  const {
    eventSlug,
    eventId: eventIdProp,
    initialEvent = null,
    initialRuntimeState = "lobby",
    enabled = true,
    catchUpOnResync = true,
  } = options;

  const [runtimeState, setRuntimeState] = useState<EventState>(
    initialEvent?.runtimeState ?? initialRuntimeState,
  );
  const [sessionId, setSessionId] = useState<string | null>(
    initialEvent?.sessionId ?? null,
  );
  const [eventId, setEventId] = useState<string | null>(
    eventIdProp ?? initialEvent?.id ?? null,
  );
  const [transport, setTransport] = useState<SessionTransport | null>(null);
  const [isResolving, setIsResolving] = useState(
    enabled && !eventIdProp && !initialEvent,
  );
  const [isResyncing, setIsResyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [lastPollErrorAt, setLastPollErrorAt] = useState<number | null>(null);
  const [displayOverlay, setDisplayOverlay] = useState<DisplayOverlay | null>(
    initialEvent?.displayOverlay ?? null,
  );
  const [displayAudioCue, setDisplayAudioCue] =
    useState<LoveRouletteEvent["displayAudioCue"]>(
      initialEvent?.displayAudioCue ?? null,
    );
  const [quizState, setQuizState] = useState<QuizSessionState | null>(
    initialEvent?.quizState ?? null,
  );
  const [lastReveal, setLastReveal] = useState<LastReveal | null>(
    initialEvent?.lastReveal ?? null,
  );
  const [lastElimination, setLastElimination] =
    useState<LastElimination | null>(initialEvent?.lastElimination ?? null);
  const [finalists, setFinalists] = useState<FinalistCouple[]>(
    initialEvent?.finalists ?? [],
  );
  const [voting, setVoting] = useState<VotingMetadata>(
    initialEvent?.voting ?? { current: null, completed: {} },
  );
  const [joinUrl, setJoinUrl] = useState<string | null>(
    initialEvent?.joinUrl ?? null,
  );
  const [finalsShow, setFinalsShow] = useState<FinalsShowState | null>(
    initialEvent?.finalsShow ?? null,
  );

  const resyncInFlightRef = useRef(false);
  const seededEventKeyRef = useRef<string | null>(null);

  const applyQuizUpdate = useCallback(
    (quiz: QuizSessionState | null, nextRuntimeState?: EventState) => {
      if (!quiz) {
        setQuizState(null);
      } else {
        setQuizState((prev) => mergeQuizState(prev, quiz));
      }
      if (nextRuntimeState) {
        setRuntimeState(nextRuntimeState);
      }
    },
    [],
  );

  const applyFinalsUpdate = useCallback(
    (payload: {
      show?: FinalsShowState | null;
      session?: VotingSessionState | null;
      runtimeState?: EventState;
      voting?: VotingMetadata;
    }) => {
      if (payload.show !== undefined) {
        setFinalsShow((prev) => mergeFinalsShow(prev, payload.show ?? null));
      }
      if (payload.voting) {
        setVoting((prev) => mergeVotingMetadata(prev, payload.voting!));
      } else if (payload.session !== undefined) {
        setVoting((prev) => ({
          ...prev,
          current: payload.session ?? null,
        }));
      }
      if (payload.runtimeState) setRuntimeState(payload.runtimeState);
    },
    [],
  );

  const applyPollPayload = useCallback((data: LoveRouletteEvent) => {
    setEventId(data.id);
    setSessionId(data.sessionId);
    setDisplayOverlay(data.displayOverlay ?? null);
    setDisplayAudioCue(data.displayAudioCue ?? null);
    setQuizState((prev) => mergeQuizState(prev, data.quizState ?? null));
    setLastReveal((prev) => mergeLastReveal(prev, data.lastReveal ?? null));
    setLastElimination(data.lastElimination ?? null);
    setFinalists(data.finalists ?? []);
    setVoting((prev) =>
      mergeVotingMetadata(prev, data.voting ?? { current: null, completed: {} }),
    );
    setFinalsShow((prev) => mergeFinalsShow(prev, data.finalsShow ?? null));
    setJoinUrl(data.joinUrl);
    setRuntimeState(data.runtimeState);
    setLastSyncedAt(Date.now());
    setLastPollErrorAt(null);
  }, []);

  const resyncNow = useCallback(async () => {
    if (!enabled || resyncInFlightRef.current) return;

    resyncInFlightRef.current = true;
    setIsResyncing(true);

    try {
      const res = await fetch(
        `/api/events/${encodeURIComponent(eventSlug)}`,
        { cache: "no-store" },
      );
      if (!res.ok) {
        setLastPollErrorAt(Date.now());
        return;
      }

      const data = (await res.json()) as LoveRouletteEvent;
      applyPollPayload(data);

      if (catchUpOnResync) {
        await runSessionCatchUp({
          eventSlug,
          runtimeState: data.runtimeState,
          quiz: data.quizState ?? null,
          finalsShow: data.finalsShow ?? null,
          handlers: {
            onQuiz: applyQuizUpdate,
            onFinals: applyFinalsUpdate,
          },
        });
      }
    } catch {
      setLastPollErrorAt(Date.now());
    } finally {
      resyncInFlightRef.current = false;
      setIsResyncing(false);
    }
  }, [
    applyFinalsUpdate,
    applyPollPayload,
    applyQuizUpdate,
    catchUpOnResync,
    enabled,
    eventSlug,
  ]);

  useEffect(() => {
    if (!enabled || !initialEvent) return;

    const seedKey = `${initialEvent.id}:${initialEvent.runtimeState}:${initialEvent.quizState?.updatedAt ?? ""}:${initialEvent.finalsShow?.updatedAt ?? ""}`;
    if (seededEventKeyRef.current === seedKey) return;
    seededEventKeyRef.current = seedKey;

    applyEventPayload(initialEvent, {
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
      setFinalsShow,
      setJoinUrl,
    });
    setLastSyncedAt(Date.now());
  }, [enabled, initialEvent]);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    async function setup() {
      setIsResolving(true);
      let resolvedId = eventIdProp ?? initialEvent?.id ?? null;
      let state = initialEvent?.runtimeState ?? initialRuntimeState;
      let sid = initialEvent?.sessionId ?? null;

      if (!resolvedId) {
        try {
          const res = await fetch(
            `/api/events/${encodeURIComponent(eventSlug)}`,
            { cache: "no-store" },
          );
          if (!cancelled && res.ok) {
            const data = (await res.json()) as LoveRouletteEvent;
            resolvedId = data.id;
            state = data.runtimeState;
            sid = data.sessionId;
            applyPollPayload(data);

            if (catchUpOnResync) {
              await runSessionCatchUp({
                eventSlug,
                runtimeState: data.runtimeState,
                quiz: data.quizState ?? null,
                finalsShow: data.finalsShow ?? null,
                handlers: {
                  onQuiz: applyQuizUpdate,
                  onFinals: applyFinalsUpdate,
                },
              });
            }
          }
        } catch {
          if (!cancelled) setLastPollErrorAt(Date.now());
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
  }, [
    applyFinalsUpdate,
    applyPollPayload,
    applyQuizUpdate,
    catchUpOnResync,
    enabled,
    eventSlug,
    eventIdProp,
    initialEvent?.id,
    initialRuntimeState,
  ]);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    async function pollDisplay() {
      try {
        const res = await fetch(
          `/api/events/${encodeURIComponent(eventSlug)}`,
          { cache: "no-store" },
        );
        if (!res.ok || cancelled) {
          if (!cancelled) setLastPollErrorAt(Date.now());
          return;
        }

        const data = (await res.json()) as LoveRouletteEvent;
        if (cancelled) return;

        applyPollPayload(data);

        if (
          data.runtimeState === "finals" &&
          data.finalsShow &&
          finalsNeedsServerCatchUp(data.finalsShow)
        ) {
          await runSessionCatchUp({
            eventSlug,
            runtimeState: data.runtimeState,
            quiz: data.quizState ?? null,
            finalsShow: data.finalsShow,
            handlers: {
              onQuiz: applyQuizUpdate,
              onFinals: applyFinalsUpdate,
            },
          });
        }
      } catch {
        if (!cancelled) setLastPollErrorAt(Date.now());
      }
    }

    void pollDisplay();
    const intervalMs = pollIntervalMs(runtimeState, voting, finalsShow);
    const interval = window.setInterval(pollDisplay, intervalMs);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [
    applyFinalsUpdate,
    applyPollPayload,
    applyQuizUpdate,
    enabled,
    eventSlug,
    runtimeState,
    voting.current?.status,
    finalsShow?.phase,
  ]);

  useEffect(() => {
    if (!enabled) return;

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void resyncNow();
      }
    };

    const onOnline = () => {
      void resyncNow();
    };

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", onOnline);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", onOnline);
    };
  }, [enabled, resyncNow]);

  const syncStatus = deriveSyncStatus({
    lastPollOkAt: lastSyncedAt,
    lastPollErrorAt,
    pollIntervalMs: pollIntervalMs(runtimeState, voting, finalsShow),
    transport,
    isResyncing,
  });

  return {
    runtimeState,
    sessionId,
    eventId,
    transport,
    isResolving,
    syncStatus,
    lastSyncedAt,
    displayOverlay,
    displayAudioCue,
    quizState,
    lastReveal,
    lastElimination,
    finalists,
    voting,
    finalsShow,
    joinUrl,
    resyncNow,
    applyQuizUpdate,
    applyFinalsUpdate,
  };
}
