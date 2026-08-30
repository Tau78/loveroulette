"use client";

import { useCallback, useState } from "react";
import { AdminQuizPanel } from "@/components/admin/AdminQuizPanel";
import { AdminQuizPrepPanel } from "@/components/admin/AdminQuizPrepPanel";
import { AdminButton } from "@/components/admin/AdminButton";
import { useCasaLiveSession } from "@/components/admin/casa/casa-live-session-context";
import {
  CasaWidgetSessionGate,
  useCasaInvalidPinHandler,
} from "@/components/admin/casa/widgets/casa-widget-live";
import type { QuizSessionState } from "@/lib/musicpro/quiz-state";

/**
 * Regia quiz live — riusa AdminQuizPanel (+ prep in lobby).
 * Contesto: useCasaLiveSession (eventCode, pin, quizState, stats, applyQuizUpdate…).
 */
export function WidgetQuizRegia() {
  return (
    <CasaWidgetSessionGate>
      <WidgetQuizRegiaBody />
    </CasaWidgetSessionGate>
  );
}

function WidgetQuizRegiaBody() {
  const {
    eventCode,
    event,
    pin,
    controlsDisabled,
    quizState,
    runtimeState,
    stats,
    applyQuizUpdate,
    runQuizAction,
  } = useCasaLiveSession();
  const onInvalidPin = useCasaInvalidPinHandler();
  const [questionsRefreshKey, setQuestionsRefreshKey] = useState(0);

  const handleQuizChange = useCallback(
    (quiz: QuizSessionState | null) => {
      applyQuizUpdate(quiz);
    },
    [applyQuizUpdate],
  );

  if (runtimeState === "lobby") {
    return (
      <AdminQuizPrepPanel
        variant="deck"
        eventCode={eventCode}
        animatorPin={pin}
        quizSetup={event!.quizSetup}
        disabled={controlsDisabled}
        questionsRefreshKey={questionsRefreshKey}
        onInvalidPin={onInvalidPin}
        onQuizChange={handleQuizChange}
      />
    );
  }

  if (runtimeState === "quiz" && quizState) {
    return (
      <AdminQuizPanel
        variant="deck"
        eventCode={eventCode}
        quizState={quizState}
        animatorPin={pin}
        onlineCount={stats.onlineCount}
        participantCount={stats.participantCount}
        disabled={controlsDisabled}
        onInvalidPin={onInvalidPin}
        onQuizChange={handleQuizChange}
        hideAdvance
      />
    );
  }

  if (runtimeState === "quiz" && !quizState) {
    return (
      <div className="casa-w-live-stack">
        <p className="casa-w-live-hint">Quiz senza domande caricate.</p>
        <AdminButton
          type="button"
          size="sm"
          className="w-full"
          disabled={controlsDisabled}
          onClick={() => {
            void runQuizAction("start", {
              questionCount: event?.quizSetup.questionCount ?? undefined,
              questionSeconds: event?.quizSetup.questionSeconds ?? undefined,
              hideRankingLastN: event?.quizSetup.hideRankingLastN,
            }).then((result) => {
              if (result.ok) setQuestionsRefreshKey((k) => k + 1);
            });
          }}
        >
          Carica quiz
        </AdminButton>
      </div>
    );
  }

  return (
    <p className="casa-w-live-hint">
      Regia quiz attiva in lobby / quiz. Fase attuale: {runtimeState}.
    </p>
  );
}
