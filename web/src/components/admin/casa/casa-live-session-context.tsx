"use client";

import { createContext, useContext, type Dispatch, type SetStateAction } from "react";
import type { UseAnimatorPinResult } from "@/hooks/useAnimatorPin";
import type { UseLoveRouletteSessionResult } from "@/hooks/useLoveRouletteSession";
import type { EventStats } from "@/lib/musicpro/session";
import type { LoveRouletteEvent } from "@/lib/musicpro/types";
import type { QuizSessionState } from "@/lib/musicpro/quiz-state";
import type { EventState, ExtractionMode } from "@/lib/types";

/** Body passed to `postQuizAction` (action field supplied separately by `runQuizAction`). */
export type CasaQuizActionBody = {
  action:
    | "start"
    | "advance"
    | "back"
    | "finish"
    | "setAutoplaySeconds"
    | "setAutoplayEnabled"
    | "tick"
    | "skipPhase"
    | "setPhase";
  autoplaySeconds?: number;
  questionCount?: number;
  questionSeconds?: number;
  enabled?: boolean;
  displayPhase?:
    | "start_countdown"
    | "theme_intro"
    | "question"
    | "answers"
    | "results"
    | "next_question";
};

export type CasaQuizActionResult =
  | {
      ok: true;
      quiz: QuizSessionState | null;
      runtimeState?: EventState;
    }
  | {
      ok: false;
      error: string;
      invalidPin?: boolean;
    };

export type CasaLiveSessionValue = {
  eventCode: string;
  event: LoveRouletteEvent | null;
  loading: boolean;
  loadError: string | null;
  pin: string | null;
  pinReady: boolean;
  showPinModal: boolean;
  pinError: string | null;
  pinVerifying: boolean;
  submitPin: UseAnimatorPinResult["submitPin"];
  rejectPin: UseAnimatorPinResult["rejectPin"];
  openPinModal: UseAnimatorPinResult["openPinModal"];
  runtimeState: UseLoveRouletteSessionResult["runtimeState"];
  quizState: UseLoveRouletteSessionResult["quizState"];
  voting: UseLoveRouletteSessionResult["voting"];
  finalsShow: UseLoveRouletteSessionResult["finalsShow"];
  lastReveal: UseLoveRouletteSessionResult["lastReveal"];
  syncStatus: UseLoveRouletteSessionResult["syncStatus"];
  applyQuizUpdate: UseLoveRouletteSessionResult["applyQuizUpdate"];
  applyFinalsUpdate: UseLoveRouletteSessionResult["applyFinalsUpdate"];
  stats: EventStats;
  setStats: Dispatch<SetStateAction<EventStats>>;
  refreshSessionStats: () => Promise<EventStats | null>;
  soundtrackUnlocked: boolean | null;
  setSoundtrackUnlocked: Dispatch<SetStateAction<boolean | null>>;
  extractionMode: ExtractionMode;
  setExtractionMode: Dispatch<SetStateAction<ExtractionMode>>;
  /** Controls gated until PIN is ready (mirrors admin dashboard). */
  controlsDisabled: boolean;
  /**
   * Posts a quiz action with the live animator PIN, applies quiz state on
   * success, and rejects the PIN on 401 / invalid-pin responses.
   */
  runQuizAction: (
    action: CasaQuizActionBody["action"],
    body?: Omit<CasaQuizActionBody, "action">,
  ) => Promise<CasaQuizActionResult>;
};

export const CasaLiveSessionContext =
  createContext<CasaLiveSessionValue | null>(null);

export function useCasaLiveSession(): CasaLiveSessionValue {
  const value = useContext(CasaLiveSessionContext);
  if (!value) {
    throw new Error(
      "useCasaLiveSession must be used within CasaLiveSessionProvider",
    );
  }
  return value;
}
