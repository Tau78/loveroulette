"use client";

import { useCallback, useState } from "react";
import { Square } from "lucide-react";
import { AdminTransportBar } from "@/components/admin/AdminTransportBar";
import { AdminButton } from "@/components/admin/AdminButton";
import { useCasaLiveSession } from "@/components/admin/casa/casa-live-session-context";
import {
  CasaWidgetSessionGate,
  useCasaInvalidPinHandler,
} from "@/components/admin/casa/widgets/casa-widget-live";
import { postSpecialTrialAction } from "@/lib/admin/animator-api";
import type { QuizSessionState } from "@/lib/musicpro/quiz-state";
import type { EventState } from "@/lib/types";

/**
 * Transport live — AdminTransportBar (GO fase) + STOP (spegne Auto quiz).
 * Contesto: runtimeState, quizState, finalsShow, voting, extractionMode, pin…
 */
export function WidgetTransport({
  variant = "panel",
}: {
  variant?: "panel" | "go";
}) {
  return (
    <CasaWidgetSessionGate>
      <WidgetTransportBody variant={variant} />
    </CasaWidgetSessionGate>
  );
}

function WidgetTransportBody({ variant }: { variant: "panel" | "go" }) {
  const {
    eventCode,
    event,
    pin,
    controlsDisabled,
    quizState,
    runtimeState,
    finalsShow,
    voting,
    stats,
    extractionMode,
    setExtractionMode,
    applyQuizUpdate,
    applyRuntimeState,
    applyLastReveal,
    applyFinalsUpdate,
    applySpecialTrialUpdate,
    specialTrial,
    refreshSessionStats,
    runQuizAction,
  } = useCasaLiveSession();
  const onInvalidPin = useCasaInvalidPinHandler();
  const [startBusy, setStartBusy] = useState(false);
  const [stopBusy, setStopBusy] = useState(false);
  const [stopError, setStopError] = useState<string | null>(null);
  const [trialBusy, setTrialBusy] = useState(false);

  const handleQuizChange = useCallback(
    (quiz: QuizSessionState | null, nextRuntimeState?: EventState) => {
      applyQuizUpdate(quiz, nextRuntimeState);
    },
    [applyQuizUpdate],
  );

  const advanceSpecialTrial = useCallback(async () => {
    if (controlsDisabled || trialBusy) return;
    if (
      specialTrial?.status !== "closing" &&
      specialTrial?.status !== "results"
    ) {
      return;
    }
    setTrialBusy(true);
    try {
      const res = await postSpecialTrialAction(
        eventCode,
        { action: "advance" },
        pin,
      );
      const data = (await res.json().catch(() => null)) as {
        error?: string;
        specialTrial?: typeof specialTrial;
        quiz?: QuizSessionState | null;
      } | null;
      if (!res.ok) {
        if (res.status === 403) onInvalidPin();
        throw new Error(data?.error ?? "Avanzamento prova fallito.");
      }
      applySpecialTrialUpdate(data?.specialTrial ?? null, data?.quiz);
    } finally {
      setTrialBusy(false);
    }
  }, [
    applySpecialTrialUpdate,
    controlsDisabled,
    eventCode,
    onInvalidPin,
    pin,
    specialTrial?.status,
    trialBusy,
  ]);

  const startQuiz = useCallback(async () => {
    if (controlsDisabled || startBusy) return;
    setStartBusy(true);
    try {
      // Ensure Generatore auto-import runs before start.
      await fetch(`/api/events/${encodeURIComponent(eventCode)}/questions`);
      const result = await runQuizAction("start", {
        questionCount: event?.quizSetup.questionCount ?? undefined,
        questionSeconds: event?.quizSetup.questionSeconds ?? undefined,
        hideRankingLastN: event?.quizSetup.hideRankingLastN,
        rankingEveryN: event?.quizSetup.rankingEveryN,
      });
      if (!result.ok) {
        throw new Error(result.error);
      }
      // Hold fasi = AVANTI (autoplay resta scelta esplicita / STOP).
    } finally {
      setStartBusy(false);
    }
  }, [
    controlsDisabled,
    event?.quizSetup,
    eventCode,
    runQuizAction,
    startBusy,
  ]);

  const stopAutoplay = useCallback(async () => {
    if (controlsDisabled || stopBusy) return;
    if (!quizState?.autoplayEnabled) {
      setStopError(null);
      return;
    }
    setStopBusy(true);
    setStopError(null);
    try {
      const result = await runQuizAction("setAutoplayEnabled", {
        enabled: false,
      });
      if (!result.ok) {
        setStopError(result.error);
      }
    } finally {
      setStopBusy(false);
    }
  }, [controlsDisabled, quizState?.autoplayEnabled, runQuizAction, stopBusy]);

  const autoplayOn = quizState?.autoplayEnabled === true;

  // Prova speciale: AVANTI guida FINE PROVA → risultati → quiz.
  if (
    specialTrial &&
    (specialTrial.status === "closing" || specialTrial.status === "results")
  ) {
    const label =
      specialTrial.status === "closing"
        ? trialBusy
          ? "…"
          : "Risultati"
        : trialBusy
          ? "…"
          : "Avanti";
    return (
      <button
        type="button"
        className="casa-go"
        disabled={controlsDisabled || trialBusy}
        onClick={() => void advanceSpecialTrial()}
      >
        {label}
      </button>
    );
  }

  if (specialTrial?.status === "running") {
    return (
      <button type="button" className="casa-go" disabled aria-disabled>
        Prova in corso
      </button>
    );
  }

  if (specialTrial?.status === "setup") {
    return (
      <button type="button" className="casa-go" disabled aria-disabled>
        Setup prova
      </button>
    );
  }

  const bar = (
      <AdminTransportBar
        eventCode={eventCode}
        runtimeState={runtimeState}
        animatorPin={pin}
        disabled={controlsDisabled || startBusy}
        quizState={quizState}
        finalsShow={finalsShow}
        voting={voting}
        pairProgress={stats.pairProgress}
        extractionMode={extractionMode}
        onExtractionModeChange={setExtractionMode}
        onInvalidPin={onInvalidPin}
        onQuizChange={handleQuizChange}
        onRuntimeStateChange={applyRuntimeState}
        onLastRevealChange={applyLastReveal}
        onFinalsChange={applyFinalsUpdate}
        onRefreshProgress={refreshSessionStats}
        onStartQuiz={
          runtimeState === "lobby" ? () => startQuiz() : undefined
        }
        startQuizDisabled={startBusy || !event}
        variant={variant}
        className="casa-w-live-transport"
      />
  );

  if (variant === "go") {
    return bar;
  }

  return (
    <div className="casa-w-live-stack">
      {bar}

      <AdminButton
        type="button"
        variant={autoplayOn ? "destructive" : "outline"}
        size="sm"
        className="w-full casa-w-live-stop"
        disabled={controlsDisabled || stopBusy || !autoplayOn}
        title={
          autoplayOn
            ? "Ferma Auto quiz (STOP)"
            : "STOP attivo solo con Auto quiz acceso"
        }
        onClick={() => void stopAutoplay()}
      >
        <Square className="size-3.5 fill-current" />
        STOP
      </AdminButton>

      {stopError ? (
        <p className="casa-w-live-error" title={stopError}>
          {stopError}
        </p>
      ) : null}
    </div>
  );
}
