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
import { AdminButton } from "@/components/admin/AdminButton";

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
    <section
      className="casa-regia-block space-y-1.5"
      title="Seleziona cartella sul PC e mandala in loop sul proiettore (stesso browser). Video muti per non coprire la colonna sonora."
    >
      <p className="casa-board-prep-kicker">Media locale</p>
      {!supported ? (
        <p className="casa-board-prep-hint text-destructive">
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

      <div
        className="casa-board-prep-row"
        title={
          folderName
            ? `${folderName} · ${itemCount} file · ${playing ? "in riproduzione" : "in pausa"} · ${muted ? "muto" : "audio attivo"}`
            : undefined
        }
      >
        <AdminButton
          type="button"
          size="sm"
          variant="outline"
          className="h-8"
          disabled={disabled || !supported}
          onClick={() => void handleOpenFolder()}
        >
          <FolderOpen className="size-3.5" />
          Apri cartella
        </AdminButton>

        {folderName ? (
          <>
            {!playing ? (
              <AdminButton
                type="button"
                size="sm"
                className="h-8"
                disabled={disabled || itemCount === 0}
                onClick={startPlayback}
              >
                <Play className="size-3.5" />
                Play
              </AdminButton>
            ) : (
              <AdminButton
                type="button"
                size="sm"
                variant="outline"
                className="h-8"
                disabled={disabled}
                onClick={stopPlayback}
              >
                <Pause className="size-3.5" />
                Stop
              </AdminButton>
            )}

            <AdminButton
              type="button"
              size="sm"
              variant={muted ? "secondary" : "outline"}
              className="h-8"
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
            </AdminButton>

            <AdminButton
              type="button"
              size="sm"
              variant="ghost"
              className="h-8"
              disabled={disabled}
              onClick={clearFolder}
            >
              <X className="size-3.5" />
              Chiudi
            </AdminButton>
            <span className="casa-board-prep-hint truncate max-w-[12rem]">
              {folderName} · {itemCount}
            </span>
          </>
        ) : null}
      </div>
    </section>
  );
}
