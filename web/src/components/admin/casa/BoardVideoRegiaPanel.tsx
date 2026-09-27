"use client";

/** Toolbar + playlist video locale per drawer / expand board. */

export type BoardVideoTrack = { name: string; url: string };

export type BoardVideoUiState = {
  list: BoardVideoTrack[];
  index: number;
  muted: boolean;
  repeat: "off" | "one" | "all";
  onScreenUrl: string | null;
};

type Props = {
  videoState: BoardVideoUiState;
  onOpenFile: () => void;
  onOpenFolder: () => void;
  onToggleRepeat: (mode: "one" | "all") => void;
  onToggleMute: () => void;
  onClearScreen: () => void;
  onTrackPointer: (track: BoardVideoTrack, index: number) => void;
  onTrackToScreen: (track: BoardVideoTrack, index: number) => void;
};

export function BoardVideoRegiaPanel({
  videoState,
  onOpenFile,
  onOpenFolder,
  onToggleRepeat,
  onToggleMute,
  onClearScreen,
  onTrackPointer,
  onTrackToScreen,
}: Props) {
  return (
    <div className="casa-board-video-regia">
      <section className="casa-regia-block space-y-1.5">
        <p className="casa-board-prep-kicker">Sorgente</p>
        <div className="casa-board-prep-row">
          <button type="button" className="casa-board-tool" onClick={onOpenFile}>
            Apri file
          </button>
          <button type="button" className="casa-board-tool" onClick={onOpenFolder}>
            Apri cartella
          </button>
          <button
            type="button"
            className="casa-board-tool"
            data-on={videoState.repeat === "one" ? "1" : undefined}
            onClick={() => onToggleRepeat("one")}
          >
            Loop 1
          </button>
          <button
            type="button"
            className="casa-board-tool"
            data-on={videoState.repeat === "all" ? "1" : undefined}
            onClick={() => onToggleRepeat("all")}
          >
            Loop all
          </button>
          <button
            type="button"
            className="casa-board-tool"
            data-on={videoState.muted ? "1" : undefined}
            onClick={onToggleMute}
          >
            {videoState.muted ? "Muto" : "Audio"}
          </button>
          <button
            type="button"
            className="casa-board-tool"
            disabled={!videoState.onScreenUrl}
            onClick={onClearScreen}
          >
            Togli dal maxi
          </button>
        </div>
      </section>

      <section className="casa-regia-block space-y-1.5">
        <p className="casa-board-prep-kicker">Playlist</p>
        {videoState.list.length ? (
          <div className="casa-board-video-playlist">
            {videoState.list.map((t, i) => (
              <button
                key={t.url}
                type="button"
                className="casa-board-video-track"
                data-on={
                  videoState.onScreenUrl === t.url || videoState.index === i
                    ? "1"
                    : undefined
                }
                onClick={() => onTrackPointer(t, i)}
                onDoubleClick={() => onTrackToScreen(t, i)}
                title="Doppio tap → proiettore"
              >
                <span className="casa-board-video-track-idx">{i + 1}</span>
                <span className="casa-board-video-track-name">{t.name}</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="casa-board-prep-hint">
            Apri file o cartella · doppio tap manda sul proiettore
          </p>
        )}
      </section>
    </div>
  );
}
