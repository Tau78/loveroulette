"use client";

import { useCallback, useEffect, useState } from "react";
import { MonitorOff, Volume2, VolumeX } from "lucide-react";
import { AdminButton } from "@/components/admin/AdminButton";
import { ADMIN_SOUNDTRACK_AUTO_UNLOCK } from "@/components/admin/AdminAudioPanel";
import { useCasaLiveSession } from "@/components/admin/casa/casa-live-session-context";
import {
  CasaWidgetSessionGate,
  useCasaInvalidPinHandler,
} from "@/components/admin/casa/widgets/casa-widget-live";
import {
  isInvalidAnimatorPinError,
  postDisplayCommand,
} from "@/lib/admin/animator-api";
import { useLoveRouletteSoundtrack } from "@/hooks/useLoveRouletteSoundtrack";
import { useCurrentQuizQuestion } from "@/hooks/useQuizQuestions";
import { useQuizPhaseSync } from "@/hooks/useQuizPhaseSync";
import type { DisplayOverlay } from "@/lib/musicpro/display-overlay";

const BLACKOUT_TITLE = "BLACKOUT";

/**
 * Panic live — Blackout proiettore (POST /display come AdminRegia) + Mute colonna sonora
 * (stesso hook di AdminAudioPanel). Nessun toggle solo CSS.
 */
export function WidgetPanic() {
  return (
    <CasaWidgetSessionGate>
      <WidgetPanicBody />
    </CasaWidgetSessionGate>
  );
}

function WidgetPanicBody() {
  const {
    eventCode,
    pin,
    controlsDisabled,
    runtimeState,
    quizState,
    finalsShow,
    setSoundtrackUnlocked,
  } = useCasaLiveSession();
  const onInvalidPin = useCasaInvalidPinHandler();

  const [blackout, setBlackout] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const quizActive = runtimeState === "quiz" && Boolean(quizState);

  const { displayPhase: syncedQuizPhase } = useQuizPhaseSync({
    eventSlug: eventCode,
    quizState,
    enabled: quizActive && !controlsDisabled,
    driveTicks: false,
  });

  const { currentQuestion } = useCurrentQuizQuestion(
    eventCode,
    quizState,
    runtimeState,
  );

  const { unlocked, muted, unlock, toggleMute } = useLoveRouletteSoundtrack({
    runtimeState,
    quizDisplayPhase: quizActive ? syncedQuizPhase : null,
    quizThemeCategory: currentQuestion?.category ?? null,
    finalsShowPhase: finalsShow?.phase ?? null,
    enabled: !controlsDisabled,
    autoUnlock: ADMIN_SOUNDTRACK_AUTO_UNLOCK,
    eventCode,
  });

  useEffect(() => {
    setSoundtrackUnlocked(unlocked);
  }, [setSoundtrackUnlocked, unlocked]);

  useEffect(() => {
    let cancelled = false;

    async function syncOverlay() {
      try {
        const res = await fetch(
          `/api/events/${encodeURIComponent(eventCode)}/display`,
        );
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as {
          displayOverlay?: DisplayOverlay | null;
        };
        const overlay = data.displayOverlay;
        if (!cancelled) {
          setBlackout(
            overlay?.type === "custom" && overlay.title === BLACKOUT_TITLE,
          );
        }
      } catch {
        /* keep local */
      }
    }

    void syncOverlay();
    return () => {
      cancelled = true;
    };
  }, [eventCode]);

  /** DisplayOverlay custom auto-nasconde dopo ~8s — allinea lo stato locale. */
  useEffect(() => {
    if (!blackout) return;
    const timer = window.setTimeout(() => setBlackout(false), 8000);
    return () => window.clearTimeout(timer);
  }, [blackout]);

  const runDisplay = useCallback(
    async (command: Record<string, string>, nextBlackout: boolean) => {
      if (controlsDisabled || busy) return;
      setBusy(true);
      setError(null);
      try {
        const response = await postDisplayCommand(eventCode, command, pin);
        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as {
            error?: string;
          } | null;
          const message = payload?.error ?? "Comando proiettore non riuscito.";
          if (response.status === 401 || isInvalidAnimatorPinError(message)) {
            onInvalidPin();
          }
          throw new Error(message);
        }
        setBlackout(nextBlackout);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Errore di rete.");
      } finally {
        setBusy(false);
      }
    },
    [busy, controlsDisabled, eventCode, onInvalidPin, pin],
  );

  async function toggleBlackout() {
    if (blackout) {
      await runDisplay({ type: "clear" }, false);
      return;
    }
    await runDisplay(
      { type: "custom", title: BLACKOUT_TITLE, body: "Schermo oscurato" },
      true,
    );
  }

  function handleMute() {
    if (controlsDisabled) return;
    if (!unlocked) {
      unlock();
      return;
    }
    toggleMute();
  }

  return (
    <div className="casa-w-live-stack casa-w-panic">
      <AdminButton
        type="button"
        variant={blackout ? "destructive" : "outline"}
        size="sm"
        className="w-full casa-w-panic-btn"
        disabled={controlsDisabled || busy}
        aria-pressed={blackout}
        onClick={() => void toggleBlackout()}
      >
        <MonitorOff className="size-3.5" />
        {blackout ? "Togli blackout" : "Blackout"}
      </AdminButton>

      <AdminButton
        type="button"
        variant={unlocked && muted ? "destructive" : "outline"}
        size="sm"
        className="w-full casa-w-panic-btn"
        disabled={controlsDisabled}
        aria-pressed={unlocked && muted}
        onClick={handleMute}
      >
        {unlocked && muted ? (
          <VolumeX className="size-3.5" />
        ) : (
          <Volume2 className="size-3.5" />
        )}
        {!unlocked
          ? "Avvia audio"
          : muted
            ? "Riattiva audio"
            : "Mute globale"}
      </AdminButton>

      <p className="casa-w-live-hint">
        Blackout = overlay proiettore (API display). Mute = colonna sonora su
        questo dispositivo.
      </p>

      {error ? <p className="casa-w-live-error">{error}</p> : null}
    </div>
  );
}
