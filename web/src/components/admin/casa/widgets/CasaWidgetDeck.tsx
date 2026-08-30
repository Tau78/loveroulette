"use client";

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  nearestSize,
  widgetLayoutPx,
  widgetPx,
  WIDGET_LABELS,
  WIDGET_MIN_H,
  WIDGET_MIN_W,
  type CasaWidgetInstance,
} from "@/lib/admin/casa-layouts";
import { CasaWidgetFrame } from "@/components/admin/casa/widgets/CasaWidgetFrame";
import {
  clampRect,
  clampResizeNoOverlap,
  FREE_PIXEL_GRID,
  magnetSnapPos,
  overlapsAny,
  pushApart,
  canvasToFillView,
  type Rect,
} from "@/components/admin/casa/widgets/layout-math";

type Props = {
  edit: boolean;
  widgets: CasaWidgetInstance[];
  onChange: (widgets: CasaWidgetInstance[]) => void;
  renderWidget: (
    w: CasaWidgetInstance,
    ctx: { edit: boolean; wPx: number; hPx: number },
  ) => ReactNode;
  onWidgetTitleClick?: (w: CasaWidgetInstance) => void;
  onAddRequest?: () => void;
  canvasWidth?: number;
  canvasHeight?: number;
};

type DragState = {
  kind: "move";
  id: string;
  pointerId: number;
  startX: number;
  startY: number;
  origX: number;
  origY: number;
};

type ResizeState = {
  kind: "resize";
  id: string;
  pointerId: number;
  startX: number;
  startY: number;
  origW: number;
  origH: number;
  origX: number;
  origY: number;
};

