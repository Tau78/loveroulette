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
import type { QuizSessionState } from "@/lib/musicpro/quiz-state";

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
    applyFinalsUpdate,
    refreshSessionStats,
    runQuizAction,
  } = useCasaLiveSession();
  const onInvalidPin = useCasaInvalidPinHandler();
  const [startBusy, setStartBusy] = useState(false);
  const [stopBusy, setStopBusy] = useState(false);
  const [stopError, setStopError] = useState<string | null>(null);

  const handleQuizChange = useCallback(
    (quiz: QuizSessionState | null) => {
      applyQuizUpdate(quiz);
    },
    [applyQuizUpdate],
  );

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
