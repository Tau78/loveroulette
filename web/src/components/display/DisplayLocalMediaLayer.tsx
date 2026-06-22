"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { REGIA_IMAGE_SLIDE_MS } from "@/lib/admin/regia-local-media";
import type { RegiaLocalMediaState } from "@/lib/admin/regia-local-media";

interface DisplayLocalMediaLayerProps {
  state: RegiaLocalMediaState;
  active: boolean;
}

export function DisplayLocalMediaLayer({
  state,
  active,
}: DisplayLocalMediaLayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [index, setIndex] = useState(state.index);

  useEffect(() => {
    setIndex(state.index);
  }, [state.index, state.items]);

  const item = state.items[index] ?? null;
  const playlistLoop = state.items.length > 1;

  const goNext = useCallback(() => {
    if (!state.items.length) return;
    setIndex((current) => (current + 1) % state.items.length);
  }, [state.items.length]);

  useEffect(() => {
    if (!active || !item || item.kind !== "image") return;
    const timer = window.setTimeout(goNext, REGIA_IMAGE_SLIDE_MS);
    return () => window.clearTimeout(timer);
  }, [active, goNext, index, item]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !item || item.kind !== "video") return;

    video.muted = state.muted;
    video.loop = !playlistLoop;
    void video.play().catch(() => {});
  }, [index, item, playlistLoop, state.muted]);

  if (!active || !item) return null;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[35] overflow-hidden bg-black"
      aria-hidden
    >
      {item.kind === "video" ? (
        <video
          ref={videoRef}
          key={item.url}
          src={item.url}
          className="size-full object-cover"
          autoPlay
          playsInline
          muted={state.muted}
          loop={!playlistLoop}
          onEnded={playlistLoop ? goNext : undefined}
          onError={playlistLoop ? goNext : undefined}
        />
      ) : (
        <div className="relative size-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.url}
            alt=""
            className="size-full object-cover"
            onError={playlistLoop ? goNext : undefined}
          />
        </div>
      )}

      {state.items.length > 1 ? (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/55 px-4 py-1.5 text-xs text-white/70 backdrop-blur-sm">
          {index + 1} / {state.items.length}
          {state.muted ? " · muto" : ""}
        </div>
      ) : null}
    </div>
  );
}
