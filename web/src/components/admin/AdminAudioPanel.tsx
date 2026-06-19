"use client";

import { useEffect, useRef, useState } from "react";
import { Monitor, Volume2, VolumeX, Maximize } from "lucide-react";
import type { EventState } from "@/lib/types";
import type { QuizSessionState } from "@/lib/musicpro/quiz-state";
import { STINGER_IDS } from "@/lib/audio/stingers";
import { useLoveRouletteSoundtrack } from "@/hooks/useLoveRouletteSoundtrack";
import { AdminPanelShell } from "@/components/admin/AdminDeckPanel";
import { Button } from "@/components/ui/button";
import { displayUrl, openProjectorWindow } from "@/lib/display/embed";

/** Admin dashboard avvia la colonna sonora al mount (autoplay policy browser). */
export const ADMIN_SOUNDTRACK_AUTO_UNLOCK = true;

interface AdminAudioPanelProps {
  eventCode: string;
  runtimeState: EventState;
  quizState?: QuizSessionState | null;
  disabled?: boolean;
  variant?: "card" | "deck";
  onUnlockedChange?: (unlocked: boolean) => void;
}

export function AdminAudioPanel({
  eventCode,
  runtimeState,
  quizState = null,
  disabled = false,
  variant = "card",
  onUnlockedChange,
}: AdminAudioPanelProps) {
  const [gongStingerToken, setGongStingerToken] = useState(0);
  const gongPlayedForRef = useRef<string | null>(null);

  useEffect(() => {
    if (runtimeState !== "quiz" || !quizState?.gongCueKey) {
      return;
    }

    if (gongPlayedForRef.current === quizState.gongCueKey) return;

    gongPlayedForRef.current = quizState.gongCueKey;
    setGongStingerToken((token) => token + 1);
  }, [quizState?.gongCueKey, runtimeState]);

  const gongDedupKey =
    runtimeState === "quiz" && quizState?.gongCueKey
      ? quizState.gongCueKey
      : null;

  const {
    unlocked,
    muted,
    currentTrackId,
    loadError,
    missingFilesWarning,
    unlock,
    toggleMute,
  } = useLoveRouletteSoundtrack({
    runtimeState,
    enabled: !disabled,
    autoUnlock: ADMIN_SOUNDTRACK_AUTO_UNLOCK,
    stingerId: STINGER_IDS.quizQuestionGong,
    stingerToken: gongStingerToken,
    stingerDedupKey: gongDedupKey,
  });

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
