"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import { Maximize } from "lucide-react";
import { useFullscreen } from "@/hooks/useFullscreen";
import { cn } from "@/lib/utils";

interface DisplayProjectorFullscreenValue {
  isFullscreen: boolean;
  supported: boolean;
  toggle: () => Promise<void>;
  controlsVisible: boolean;
}

const DisplayProjectorFullscreenContext =
  createContext<DisplayProjectorFullscreenValue | null>(null);

export function useDisplayProjectorFullscreen(): DisplayProjectorFullscreenValue {
  const value = useContext(DisplayProjectorFullscreenContext);
  if (!value) {
    throw new Error(
      "useDisplayProjectorFullscreen must be used within DisplayProjectorRoot",
    );
  }
  return value;
}

interface DisplayProjectorRootProps {
  children: ReactNode;
  embedMode: boolean;
  presentMode: boolean;
  className?: string;
}

function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(
    target.closest("button,a,input,textarea,select,[role='button']"),
  );
}

export function DisplayProjectorRoot({
  children,
  embedMode,
  presentMode,
  className,
}: DisplayProjectorRootProps) {
  const { containerRef, isFullscreen, supported, enter, toggle } = useFullscreen({
    storageKey: "lr_display_fullscreen_pref",
    enableShortcut: !embedMode,
    alwaysListenShortcut: !embedMode,
  });

  const [showPresentOverlay, setShowPresentOverlay] = useState(
    presentMode && !embedMode,
  );
  const [controlsVisible, setControlsVisible] = useState(true);

  useEffect(() => {
    if (embedMode || !isFullscreen) {
      setControlsVisible(true);
      return;
    }

    setControlsVisible(true);
    let timer = window.setTimeout(() => setControlsVisible(false), 3000);

    const onMove = () => {
      setControlsVisible(true);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setControlsVisible(false), 3000);
    };

    document.addEventListener("mousemove", onMove);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("mousemove", onMove);
    };
  }, [embedMode, isFullscreen]);

  const handlePresentStart = useCallback(() => {
    setShowPresentOverlay(false);
    void enter();
  }, [enter]);

  const handleDoubleClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (embedMode || !supported || isInteractiveTarget(event.target)) return;
      event.preventDefault();
      void toggle();
    },
    [embedMode, supported, toggle],
  );

  const contextValue: DisplayProjectorFullscreenValue = {
    isFullscreen,
    supported: supported && !embedMode,
    toggle,
    controlsVisible,
  };

  return (
    <DisplayProjectorFullscreenContext.Provider value={contextValue}>
      <div
        ref={containerRef}
        data-display-embed={embedMode ? "1" : undefined}
        data-display-fullscreen={isFullscreen || undefined}
        onDoubleClick={handleDoubleClick}
        className={cn(
          className,
          "outline-none",
          isFullscreen &&
            "fixed inset-0 z-[9999] h-full max-h-none w-full max-w-none bg-black",
        )}
      >
        {children}

        {showPresentOverlay ? (
          <button
            type="button"
            className="absolute inset-0 z-[10000] flex flex-col items-center justify-center gap-4 bg-black/85 px-8 text-center backdrop-blur-sm"
            onClick={handlePresentStart}
          >
            <Maximize className="size-14 text-white/90" aria-hidden />
            <span className="text-2xl font-display text-white md:text-3xl">
              Clicca per schermo intero
            </span>
            <span className="max-w-md text-sm text-white/60 md:text-base">
              Lo schermo occuperà tutta l&apos;area disponibile. Premi Esc o F per uscire.
            </span>
          </button>
        ) : null}
      </div>
    </DisplayProjectorFullscreenContext.Provider>
  );
}
