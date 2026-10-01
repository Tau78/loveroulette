"use client";

import { useRef, useState } from "react";
import { DisplaySiglaAudioStage } from "@/components/display/DisplaySiglaAudioStage";
import { SIGLA_SRC } from "@/lib/admin/casa-slides";

interface DisplaySiglaStageProps {
  /** Anteprima embed: video muto (l’audio resta sullo schermo esterno). */
  muted?: boolean;
  onEnded?: () => void;
}

/**
 * Sigla fullscreen sul proiettore — stessa asset della plancia.
 * Fallback grafico se il file manca / non si riproduce.
 */
export function DisplaySiglaStage({
  muted = false,
  onEnded,
}: DisplaySiglaStageProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [fallback, setFallback] = useState(false);

  if (fallback) {
    return <DisplaySiglaAudioStage />;
  }

  return (
    <div className="absolute inset-0 z-[36] bg-black" aria-label="Sigla">
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video
        ref={videoRef}
        key={SIGLA_SRC}
        className="size-full object-cover"
        src={SIGLA_SRC}
        playsInline
        autoPlay
        muted={muted}
        preload="auto"
        onEnded={onEnded}
        onError={() => setFallback(true)}
        onLoadedData={() => {
          const el = videoRef.current;
          if (!el) return;
          el.muted = muted;
          void el.play().catch(() => setFallback(true));
        }}
      />
    </div>
  );
}
