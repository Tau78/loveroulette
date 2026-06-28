"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createPortal } from "react-dom";
import {
  ExternalLink,
  GripHorizontal,
  LayoutPanelTop,
  Maximize,
  PictureInPicture2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { openProjectorWindow } from "@/lib/display/embed";
import { ScaledProjectorPreview } from "@/components/admin/ScaledProjectorPreview";

interface DisplayPreviewProps {
  eventCode: string;
  className?: string;
  /** Layout broadcast: program monitor senza Card wrapper. */
  embedded?: boolean;
  /** Riempie l'area program mantenendo 16:9. */
  fill?: boolean;
}

interface PreviewLayout {
  detached: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
}

const STORAGE_PREFIX = "lr_display_preview_";
const MIN_WIDTH = 320;
const MIN_HEIGHT = 180;
const ASPECT_RATIO = 16 / 9;
/** Bar below detached iframe — controls never overlay 16:9 content. */
const DETACHED_CONTROL_BAR_HEIGHT = 36;

function storageKey(eventCode: string): string {
  return `${STORAGE_PREFIX}${eventCode.toUpperCase()}`;
}

function clampSize(width: number, height: number): { width: number; height: number } {
  const maxW = window.innerWidth * 0.9;
  const maxH = window.innerHeight * 0.9;
  return {
    width: Math.max(MIN_WIDTH, Math.min(width, maxW)),
    height: Math.max(MIN_HEIGHT, Math.min(height, maxH)),
  };
}

function clampPosition(
  x: number,
  y: number,
  width: number,
  height: number,
  extraHeight = 0,
): { x: number; y: number } {
  const margin = 24;
  const maxX = window.innerWidth - margin;
  const maxY = window.innerHeight - margin;
  const totalHeight = height + extraHeight;
  return {
    x: Math.max(-width + margin, Math.min(x, maxX)),
    y: Math.max(0, Math.min(y, maxY - totalHeight + margin)),
  };
}

function defaultFloatingLayout(): PreviewLayout {
  const width = Math.min(640, window.innerWidth * 0.5);
  const height = Math.round(width / ASPECT_RATIO);
  const { width: w, height: h } = clampSize(width, height);
  const { x, y } = clampPosition(
    Math.round((window.innerWidth - w) / 2),
    Math.round((window.innerHeight - h) / 2 - 32),
    w,
    h,
    DETACHED_CONTROL_BAR_HEIGHT,
  );
  return { detached: true, x, y, width: w, height: h };
}

function readStoredLayout(eventCode: string): PreviewLayout | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(storageKey(eventCode));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as PreviewLayout;
    if (typeof parsed.detached !== "boolean") return null;
    const { width, height } = clampSize(parsed.width ?? 640, parsed.height ?? 360);
    const { x, y } = clampPosition(parsed.x ?? 0, parsed.y ?? 0, width, height, DETACHED_CONTROL_BAR_HEIGHT);
    return { detached: parsed.detached, x, y, width, height };
  } catch {
    return null;
  }
}

function PreviewToolbar({
  detached,
  onDetach,
  onAttach,
  onOpenWindow,
  onOpenFullscreen,
  className,
}: {
  detached: boolean;
  onDetach: () => void;
  onAttach: () => void;
  onOpenWindow: () => void;
  onOpenFullscreen: () => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {detached ? (
        <Button type="button" variant="outline" size="xs" onClick={onAttach}>
          <LayoutPanelTop />
          Riattacca
        </Button>
      ) : (
        <Button type="button" variant="outline" size="xs" onClick={onDetach}>
          <PictureInPicture2 />
          Stacca
        </Button>
      )}
      <Button type="button" variant="ghost" size="xs" onClick={onOpenWindow}>
        <ExternalLink />
        Apri in finestra
      </Button>
      <Button type="button" variant="ghost" size="xs" onClick={onOpenFullscreen}>
        <Maximize />
        Schermo pieno
      </Button>
    </div>
  );
}

function PreviewIframe({
  eventCode,
  className,
}: {
  eventCode: string;
  className?: string;
}) {
  return <ScaledProjectorPreview eventCode={eventCode} className={className} />;
}

