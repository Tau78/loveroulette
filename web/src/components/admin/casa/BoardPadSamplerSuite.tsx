"use client";

import { useMemo, useRef, useState } from "react";
import {
  exportPadBank,
  fileToDataUrl,
  loadPadCustomHits,
  loadPadLabelOverrides,
  loadPadSetIds,
  newCustomPadId,
  PAD_SET_SLOTS,
  parsePadBankImport,
  resolvePadLibrary,
  resolvePadSet,
  savePadCustomHits,
  savePadLabelOverrides,
  savePadSetIds,
  type CasaPadHitDef,
  type CasaPadHitId,
} from "@/lib/admin/casa-pad-bank";
import { toggleCasaPadHit } from "@/lib/admin/casa-pad-sfx";
import { cn } from "@/lib/utils";

type Props = {
  volume: number;
  /** Uscita remota: niente SFX su questa plancia. */
  muted?: boolean;
  hitsPlaying: Set<string>;
  onHitPlayingChange: (id: string, playing: boolean) => void;
  /** Set plancia (ordinato) — sync col riquadro piccolo. */
  setIds: CasaPadHitId[];
  onSetIdsChange: (ids: CasaPadHitId[]) => void;
  /** Custom/label cambiati → plancia rilegge. */
  onBankChange?: () => void;
};

