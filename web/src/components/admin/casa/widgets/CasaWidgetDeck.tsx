"use client";

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import {
  sizeToPx,
  WIDGET_LABELS,
  type CasaWidgetInstance,
} from "@/lib/admin/casa-layouts";
import { CasaWidgetFrame } from "@/components/admin/casa/widgets/CasaWidgetFrame";
import {
  clampRect,
  pushApart,
  scaleToFit,
  snap,
  type Rect,
} from "@/components/admin/casa/widgets/layout-math";
import { cycleWidgetSize } from "@/components/admin/casa/widgets/widget-registry";

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
  id: string;
  pointerId: number;
  startX: number;
  startY: number;
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
  canvasWidth = 1200,
  canvasHeight = 700,
}: Props) {
  const shellRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState({ w: canvasWidth, h: canvasHeight });
  const dragRef = useRef<DragState | null>(null);
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

  const scale = scaleToFit(canvasWidth, canvasHeight, view.w, view.h);

  function othersRects(exceptId: string): Rect[] {
    return widgetsRef.current
      .filter((w) => w.id !== exceptId)
      .map((w) => {
        const { w: ww, h: hh } = sizeToPx(w.size);
        return { x: w.x, y: w.y, w: ww, h: hh };
      });
  }

  const scaleRef = useRef(scale);
  scaleRef.current = scale;
  const canvasRef = useRef({ canvasWidth, canvasHeight });
  canvasRef.current = { canvasWidth, canvasHeight };
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

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
      id: w.id,
      pointerId,
      startX: e.clientX,
      startY: e.clientY,
      origX: w.x,
      origY: w.y,
    };

    const onMove = (ev: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== ev.pointerId) return;
      const s = scaleRef.current || 1;
      const { canvasWidth: cw, canvasHeight: ch } = canvasRef.current;
      const dx = (ev.clientX - drag.startX) / s;
      const dy = (ev.clientY - drag.startY) / s;
      const target = widgetsRef.current.find((item) => item.id === drag.id);
      if (!target) return;
      const { w: ww, h: hh } = sizeToPx(target.size);
      const rawX = snap(drag.origX + dx);
      const rawY = snap(drag.origY + dy);
      const clamped = clampRect(rawX, rawY, ww, hh, cw, ch);
      const next = pushApart(
        { x: clamped.x, y: clamped.y, w: ww, h: hh },
        othersRects(drag.id),
        cw,
        ch,
      );
      onChangeRef.current(
        widgetsRef.current.map((item) =>
          item.id === drag.id ? { ...item, x: next.x, y: next.y } : item,
        ),
      );
    };

    const onUp = (ev: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== ev.pointerId) return;
      dragRef.current = null;
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

  function cycleSize(id: string) {
    onChange(
      widgets.map((w) => {
        if (w.id !== id) return w;
        const nextSize = cycleWidgetSize(w.size);
        const { w: ww, h: hh } = sizeToPx(nextSize);
        const pos = pushApart(
          { x: w.x, y: w.y, w: ww, h: hh },
          othersRects(id),
          canvasWidth,
          canvasHeight,
        );
        return { ...w, size: nextSize, x: pos.x, y: pos.y };
      }),
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

  return (
    <div
      ref={shellRef}
      className="casa-deck-shell"
      data-casa-deck=""
      data-edit={edit ? "1" : "0"}
    >
      <div
        className="casa-deck-stage"
        style={{
          width: canvasWidth,
          height: canvasHeight,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        {widgets.map((w) => {
          const { w: wPx, h: hPx } = sizeToPx(w.size);
          return (
            <div
              key={w.id}
              className="casa-deck-item"
              data-widget-id={w.id}
              data-widget-type={w.type}
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
                onRemove={() => removeWidget(w.id)}
                onCycleSize={() => cycleSize(w.id)}
                onPointerDownDrag={(e) => beginDrag(w, e)}
                onTitleClick={
                  onWidgetTitleClick
                    ? () => onWidgetTitleClick(w)
                    : undefined
                }
              >
                {renderWidget(w, { edit, wPx, hPx })}
              </CasaWidgetFrame>
            </div>
          );
        })}
      </div>
    </div>
  );
}
