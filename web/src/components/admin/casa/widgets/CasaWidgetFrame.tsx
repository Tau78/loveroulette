"use client";

import type { PointerEvent, ReactNode } from "react";
import type { CasaWidgetSize } from "@/lib/admin/casa-layouts";

type Props = {
  edit: boolean;
  title: string;
  size: CasaWidgetSize;
  onRemove?: () => void;
  onCycleSize?: () => void;
  onPointerDownDrag?: (e: PointerEvent<HTMLElement>) => void;
  /** Live mode: tap title to open expand panel */
  onTitleClick?: () => void;
  children: ReactNode;
  className?: string;
  warning?: string;
};

export function CasaWidgetFrame({
  edit,
  title,
  size,
  onRemove,
  onCycleSize,
  onPointerDownDrag,
  onTitleClick,
  children,
  className,
  warning,
}: Props) {
  const classes = [
    "casa-w",
    edit ? "casa-w-jiggle" : "casa-card",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article
      className={classes}
      data-edit={edit ? "1" : "0"}
      data-size={size}
    >
      {edit ? (
        <>
          <button
            type="button"
            className="casa-w-remove"
            aria-label={`Rimuovi ${title}`}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onRemove?.();
            }}
          >
            −
          </button>
          <button
            type="button"
            className="casa-w-size"
            aria-label={`Taglia ${size}, clic per cambiare`}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onCycleSize?.();
            }}
          >
            {size}
          </button>
        </>
      ) : null}

      <header
        className="casa-w-head"
        onPointerDown={edit ? onPointerDownDrag : undefined}
      >
        {onTitleClick && !edit ? (
          <button
            type="button"
            className="casa-w-title casa-w-title-btn"
            onClick={onTitleClick}
          >
            {title}
          </button>
        ) : (
          <span className="casa-w-title">{title}</span>
        )}
        {warning ? (
          <span className="casa-w-warn" title={warning}>
            !
          </span>
        ) : null}
      </header>

      <div
        className="casa-w-body"
        onPointerDown={edit ? onPointerDownDrag : undefined}
      >
        {children}
      </div>
    </article>
  );
}
