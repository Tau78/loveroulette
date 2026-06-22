"use client";

import { Music2, Sparkles, StopCircle, Video } from "lucide-react";
import type { ChallengeId } from "@/lib/types";
import {
  KAMASUTRA_PRESET_MEDIA,
  KISS_PRESET_MEDIA,
} from "@/lib/display/challenge-regia";
import {
  playPresetMediaPlaylist,
  stopPresetMedia,
} from "@/lib/admin/regia-local-media";
import { setChallengeRegiaBedActive } from "@/lib/admin/challenge-regia-bed";
import { useChallengeRegiaAudio } from "@/hooks/useChallengeRegiaAudio";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AdminChallengeRegiaProps {
  eventCode: string;
  challengeId: ChallengeId | null;
  disabled?: boolean;
  className?: string;
}

export function AdminChallengeRegia({
  eventCode,
  challengeId,
  disabled = false,
  className,
}: AdminChallengeRegiaProps) {
  const {
    manifestReady,
    danceOptions,
    playRomanticBed,
    playDanceTrack,
    playDanceMix,
    stop,
  } = useChallengeRegiaAudio(eventCode);

  if (!challengeId) return null;

  return (
    <section className={cn("space-y-2 rounded-md border border-border/50 bg-muted/20 p-2.5", className)}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary/90">
        Regia prova
      </p>

      {challengeId === "dance" ? (
        <div className="space-y-2">
          <p className="text-[10px] text-muted-foreground leading-snug">
            Avvia un brano da ballo o il mix automatico (3–4 tracce in sequenza).
          </p>
          <div className="flex flex-wrap gap-1.5">
            {danceOptions.map((track) => (
              <Button
                key={track.id}
                type="button"
                size="xs"
                variant="outline"
                disabled={disabled || !manifestReady}
                onClick={() => void playDanceTrack(track.manifestTrackId)}
              >
                <Music2 className="size-3" />
                {track.label}
              </Button>
            ))}
            <Button
              type="button"
              size="xs"
              disabled={disabled || !manifestReady}
              onClick={() => void playDanceMix()}
            >
              <Sparkles className="size-3" />
              Mix 3/4 balli
            </Button>
          </div>
        </div>
      ) : null}

      {challengeId === "declaration" ? (
        <div className="space-y-2">
          <p className="text-[10px] text-muted-foreground leading-snug">
            Sottofondo romantico + mazzo fiori Love Roulette a tutto schermo sul
            proiettore.
          </p>
          <Button
            type="button"
            size="xs"
            disabled={disabled || !manifestReady}
            onClick={() => void playRomanticBed()}
          >
            <Music2 className="size-3" />
            Avvia sottofondo romantico
          </Button>
        </div>
      ) : null}

      {challengeId === "kiss" ? (
        <div className="space-y-2">
          <p className="text-[10px] text-muted-foreground leading-snug">
            Riproduci i baci famosi sul proiettore. Metti i file MP4 in{" "}
            <code className="font-mono text-[9px]">public/finals/kiss/</code>.
          </p>
          <Button
            type="button"
            size="xs"
            disabled={disabled}
            onClick={() => {
              setChallengeRegiaBedActive(eventCode, true);
              playPresetMediaPlaylist(
                eventCode,
                "Baci famosi",
                KISS_PRESET_MEDIA,
                { muted: false },
              );
            }}
          >
            <Video className="size-3" />
            Mostra baci famosi
          </Button>
        </div>
      ) : null}

      {challengeId === "kamasutra" ? (
        <div className="space-y-2">
          <p className="text-[10px] text-muted-foreground leading-snug">
            Slideshow posizioni sul proiettore. Immagini in{" "}
            <code className="font-mono text-[9px]">public/finals/kamasutra/</code>.
          </p>
          <Button
            type="button"
            size="xs"
            disabled={disabled}
            onClick={() => {
              setChallengeRegiaBedActive(eventCode, true);
              playPresetMediaPlaylist(
                eventCode,
                "Posizioni kamasutra",
                KAMASUTRA_PRESET_MEDIA,
              );
            }}
          >
            <Video className="size-3" />
            Mostra immagini
          </Button>
        </div>
      ) : null}

      <Button
        type="button"
        size="xs"
        variant="ghost"
        className="w-full"
        disabled={disabled}
        onClick={() => {
          stop();
          stopPresetMedia(eventCode);
          setChallengeRegiaBedActive(eventCode, false);
        }}
      >
        <StopCircle className="size-3" />
        Stop audio / video prova
      </Button>
    </section>
  );
}
