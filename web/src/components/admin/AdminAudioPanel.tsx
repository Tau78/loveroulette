"use client";

import { useEffect, useRef } from "react";
import { Monitor, Volume2, VolumeX, Maximize } from "lucide-react";
import type { EventState } from "@/lib/types";
import type { QuizSessionState } from "@/lib/musicpro/quiz-state";
import type { LastReveal } from "@/lib/musicpro/extraction";
import type { FinalsShowState } from "@/lib/musicpro/finals-show";
import { useLoveRouletteSoundtrack } from "@/hooks/useLoveRouletteSoundtrack";
import { useQuizGongAtCountdownEnd } from "@/hooks/useQuizGongAtCountdownEnd";
import { useCurrentQuizQuestion } from "@/hooks/useQuizQuestions";
import { useQuizPhaseSync } from "@/hooks/useQuizPhaseSync";
import { AdminPanelShell } from "@/components/admin/AdminDeckPanel";
import { Button } from "@/components/ui/button";
import { displayUrl, openProjectorWindow } from "@/lib/display/embed";

/** Admin dashboard avvia la colonna sonora al mount (autoplay policy browser). */
export const ADMIN_SOUNDTRACK_AUTO_UNLOCK = true;

interface AdminAudioPanelProps {
  eventCode: string;
  runtimeState: EventState;
  quizState?: QuizSessionState | null;
  lastReveal?: LastReveal | null;
  finalsShow?: FinalsShowState | null;
  disabled?: boolean;
  variant?: "card" | "deck";
  onUnlockedChange?: (unlocked: boolean) => void;
}

export function AdminAudioPanel({
  eventCode,
  runtimeState,
  quizState = null,
  lastReveal = null,
  finalsShow = null,
  disabled = false,
  variant = "card",
  onUnlockedChange,
}: AdminAudioPanelProps) {
  const extractionPrevUpdatedAtRef = useRef<string | null>(null);
  const prevFinalsPhaseRef = useRef<string | null>(null);

  const quizActive = runtimeState === "quiz" && Boolean(quizState);

  const { displayPhase: syncedQuizPhase } = useQuizPhaseSync({
    eventSlug: eventCode,
    quizState,
    enabled: quizActive && !disabled,
    driveTicks: false,
  });

  const { currentQuestion } = useCurrentQuizQuestion(
    eventCode,
    quizState,
    runtimeState,
  );

  const {
    unlocked,
    muted,
    currentTrackId,
    loadError,
    missingFilesWarning,
    unlock,
    toggleMute,
    playExtractionSequence,
    playWinnerSequence,
    playVotingSequence,
  } = useLoveRouletteSoundtrack({
    runtimeState,
    quizDisplayPhase: quizActive ? syncedQuizPhase : null,
    quizThemeCategory: currentQuestion?.category ?? null,
    finalsShowPhase: finalsShow?.phase ?? null,
    enabled: !disabled,
    autoUnlock: ADMIN_SOUNDTRACK_AUTO_UNLOCK,
    eventCode,
  });

  useQuizGongAtCountdownEnd({
    quizState,
    enabled:
      !disabled && unlocked && runtimeState === "quiz" && !muted,
  });

  useEffect(() => {
    if (runtimeState !== "extraction") {
      extractionPrevUpdatedAtRef.current = null;
      return;
    }

    if (!lastReveal) {
      extractionPrevUpdatedAtRef.current = null;
      return;
    }

    const previousUpdatedAt = extractionPrevUpdatedAtRef.current;

    if (previousUpdatedAt === null) {
      extractionPrevUpdatedAtRef.current = lastReveal.updatedAt;
      return;
    }

    if (previousUpdatedAt === lastReveal.updatedAt) {
      return;
    }

    extractionPrevUpdatedAtRef.current = lastReveal.updatedAt;
    playExtractionSequence(lastReveal.updatedAt);
  }, [lastReveal, playExtractionSequence, runtimeState]);

  useEffect(() => {
    const phase = finalsShow?.phase ?? null;
    const previousPhase = prevFinalsPhaseRef.current;
    prevFinalsPhaseRef.current = phase;

    if (!finalsShow) return;

    const cueKey = `${finalsShow.updatedAt}:${finalsShow.phaseStartedAt}`;

    if (phase === "voting_prep" && previousPhase !== "voting_prep") {
      playVotingSequence(cueKey, { resumeOnly: previousPhase === null });
    }

    if (
      phase === "voting" &&
      previousPhase !== "voting" &&
      previousPhase !== "voting_prep"
    ) {
      playVotingSequence(cueKey, { resumeOnly: true });
    }

    if (
      phase === "winner_spectacle" &&
      previousPhase !== "winner_spectacle" &&
      previousPhase !== null
    ) {
      playWinnerSequence(cueKey);
    }
  }, [finalsShow, playVotingSequence, playWinnerSequence]);

  useEffect(() => {
    onUnlockedChange?.(unlocked);
  }, [unlocked, onUnlockedChange]);

  const projectorUrl =
    typeof window !== "undefined"
      ? displayUrl(eventCode, { origin: window.location.origin })
      : displayUrl(eventCode);

  function openDisplayWindow() {
    openProjectorWindow(eventCode);
  }

  function openFullscreenProjector() {
    openProjectorWindow(eventCode, { present: true });
  }

  return (
    <AdminPanelShell
      variant={variant}
      title="Audio & proiettore"
      cardTitle="Audio & proiettore"
      subtitle="Audio da questo dispositivo · proiettore solo grafica"
      cardDescription="La colonna sonora esce da questo dispositivo (PC/tablet animatore). Il proiettore mostra solo la grafica."
    >
      <div className="flex flex-wrap gap-1.5">
        {!unlocked ? (
          <Button
            type="button"
            size="sm"
            disabled={disabled}
            onClick={unlock}
          >
            <Volume2 className="size-3.5" />
            Avvia colonna sonora
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={disabled}
            onClick={toggleMute}
          >
            {muted ? (
              <VolumeX className="size-3.5" />
            ) : (
              <Volume2 className="size-3.5" />
            )}
            {muted ? "Riattiva" : "Silenzia"}
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={openDisplayWindow}
        >
          <Monitor className="size-3.5" />
          Apri proiettore
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={openFullscreenProjector}
        >
          <Maximize className="size-3.5" />
          Schermo pieno
        </Button>
      </div>

      {unlocked ? (
        <p className="text-[11px] text-muted-foreground">
          Track:{" "}
          <span className="font-mono text-foreground/80">
            {currentTrackId ?? "—"}
          </span>
        </p>
      ) : null}

      <p className="text-[10px] text-muted-foreground font-mono break-all leading-relaxed">
        {projectorUrl}
      </p>

      {missingFilesWarning ? (
        <p className="text-xs text-amber-600 dark:text-amber-500">
          {missingFilesWarning}
        </p>
      ) : null}

      {loadError ? (
        <p className="text-xs text-destructive">{loadError}</p>
      ) : null}
    </AdminPanelShell>
  );
}
