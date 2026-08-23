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
import { AdminButton } from "@/components/admin/AdminButton";
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
    <section
      className={cn("space-y-2 rounded-md border border-border/50 bg-muted/20 p-2.5", className)}
      title="Controlli audio e video per la prova finale in corso"
    >
      {challengeId === "dance" ? (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1.5" title="Brano da ballo o mix automatico 3–4 tracce">
            {danceOptions.map((track) => (
              <AdminButton
                key={track.id}
                type="button"
                size="xs"
                variant="outline"
                disabled={disabled || !manifestReady}
                onClick={() => void playDanceTrack(track.manifestTrackId)}
              >
                <Music2 className="size-3" />
                {track.label}
              </AdminButton>
            ))}
            <AdminButton
              type="button"
              size="xs"
              disabled={disabled || !manifestReady}
              onClick={() => void playDanceMix()}
            >
              <Sparkles className="size-3" />
              Mix 3/4 balli
            </AdminButton>
          </div>
        </div>
      ) : null}

      {challengeId === "declaration" ? (
        <div className="space-y-2">
          <AdminButton
            type="button"
            size="xs"
            disabled={disabled || !manifestReady}
            title="Sottofondo romantico + mazzo fiori Love Roulette a tutto schermo"
            onClick={() => void playRomanticBed()}
          >
            <Music2 className="size-3" />
            Avvia sottofondo romantico
          </AdminButton>
        </div>
      ) : null}

      {challengeId === "kiss" ? (
        <div className="space-y-2">
          <AdminButton
            type="button"
            size="xs"
            disabled={disabled}
            title="Baci famosi sul proiettore — MP4 in public/finals/kiss/"
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
          </AdminButton>
        </div>
      ) : null}

      {challengeId === "kamasutra" ? (
        <div className="space-y-2">
          <AdminButton
            type="button"
            size="xs"
            disabled={disabled}
            title="Slideshow posizioni — immagini in public/finals/kamasutra/"
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
          </AdminButton>
        </div>
      ) : null}

      <AdminButton
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
      </AdminButton>
    </section>
  );
}