export function CasaWidgetDeck({
  edit,
  widgets,
  onChange,
  renderWidget,
  onWidgetTitleClick,
  onAddRequest,
  canvasWidth = CANVAS_WIDTH,
  canvasHeight = CANVAS_HEIGHT,
}: Props) {
  const shellRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState({ w: canvasWidth, h: canvasHeight });
  const [resizingId, setResizingId] = useState<string | null>(null);
  const dragRef = useRef<DragState | ResizeState | null>(null);
  const widgetsRef = useRef(widgets);
  widgetsRef.current = widgets;

  useEffect(() => {
    const el = shellRef.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      setView({ w: r.width, h: r.height });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const filled = canvasToFillView(canvasWidth, canvasHeight, view.w, view.h);
  const boardW = filled.canvasW;
  const boardH = filled.canvasH;
  const scale = filled.scale;

  function othersRects(exceptId: string): Rect[] {
    return widgetsRef.current
      .filter((w) => w.id !== exceptId)
      .map((w) => {
        const px = widgetLayoutPx(w);
        return { x: w.x, y: w.y, w: px.w, h: px.h };
      });
  }

  const scaleRef = useRef(scale);
  scaleRef.current = scale;
  const canvasRef = useRef({ canvasWidth: boardW, canvasHeight: boardH });
  canvasRef.current = { canvasWidth: boardW, canvasHeight: boardH };
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  function endPointerSession() {
    dragRef.current = null;
    setResizingId(null);
  }

  function beginDrag(
    w: CasaWidgetInstance,
    e: ReactPointerEvent<HTMLElement>,
  ) {
    if (!edit) return;
    if ((e.target as HTMLElement).closest("button")) return;
    e.preventDefault();
    e.stopPropagation();
    const pointerId = e.pointerId;
    dragRef.current = {
      kind: "move",
      id: w.id,
      pointerId,
      startX: e.clientX,
      startY: e.clientY,
      origX: w.x,
      origY: w.y,
    };

    const onMove = (ev: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || drag.kind !== "move" || drag.pointerId !== ev.pointerId) {
        return;
      }
      const s = scaleRef.current || 1;
      const { canvasWidth: cw, canvasHeight: ch } = canvasRef.current;
      const dx = (ev.clientX - drag.startX) / s;
      const dy = (ev.clientY - drag.startY) / s;
      const target = widgetsRef.current.find((item) => item.id === drag.id);
      if (!target) return;
      const px = widgetLayoutPx(target);
      const others = othersRects(drag.id);
      const magnet = magnetSnapPos(
        drag.origX + dx,
        drag.origY + dy,
        px.w,
        px.h,
        cw,
        ch,
        others,
      );
      const clamped = clampRect(magnet.x, magnet.y, px.w, px.h, cw, ch);
      const next = pushApart(
        { x: clamped.x, y: clamped.y, w: px.w, h: px.h },
        others,
        cw,
        ch,
        FREE_PIXEL_GRID,
      );
      // Overlap forbidden while dragging — skip updates that can't land free.
      if (!next) return;
      onChangeRef.current(
        widgetsRef.current.map((item) =>
          item.id === drag.id ? { ...item, x: next.x, y: next.y } : item,
        ),
      );
    };

    const onUp = (ev: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== ev.pointerId) return;
      endPointerSession();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  }

  function beginResize(
    w: CasaWidgetInstance,
    e: ReactPointerEvent<HTMLElement>,
  ) {
    if (!edit) return;
    e.preventDefault();
    e.stopPropagation();
    const px = widgetPx(w);
    const pointerId = e.pointerId;
    setResizingId(w.id);
    dragRef.current = {
      kind: "resize",
      id: w.id,
      pointerId,
      startX: e.clientX,
      startY: e.clientY,
      origW: px.w,
      origH: px.h,
      origX: w.x,
      origY: w.y,
    };

    try {
      e.currentTarget.setPointerCapture(pointerId);
    } catch {
      /* ignore */
    }

    const onMove = (ev: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || drag.kind !== "resize" || drag.pointerId !== ev.pointerId) {
        return;
      }
      const s = scaleRef.current || 1;
      const { canvasWidth: cw, canvasHeight: ch } = canvasRef.current;
      const dx = (ev.clientX - drag.startX) / s;
      const dy = (ev.clientY - drag.startY) / s;
      const others = othersRects(drag.id);
      const sized = clampResizeNoOverlap(
        drag.origX,
        drag.origY,
        drag.origW + dx,
        drag.origH + dy,
        cw,
        ch,
        WIDGET_MIN_W,
        WIDGET_MIN_H,
        others,
        FREE_PIXEL_GRID,
      );
      // Refuse a size that still overlaps (e.g. already nested after expand).
      if (overlapsAny({ x: drag.origX, y: drag.origY, w: sized.w, h: sized.h }, others)) {
        return;
      }
      onChangeRef.current(
        widgetsRef.current.map((item) =>
          item.id === drag.id
            ? {
                ...item,
                w: sized.w,
                h: sized.h,
                size: nearestSize(sized.w, sized.h),
              }
            : item,
        ),
      );
    };

    const onUp = (ev: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== ev.pointerId) return;
      endPointerSession();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  }

  function removeWidget(id: string) {
    onChange(widgets.filter((w) => w.id !== id));
  }

  function toggleCollapse(id: string) {
    // Expanding from collapse MAY overlap — intentional exception.
    // Collapsing never creates overlap. Drag/resize remain no-overlap.
    onChange(
      widgets.map((w) =>
        w.id === id ? { ...w, collapsed: !w.collapsed } : w,
      ),
    );
  }

  if (widgets.length === 0) {
    return (
      <div
        ref={shellRef}
        className="casa-deck-shell"
        data-casa-deck=""
        data-edit={edit ? "1" : "0"}
        data-empty="1"
      >
        <button
          type="button"
          className="casa-deck-empty"
          onClick={() => onAddRequest?.()}
        >
          Aggiungi widget
        </button>
      </div>
    );
  }

  const stageW = boardW * scale;
  const stageH = boardH * scale;

  return (
    <div
      ref={shellRef}
      className="casa-deck-shell"
      data-casa-deck=""
      data-edit={edit ? "1" : "0"}
    >
      <div
        className="casa-deck-scale-wrap"
        style={{ width: stageW, height: stageH }}
      >
        <div
          className="casa-deck-stage"
          style={{
            width: boardW,
            height: boardH,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          {widgets.map((w) => {
            const full = widgetPx(w);
            const { w: wPx, h: hPx } = widgetLayoutPx(w);
            const isResizing = resizingId === w.id;
            return (
              <div
                key={w.id}
                className="casa-deck-item"
                data-widget-id={w.id}
                data-widget-type={w.type}
                data-collapsed={w.collapsed ? "1" : undefined}
                data-resizing={isResizing ? "1" : undefined}
                style={{
                  position: "absolute",
                  left: w.x,
                  top: w.y,
                  width: wPx,
                  height: hPx,
                }}
              >
                <CasaWidgetFrame
                  edit={edit}
                  title={WIDGET_LABELS[w.type]}
                  size={w.size}
                  collapsed={Boolean(w.collapsed)}
                  hideHeader={w.type === "avanti"}
                  resizing={isResizing}
                  onRemove={() => removeWidget(w.id)}
                  onToggleCollapse={() => toggleCollapse(w.id)}
                  onPointerDownDrag={(e) => beginDrag(w, e)}
                  onPointerDownResize={(e) => beginResize(w, e)}
                  onTitleClick={
                    onWidgetTitleClick
                      ? () => onWidgetTitleClick(w)
                      : undefined
                  }
                >
                  {renderWidget(w, { edit, wPx: full.w, hPx: full.h })}
                </CasaWidgetFrame>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