export function BoardPadSamplerSuite({
  volume,
  muted = false,
  hitsPlaying,
  onHitPlayingChange,
  setIds,
  onSetIdsChange,
  onBankChange,
}: Props) {
  const [custom, setCustom] = useState(() => loadPadCustomHits());
  const [labels, setLabels] = useState(() => loadPadLabelOverrides());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const addInput = useRef<HTMLInputElement>(null);
  const loadInput = useRef<HTMLInputElement>(null);

  const library = useMemo(
    () => resolvePadLibrary(custom, labels),
    [custom, labels],
  );
  const setHits = useMemo(
    () => resolvePadSet(setIds, library),
    [setIds, library],
  );

  function persistSet(ids: CasaPadHitId[]) {
    const next = ids.slice(0, PAD_SET_SLOTS);
    savePadSetIds(next);
    onSetIdsChange(next);
  }

  function fire(hit: CasaPadHitDef) {
    if (muted) return;
    const on = toggleCasaPadHit(
      hit.id,
      volume,
      () => onHitPlayingChange(hit.id, false),
      hit.src,
    );
    onHitPlayingChange(hit.id, on);
  }

  function putInSet(id: CasaPadHitId) {
    if (setIds.includes(id)) {
      setMsg("Già nel set plancia");
      return;
    }
    if (setIds.length >= PAD_SET_SLOTS) {
      const next = [...setIds.slice(1), id];
      persistSet(next);
      setMsg("Slot pieni — sostituito il primo");
      return;
    }
    persistSet([...setIds, id]);
    setMsg(null);
  }

  function removeFromSet(id: CasaPadHitId) {
    persistSet(setIds.filter((x) => x !== id));
  }

  function reorderSet(fromId: string, toId: string) {
    if (fromId === toId) return;
    const from = setIds.indexOf(fromId);
    const to = setIds.indexOf(toId);
    if (from < 0 || to < 0) return;
    const next = [...setIds];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    persistSet(next);
  }

  function startEdit(hit: CasaPadHitDef) {
    setEditingId(hit.id);
    setEditLabel(hit.label);
  }

  function commitEdit() {
    if (!editingId) return;
    const next = { ...labels, [editingId]: editLabel.trim() || labels[editingId] };
    if (!editLabel.trim()) delete next[editingId];
    else next[editingId] = editLabel.trim();
    setLabels(next);
    savePadLabelOverrides(next);
    setEditingId(null);
    onBankChange?.();
  }

  async function addFiles(files: FileList | null) {
    if (!files?.length) return;
    const added: CasaPadHitDef[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("audio/")) continue;
      try {
        const src = await fileToDataUrl(file);
        const base = file.name.replace(/\.[^.]+$/, "").trim() || "Custom";
        added.push({
          id: newCustomPadId(),
          label: base.slice(0, 28),
          src,
          builtin: false,
        });
      } catch {
        /* skip */
      }
    }
    if (!added.length) {
      setMsg("Nessun audio valido");
      return;
    }
    const next = [...custom, ...added];
    setCustom(next);
    savePadCustomHits(next);
    setMsg(`Aggiunti ${added.length} suoni`);
    onBankChange?.();
  }

  function deleteCustom(id: string) {
    const next = custom.filter((h) => h.id !== id);
    setCustom(next);
    savePadCustomHits(next);
    if (setIds.includes(id)) removeFromSet(id);
    const nextLabels = { ...labels };
    delete nextLabels[id];
    setLabels(nextLabels);
    savePadLabelOverrides(nextLabels);
    onBankChange?.();
  }

  function saveBank() {
    const payload = exportPadBank(setIds, custom, labels);
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `love-roulette-pad-bank.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMsg("Set salvato su file");
  }

  async function loadBank(file: File | null) {
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = parsePadBankImport(JSON.parse(text));
      if (!parsed) {
        setMsg("File non valido");
        return;
      }
      setCustom(parsed.custom);
      savePadCustomHits(parsed.custom);
      setLabels(parsed.labels);
      savePadLabelOverrides(parsed.labels);
      persistSet(parsed.setIds);
      setMsg("Bank caricato");
      onBankChange?.();
    } catch {
      setMsg("Caricamento fallito");
    }
  }

  return (
    <div className="casa-board-sampler">
      <div className="casa-board-pad casa-board-pad-expand">
        {setHits.map((p) => (
          <button
            key={p.id}
            type="button"
            className="casa-board-pad-btn"
            data-on={hitsPlaying.has(p.id) ? "1" : undefined}
            draggable
            onDragStart={() => setDragId(p.id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (dragId) reorderSet(dragId, p.id);
              setDragId(null);
            }}
            onDragEnd={() => setDragId(null)}
            onClick={() => fire(p)}
            title="Trascina per riordinare · tap per suonare"
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="casa-board-sampler-bar">
        <button
          type="button"
          className="casa-board-action"
          onClick={() => addInput.current?.click()}
        >
          Aggiungi
        </button>
        <button type="button" className="casa-board-action" onClick={saveBank}>
          Salva
        </button>
        <button
          type="button"
          className="casa-board-action"
          onClick={() => loadInput.current?.click()}
        >
          Carica
        </button>
        <span className="casa-board-sampler-hint">
          Set plancia · {setHits.length}/{PAD_SET_SLOTS} · locale su questo device
        </span>
      </div>

      <p className="casa-board-sampler-label">Libreria suoni</p>
      <div className="casa-board-sampler-lib">
        {library.map((hit) => {
          const inSet = setIds.includes(hit.id);
          return (
            <div
              key={hit.id}
              className={cn(
                "casa-board-sampler-item",
                inSet && "is-inset",
                hitsPlaying.has(hit.id) && "is-on",
              )}
            >
              {editingId === hit.id ? (
                <input
                  className="casa-board-sampler-edit"
                  value={editLabel}
                  autoFocus
                  onChange={(e) => setEditLabel(e.target.value)}
                  onBlur={commitEdit}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitEdit();
                    if (e.key === "Escape") setEditingId(null);
                  }}
                />
              ) : (
                <button
                  type="button"
                  className="casa-board-sampler-play"
                  onClick={() => fire(hit)}
                >
                  {hit.label}
                </button>
              )}
              <div className="casa-board-sampler-ops">
                <button
                  type="button"
                  title="Modifica nome"
                  onClick={() => startEdit(hit)}
                >
                  ✎
                </button>
                {inSet ? (
                  <button
                    type="button"
                    title="Togli dal set plancia"
                    onClick={() => removeFromSet(hit.id)}
                  >
                    −
                  </button>
                ) : (
                  <button
                    type="button"
                    title="Metti nel set plancia"
                    onClick={() => putInSet(hit.id)}
                  >
                    +
                  </button>
                )}
                {!hit.builtin ? (
                  <button
                    type="button"
                    title="Elimina suono custom"
                    onClick={() => deleteCustom(hit.id)}
                  >
                    ⌫
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {msg ? <p className="casa-board-audio-err">{msg}</p> : null}

      <input
        ref={addInput}
        type="file"
        accept="audio/*"
        multiple
        hidden
        onChange={(e) => {
          void addFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={loadInput}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(e) => {
          void loadBank(e.target.files?.[0] ?? null);
          e.target.value = "";
        }}
      />
    </div>
  );
}
