"use client";

import { useRef } from "react";
import {
  FolderOpen,
  Pause,
  Play,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { useRegiaLocalMediaController } from "@/hooks/useRegiaLocalMediaController";
import { Button } from "@/components/ui/button";

interface AdminRegiaLocalMediaSectionProps {
  eventCode: string;
  disabled?: boolean;
}

export function AdminRegiaLocalMediaSection({
  eventCode,
  disabled = false,
}: AdminRegiaLocalMediaSectionProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    folderName,
    itemCount,
    playing,
    muted,
    supported,
    pickFolder,
    pickFolderFromInput,
    startPlayback,
    stopPlayback,
    toggleMute,
    clearFolder,
  } = useRegiaLocalMediaController(eventCode);

  async function handleOpenFolder() {
    if (
      typeof window !== "undefined" &&
      "showDirectoryPicker" in window
    ) {
      await pickFolder();
      return;
    }
    inputRef.current?.click();
  }

  return (
    <section className="space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary/90">
        Media locale
      </p>

      <p className="text-[10px] leading-snug text-muted-foreground">
        Seleziona una cartella sul PC e mandala in loop sul proiettore (stesso
        browser). I video partono muti per non coprire la colonna sonora del
        gioco.
      </p>

      {!supported ? (
        <p className="text-xs text-destructive">
          Browser non supportato per la sincronizzazione locale.
        </p>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        className="hidden"
        multiple
        // @ts-expect-error webkitdirectory non tipizzato
        webkitdirectory=""
        directory=""
        accept="video/*,image/*"
        disabled={disabled || !supported}
        onChange={(event) => {
          pickFolderFromInput(event.target.files);
          event.target.value = "";
        }}
      />

      <div className="flex flex-wrap gap-1.5">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled || !supported}
          onClick={() => void handleOpenFolder()}
        >
          <FolderOpen className="size-3.5" />
          Apri cartella
        </Button>

        {folderName ? (
          <>
            {!playing ? (
              <Button
                type="button"
                size="sm"
                disabled={disabled || itemCount === 0}
                onClick={startPlayback}
              >
                <Play className="size-3.5" />
                Play
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={disabled}
                onClick={stopPlayback}
              >
                <Pause className="size-3.5" />
                Stop
              </Button>
            )}

            <Button
              type="button"
              size="sm"
              variant={muted ? "secondary" : "outline"}
              disabled={disabled || itemCount === 0}
              onClick={toggleMute}
              title={
                muted
                  ? "Video muti — la colonna sonora del gioco resta udibile"
                  : "Audio dei video attivo"
              }
            >
              {muted ? (
                <VolumeX className="size-3.5" />
              ) : (
                <Volume2 className="size-3.5" />
              )}
              {muted ? "Muto" : "Audio on"}
            </Button>

            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={disabled}
              onClick={clearFolder}
            >
              <X className="size-3.5" />
              Chiudi
            </Button>
          </>
        ) : null}
      </div>

      {folderName ? (
        <p className="text-[10px] text-muted-foreground font-mono truncate">
          {folderName} · {itemCount}{" "}
          {itemCount === 1 ? "file" : "file"} ·{" "}
          {playing ? "in riproduzione" : "in pausa"} ·{" "}
          {muted ? "muto" : "audio attivo"}
        </p>
      ) : null}
    </section>
  );
}
