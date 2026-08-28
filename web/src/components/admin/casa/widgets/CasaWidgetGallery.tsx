"use client";

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

export function CasaWidgetGallery({ open, onClose, present, onAdd }: Props) {
  if (!open) return null;

  const presentSet = new Set(present);

  return (
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
          {WIDGET_REGISTRY.map((meta) => {
            const taken =
              meta.unique &&
              UNIQUE_WIDGET_TYPES.has(meta.type) &&
              presentSet.has(meta.type);
            return (
              <li key={meta.type}>
                <button
                  type="button"
                  className="casa-gallery-item"
                  disabled={taken}
                  data-taken={taken ? "1" : "0"}
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
            );
          })}
        </ul>
      </div>
    </div>
  );
}
