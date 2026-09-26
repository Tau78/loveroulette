import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  clearStoredPin,
  fetchEventSnapshot,
  fetchSession,
  pollIntervalMs,
  postQuizAdvance,
  readStoredPin,
  storePin,
  verifyAnimatorPin,
} from "../api/client";
import type {
  ConnectionStatus,
  EventSnapshot,
  SessionStats,
} from "../api/types";

const EMPTY_STATS: SessionStats = {
  onlineCount: 0,
  participantCount: 0,
  pairProgress: null,
};

export interface UseEventPollOptions {
  host: string;
  code: string;
  enabled: boolean;
}

export function useEventPoll({ host, code, enabled }: UseEventPollOptions) {
  const [status, setStatus] = useState<ConnectionStatus>("idle");
  const [event, setEvent] = useState<EventSnapshot | null>(null);
  const [stats, setStats] = useState<SessionStats>(EMPTY_STATS);
  const [error, setError] = useState<string | null>(null);
  const [pin, setPin] = useState("");
  const [pinUnlocked, setPinUnlocked] = useState(false);
  const [lastPolledAt, setLastPolledAt] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [pollEpoch, setPollEpoch] = useState(0);

  const hostRef = useRef(host);
  const codeRef = useRef(code);
  const pinUnlockedRef = useRef(pinUnlocked);
  const runtimeRef = useRef<string | null>(null);
  hostRef.current = host;
  codeRef.current = code;
  pinUnlockedRef.current = pinUnlocked;
  runtimeRef.current = event?.runtimeState ?? null;

  const applySnapshot = useCallback(
    (snap: EventSnapshot, session: Awaited<ReturnType<typeof fetchSession>> | null) => {
      let next = snap;
      if (session) {
        setStats(session.stats);
        if (!snap.sessionId && session.sessionId) {
          next = { ...snap, sessionId: session.sessionId };
        }
      }
      setEvent(next);
      setLastPolledAt(Date.now());
      setError(null);
      if (next.animatorPinRequired && !pinUnlockedRef.current) {
        setStatus("pin_required");
      } else {
        setStatus("connected");
      }
    },
    [],
  );

  const refresh = useCallback(async () => {
    const c = codeRef.current.trim();
    if (!c) return;
    try {
      const [snap, session] = await Promise.all([
        fetchEventSnapshot(hostRef.current, c),
        fetchSession(hostRef.current, c).catch(() => null),
      ]);
      applySnapshot(snap, session);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore di rete.");
      // Non spegnere un poll già vivo per un singolo 5xx/rete
      setStatus((prev) =>
        prev === "connected" || prev === "pin_required" ? prev : "error",
      );
    }
  }, [applySnapshot]);

  const connect = useCallback(async () => {
    const c = codeRef.current.trim();
    if (!c) {
      setError("Inserisci il codice evento.");
      setStatus("error");
      return;
    }
    setStatus("connecting");
    setError(null);
    const stored = readStoredPin(c);
    if (stored) {
      setPin(stored);
      setPinUnlocked(true);
      pinUnlockedRef.current = true;
    }
    await refresh();
    setPollEpoch((n) => n + 1);
  }, [refresh]);

  const disconnect = useCallback(() => {
    setStatus("idle");
    setEvent(null);
    setStats(EMPTY_STATS);
    setError(null);
    setLastPolledAt(null);
  }, []);

  const submitPin = useCallback(async () => {
    const c = codeRef.current.trim();
    const p = pin.trim();
    if (!c || !p) {
      setError("Inserisci il PIN animatore.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await verifyAnimatorPin(hostRef.current, c, p);
      if (!result.ok) {
        setPinUnlocked(false);
        pinUnlockedRef.current = false;
        setError(result.error);
        setStatus("pin_required");
        return;
      }
      storePin(c, p);
      setPinUnlocked(true);
      pinUnlockedRef.current = true;
      setStatus("connected");
      await refresh();
    } finally {
      setBusy(false);
    }
  }, [pin, refresh]);

  const clearPin = useCallback(() => {
    const c = codeRef.current.trim();
    if (c) clearStoredPin(c);
    setPin("");
    setPinUnlocked(false);
    pinUnlockedRef.current = false;
    if (event?.animatorPinRequired) {
      setStatus("pin_required");
    }
  }, [event?.animatorPinRequired]);

  const advanceQuiz = useCallback(async () => {
    const c = codeRef.current.trim();
    if (!c) return;
    setBusy(true);
    setError(null);
    try {
      const result = await postQuizAdvance(
        hostRef.current,
        c,
        pinUnlockedRef.current ? pin.trim() || null : null,
      );
      if (!result.ok) {
        setError(result.error);
        return;
      }
      await refresh();
    } finally {
      setBusy(false);
    }
  }, [pin, refresh]);

  // Poll while live
  useEffect(() => {
    if (!enabled) return;
    if (status !== "connected" && status !== "pin_required") return;

    let cancelled = false;
    let timer: number | undefined;

    const schedule = () => {
      const ms = pollIntervalMs(runtimeRef.current);
      timer = window.setTimeout(async () => {
        if (cancelled) return;
        await refresh();
        if (!cancelled) schedule();
      }, ms);
    };

    schedule();

    return () => {
      cancelled = true;
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [enabled, status, pollEpoch, refresh]);

  // Load stored pin when code changes
  useEffect(() => {
    const c = code.trim();
    if (!c) return;
    const stored = readStoredPin(c);
    if (stored) {
      setPin(stored);
      setPinUnlocked(true);
      pinUnlockedRef.current = true;
    } else {
      setPinUnlocked(false);
      pinUnlockedRef.current = false;
    }
  }, [code]);

  const connected = status === "connected" || status === "pin_required";

  return useMemo(
    () => ({
      status,
      event,
      stats,
      error,
      pin,
      setPin,
      pinUnlocked,
      lastPolledAt,
      busy,
      connected,
      connect,
      disconnect,
      refresh,
      submitPin,
      clearPin,
      advanceQuiz,
    }),
    [
      status,
      event,
      stats,
      error,
      pin,
      pinUnlocked,
      lastPolledAt,
      busy,
      connected,
      connect,
      disconnect,
      refresh,
      submitPin,
      clearPin,
      advanceQuiz,
    ],
  );
}