export function DisplayPreview({
  eventCode,
  className,
  embedded = false,
  fill = false,
}: DisplayPreviewProps) {
  const [layout, setLayout] = useState<PreviewLayout>({
    detached: false,
    x: 0,
    y: 0,
    width: 640,
    height: 360,
  });
  const [mounted, setMounted] = useState(false);
  const layoutRef = useRef(layout);
  layoutRef.current = layout;

  const dragRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(
    null,
  );
  const [isDragging, setIsDragging] = useState(false);
  const resizeRef = useRef<{
    startX: number;
    startY: number;
    originW: number;
    originH: number;
    maintainAspect: boolean;
  } | null>(null);

  useEffect(() => {
    const stored = readStoredLayout(eventCode);
    if (stored) setLayout(stored);
    setMounted(true);
  }, [eventCode]);

  const persistLayout = useCallback(
    (next: PreviewLayout) => {
      sessionStorage.setItem(storageKey(eventCode), JSON.stringify(next));
    },
    [eventCode],
  );

  const updateLayout = useCallback(
    (updater: (prev: PreviewLayout) => PreviewLayout) => {
      setLayout((prev) => {
        const next = updater(prev);
        persistLayout(next);
        return next;
      });
    },
    [persistLayout],
  );

  const handleOpenWindow = useCallback(() => {
    openProjectorWindow(eventCode);
  }, [eventCode]);

  const handleOpenFullscreen = useCallback(() => {
    openProjectorWindow(eventCode, { present: true });
  }, [eventCode]);

  const handleDetach = useCallback(() => {
    updateLayout((prev) => {
      if (prev.detached) return prev;
      const floating = defaultFloatingLayout();
      return { ...floating, detached: true };
    });
  }, [updateLayout]);

  const handleAttach = useCallback(() => {
    updateLayout((prev) => ({ ...prev, detached: false }));
  }, [updateLayout]);

  const handleDragPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    if ((event.target as HTMLElement).closest("[data-preview-resize]")) return;
    if ((event.target as HTMLElement).closest("button,a,input,textarea,select")) {
      return;
    }

    event.preventDefault();
    const current = layoutRef.current;
    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      originX: current.x,
      originY: current.y,
    };
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const onPointerMove = (event: PointerEvent) => {
      if (!dragRef.current) return;
      const dx = event.clientX - dragRef.current.startX;
      const dy = event.clientY - dragRef.current.startY;
      const current = layoutRef.current;
      const { x, y } = clampPosition(
        dragRef.current.originX + dx,
        dragRef.current.originY + dy,
        current.width,
        current.height,
        DETACHED_CONTROL_BAR_HEIGHT,
      );
      setLayout((prev) => ({ ...prev, x, y }));
    };

    const endDrag = () => {
      if (!dragRef.current) return;
      dragRef.current = null;
      setIsDragging(false);
      persistLayout(layoutRef.current);
    };

    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", endDrag);
    document.addEventListener("pointercancel", endDrag);

    return () => {
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerup", endDrag);
      document.removeEventListener("pointercancel", endDrag);
    };
  }, [isDragging, persistLayout]);

  const handleResizePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const current = layoutRef.current;
    resizeRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      originW: current.width,
      originH: current.height,
      maintainAspect: !event.shiftKey,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleResizePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!resizeRef.current) return;
    const dx = event.clientX - resizeRef.current.startX;
    const dy = event.clientY - resizeRef.current.startY;
    let width = resizeRef.current.originW + dx;
    let height = resizeRef.current.originH + dy;

    if (resizeRef.current.maintainAspect) {
      height = width / ASPECT_RATIO;
    }

    const clamped = clampSize(width, height);
    setLayout((prev) => ({ ...prev, ...clamped }));
  };

  const endResize = () => {
    if (resizeRef.current) {
      resizeRef.current = null;
      persistLayout(layoutRef.current);
    }
  };

  const floatingPreview =
    mounted && layout.detached ? (
      createPortal(
        <div
          className={cn(
            "fixed z-[200] flex flex-col overflow-hidden rounded-xl border border-primary/20 bg-card/95 shadow-2xl shadow-primary/10 backdrop-blur-sm",
            isDragging && "select-none",
          )}
          style={{
            left: layout.x,
            top: layout.y,
            width: layout.width,
          }}
        >
          <div
            role="toolbar"
            aria-label="Trascina per spostare l'anteprima"
            className={cn(
              "flex shrink-0 cursor-grab items-center gap-2 border-b border-primary/15 px-2 py-1.5",
              isDragging && "cursor-grabbing",
            )}
            style={{ height: DETACHED_CONTROL_BAR_HEIGHT }}
            onPointerDown={handleDragPointerDown}
          >
            <GripHorizontal className="size-4 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1 truncate text-xs font-medium text-foreground">
              Anteprima proiettore — trascina per spostare
            </span>
            <PreviewToolbar
              detached
              onDetach={handleDetach}
              onAttach={handleAttach}
              onOpenWindow={handleOpenWindow}
              onOpenFullscreen={handleOpenFullscreen}
            />
          </div>

          <div
            className={cn(
              "group relative shrink-0 overflow-hidden bg-black",
              !isDragging && "cursor-grab",
              isDragging && "cursor-grabbing",
            )}
            style={{ width: layout.width, height: layout.height }}
            onPointerDown={handleDragPointerDown}
          >
            <PreviewIframe eventCode={eventCode} className="block size-full pointer-events-none" />
            <div
              data-preview-resize
              className="absolute right-0 bottom-0 z-10 size-5 cursor-se-resize opacity-0 transition-opacity group-hover:opacity-100"
              onPointerDown={handleResizePointerDown}
              onPointerMove={handleResizePointerMove}
              onPointerUp={endResize}
              onPointerCancel={endResize}
              aria-label="Ridimensiona anteprima"
            >
              <svg
                viewBox="0 0 16 16"
                className="size-full text-white/50"
                fill="currentColor"
              >
                <path d="M14 14L14 10L10 14Z" />
                <path d="M14 14L14 6L6 14Z" opacity="0.5" />
              </svg>
            </div>
          </div>
        </div>,
        document.body,
      )
    ) : null;

  const previewBody =
    layout.detached ? (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-primary/20 bg-muted/20 px-4 py-8 text-center">
        <PictureInPicture2 className="size-6 text-primary/60" />
        <p className="text-xs text-muted-foreground">
          Anteprima staccata — fluttua sopra la dashboard.
        </p>
        <Button type="button" variant="outline" size="sm" onClick={handleAttach}>
          <LayoutPanelTop />
          Riattacca
        </Button>
      </div>
    ) : (
      <div
        className={cn(
          "relative overflow-hidden bg-black/60",
          fill
            ? "flex-1 min-h-0 w-full h-full flex items-center justify-center"
            : "rounded-lg border border-border/50",
          embedded && !fill && "rounded-b-lg rounded-t-none border-t-0",
        )}
      >
        <div
          className={cn(
            fill ? "h-full max-h-full w-auto max-w-full aspect-video" : "absolute inset-0 size-full",
          )}
        >
          <PreviewIframe
            eventCode={eventCode}
            className={fill ? "block size-full" : "absolute inset-0 size-full"}
          />
        </div>
      </div>
    );

  if (embedded) {
    return (
      <>
        <section
          className={cn(
            "flex flex-col min-h-0 overflow-hidden",
            fill ? "h-full border border-border/40 bg-black/40 rounded-md" : "rounded-lg border border-border/40 bg-card/40",
            className,
          )}
        >
          <header className="flex items-center justify-between gap-2 border-b border-border/30 bg-black/30 px-2 py-1 shrink-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary/90">
              PGM
            </p>
            {!layout.detached ? (
              <PreviewToolbar
                detached={false}
                onDetach={handleDetach}
                onAttach={handleAttach}
                onOpenWindow={handleOpenWindow}
                onOpenFullscreen={handleOpenFullscreen}
                className="scale-90 origin-right"
              />
            ) : null}
          </header>
          <div className={cn("min-h-0 flex-1 flex flex-col", fill && "overflow-hidden")}>
            {previewBody}
          </div>
        </section>
        {floatingPreview}
      </>
    );
  }

  return (
    <>
      <Card className={cn("border-border/50 bg-card/80", className)}>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <CardTitle className="text-base">Anteprima proiettore</CardTitle>
              <CardDescription>
                Live — stesso schermo che vedono in sala.
              </CardDescription>
            </div>
            {!layout.detached ? (
              <PreviewToolbar
                detached={false}
                onDetach={handleDetach}
                onAttach={handleAttach}
                onOpenWindow={handleOpenWindow}
                onOpenFullscreen={handleOpenFullscreen}
              />
            ) : null}
          </div>
        </CardHeader>
        <CardContent>
          {previewBody}
        </CardContent>
      </Card>
      {floatingPreview}
    </>
  );
}
