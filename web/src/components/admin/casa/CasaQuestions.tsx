"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  blankQuestion,
  documentFromQuestions,
  loadQuestions,
  parseQuestionsFile,
  saveQuestions,
  type CasaQuestion,
} from "@/lib/admin/casa-questions";

const LETTERS = ["A", "B", "C", "D"] as const;

type Props = {
  eventCode: string;
};

export function CasaQuestions({ eventCode }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [questions, setQuestions] = useState<CasaQuestion[]>(() =>
    loadQuestions(eventCode),
  );
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    setQuestions(loadQuestions(eventCode));
    setIndex(0);
  }, [eventCode]);

  function persist(next: CasaQuestion[]) {
    setQuestions(next);
    saveQuestions(eventCode, next);
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return questions;
    return questions.filter(
      (row) =>
        row.text.toLowerCase().includes(q) ||
        row.options.some((opt) => opt.toLowerCase().includes(q)),
    );
  }, [questions, query]);

  const safeIndex = filtered.length ? Math.min(index, filtered.length - 1) : 0;
  const current = filtered[safeIndex];

  function patchCurrent(patch: Partial<CasaQuestion>) {
    if (!current) return;
    persist(
      questions.map((row) => (row.id === current.id ? { ...row, ...patch } : row)),
    );
  }

  function patchOption(slot: number, value: string) {
    if (!current) return;
    const options = [...current.options] as CasaQuestion["options"];
    options[slot] = value;
    patchCurrent({ options });
  }

  function addQuestion() {
    const next = [...questions, blankQuestion()];
    persist(next);
    setQuery("");
    setIndex(next.length - 1);
    setNote("Nuova domanda. Scrivi e salva da sola.");
  }

  function dropCurrent() {
    if (!current) return;
    const next = questions.filter((row) => row.id !== current.id);
    persist(next);
    setIndex((i) => Math.max(0, i - 1));
  }

  function exportFile() {
    const blob = new Blob(
      [JSON.stringify(documentFromQuestions(eventCode, questions), null, 2)],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${eventCode.toUpperCase()}_manche.json`;
    a.click();
    URL.revokeObjectURL(url);
    setNote("Export pronto.");
  }

  async function importFile(file: File) {
    try {
      const next = parseQuestionsFile(await file.text());
      persist(next);
      setIndex(0);
      setNote(`Import OK — ${next.length} domande.`);
    } catch (err) {
      setNote(err instanceof Error ? err.message : "Import non riuscito.");
    }
  }

  return (
    <div className="casa-q">
      <div className="casa-pop-acts">
        <button type="button" className="casa-hit" onClick={() => fileRef.current?.click()}>
          Import
        </button>
        <button type="button" className="casa-hit" onClick={exportFile}>
          Export
        </button>
        <button type="button" className="casa-hit" data-on="1" onClick={addQuestion}>
          Nuova
        </button>
      </div>
      <input
        className="casa-search"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIndex(0);
        }}
        placeholder="Cerca domanda"
      />
      {current ? (
        <div className="casa-q-edit">
          <label className="casa-pop-field">
            <span>
              Domanda {safeIndex + 1} / {filtered.length}
            </span>
            <textarea
              className="casa-field casa-q-text"
              value={current.text}
              onChange={(e) => patchCurrent({ text: e.target.value })}
              placeholder="Testo della domanda"
            />
          </label>
          <div className="casa-q-opts">
            {current.options.map((opt, i) => (
              <label className="casa-pop-field" key={LETTERS[i]}>
                <span>{LETTERS[i]}</span>
                <input
                  className="casa-field"
                  value={opt}
                  onChange={(e) => patchOption(i, e.target.value)}
                  placeholder={`Opzione ${LETTERS[i]}`}
                />
              </label>
            ))}
          </div>
        </div>
      ) : (
        <p className="casa-sub">Nessuna domanda. Importa un JSON o premi Nuova.</p>
      )}
      <div className="casa-q-nav">
        <button
          type="button"
          className="casa-hit"
          disabled={safeIndex <= 0}
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
        >
          Prec
        </button>
        <button
          type="button"
          className="casa-hit"
          disabled={safeIndex >= filtered.length - 1}
          onClick={() => setIndex((i) => i + 1)}
        >
          Succ
        </button>
        <button type="button" className="casa-hit casa-hit-hot" disabled={!current} onClick={dropCurrent}>
          Elimina
        </button>
      </div>
      {note ? <p className="casa-sub">{note}</p> : null}
      <input
        ref={fileRef}
        type="file"
        className="casa-hidden"
        accept="application/json,.json"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void importFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
