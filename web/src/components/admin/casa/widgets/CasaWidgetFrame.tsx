"use client";

import type { PointerEvent, ReactNode } from "react";
import type { CasaWidgetSize } from "@/lib/admin/casa-layouts";

type Props = {
  edit: boolean;
  title: string;
  size: CasaWidgetSize;
  collapsed?: boolean;
  resizing?: boolean;
  onRemove?: () => void;
  onToggleCollapse?: () => void;
  onPointerDownDrag?: (e: PointerEvent<HTMLElement>) => void;
  onPointerDownResize?: (e: PointerEvent<HTMLElement>) => void;
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
  collapsed = false,
  resizing = false,
  onRemove,
  onToggleCollapse,
  onPointerDownDrag,
  onPointerDownResize,
  onTitleClick,
  children,
  className,
  warning,
}: Props) {
  const classes = [
    "casa-w",
    edit && !resizing ? "casa-w-jiggle" : null,
    !edit ? "casa-card" : null,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article
      className={classes}
      data-edit={edit ? "1" : "0"}
      data-size={size}
      data-collapsed={collapsed ? "1" : "0"}
      data-resizing={resizing ? "1" : undefined}
    >
      {edit ? (
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
      ) : null}

      {edit && !collapsed ? (
        <button
          type="button"
          className="casa-w-resize"
          aria-label={`Ridimensiona ${title}`}
          title="Trascina per ridimensionare"
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onPointerDownResize?.(e);
          }}
        >
          <svg
            className="casa-w-resize-icon"
            viewBox="0 0 16 16"
            width="14"
            height="14"
            aria-hidden="true"
          >
            <path
              d="M14 6v8H6M10 14l4-4M7 14l7-7"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
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
        <div className="casa-w-head-actions">
          {warning ? (
            <span className="casa-w-warn" title={warning}>
              !
            </span>
          ) : null}
          <button
            type="button"
            className="casa-w-collapse"
            aria-label={collapsed ? `Espandi ${title}` : `Collassa ${title}`}
            aria-expanded={!collapsed}
            title={collapsed ? "Espandi" : "Collassa"}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onToggleCollapse?.();
            }}
          >
            <svg
              className="casa-w-collapse-icon"
              viewBox="0 0 12 12"
              width="10"
              height="10"
              aria-hidden="true"
            >
              {collapsed ? (
                <path d="M4 2l5 4-5 4" fill="currentColor" />
              ) : (
                <path d="M2 4l4 5 4-5" fill="currentColor" />
              )}
            </svg>
          </button>
        </div>
      </header>

      {!collapsed ? (
        <div
          className="casa-w-body"
          onPointerDown={edit ? onPointerDownDrag : undefined}
        >
          {children}
        </div>
      ) : null}
    </article>
  );
}
