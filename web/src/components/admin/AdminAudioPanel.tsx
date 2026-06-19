"use client";

import { useEffect, useRef, useState } from "react";
import { Monitor, Volume2, VolumeX } from "lucide-react";
import type { EventState } from "@/lib/types";
import type { QuizSessionState } from "@/lib/musicpro/quiz-state";
import { STINGER_IDS } from "@/lib/audio/stingers";
import { useLoveRouletteSoundtrack } from "@/hooks/useLoveRouletteSoundtrack";
import { AdminPanelShell } from "@/components/admin/AdminDeckPanel";
import { Button } from "@/components/ui/button";

interface AdminAudioPanelProps {
  eventCode: string;
  runtimeState: EventState;
  quizState?: QuizSessionState | null;
  disabled?: boolean;
  variant?: "card" | "deck";
}

export function AdminAudioPanel({
  eventCode,
  runtimeState,
  quizState = null,
  disabled = false,
  variant = "card",
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
    unlock,
    toggleMute,
  } = useLoveRouletteSoundtrack({
    runtimeState,
    enabled: !disabled,
    stingerId: STINGER_IDS.quizQuestionGong,
    stingerToken: gongStingerToken,
    stingerDedupKey: gongDedupKey,
  });

  const displayUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/s/${eventCode}/display`
      : `/s/${eventCode}/display`;

  function openDisplayWindow() {
    window.open(displayUrl, "love-roulette-display", "noopener,noreferrer");
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
        {displayUrl}
      </p>

      {loadError ? (
        <p className="text-xs text-destructive">{loadError}</p>
      ) : null}
    </AdminPanelShell>
  );
}
