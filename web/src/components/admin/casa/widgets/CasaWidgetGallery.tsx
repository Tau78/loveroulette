"use client";

import { useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  UNIQUE_WIDGET_TYPES,
  type CasaWidgetType,
} from "@/lib/admin/casa-layouts";
import { WIDGET_REGISTRY } from "@/components/admin/casa/widgets/widget-registry";

type Props = {
  open: boolean;
  onClose: () => void;
  present: CasaWidgetType[];
  onAdd: (type: CasaWidgetType) => void;
};

function isTaken(
  type: CasaWidgetType,
  presentSet: Set<CasaWidgetType>,
  unique: boolean,
): boolean {
  return unique && UNIQUE_WIDGET_TYPES.has(type) && presentSet.has(type);
}

export function CasaWidgetGallery({ open, onClose, present, onAdd }: Props) {
  const presentSet = useMemo(() => new Set(present), [present]);

  const items = useMemo(() => {
    const ranked = WIDGET_REGISTRY.map((meta) => ({
      meta,
      taken: isTaken(meta.type, presentSet, meta.unique),
    }));
    // Available first so new types are immediately tappable.
    ranked.sort((a, b) => Number(a.taken) - Number(b.taken));
    return ranked;
  }, [presentSet]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="casa-gallery" role="presentation">
      <button
        type="button"
        className="casa-gallery-veil"
        aria-label="Chiudi galleria"
        onClick={onClose}
      />
      <div
        className="casa-gallery-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Aggiungi widget"
      >
        <header className="casa-gallery-head">
          <strong>Aggiungi widget</strong>
          <button type="button" className="casa-gallery-close" onClick={onClose}>
            Chiudi
          </button>
        </header>
        <ul className="casa-gallery-list">
          {items.map(({ meta, taken }) => (
            <li key={meta.type}>
              <button
                type="button"
                className="casa-gallery-item"
                disabled={taken}
                data-taken={taken ? "1" : "0"}
                data-widget-type={meta.type}
                onClick={() => {
                  if (taken) return;
                  onAdd(meta.type);
                  onClose();
                }}
              >
                <span>{meta.label}</span>
                <em>{taken ? "Già in plancia" : meta.defaultSize}</em>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>,
    document.body,
  );
}
