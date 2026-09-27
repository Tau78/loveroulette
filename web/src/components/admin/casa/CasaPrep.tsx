"use client";

import { useEffect, useMemo, useState } from "react";
import {
  venueLabel,
  type CasaPrep as Prep,
  type CasaRipescaggio,
  type CasaStile,
  type CasaVenue,
} from "@/lib/admin/casa-prep";

type Props = {
  prep: Prep;
  onChange: (patch: Partial<Prep>) => void;
};

const STILE: { id: CasaStile; label: string }[] = [
  { id: "ironico", label: "Ironico" },
  { id: "romantico", label: "Romantico" },
  { id: "mix", label: "Mix" },
];

const RIPESCA: { id: CasaRipescaggio; label: string }[] = [
  { id: "salva", label: "Salva sala" },
  { id: "wildcard", label: "Wildcard" },
  { id: "off", label: "No" },
];

type PrepFlag = Extract<
  keyof Prep,
  "ship" | "luci" | "lampo" | "foto" | "pausa" | "chemistry" | "speed" | "recap"
>;

const FLAGS: { key: PrepFlag; label: string }[] = [
  { key: "ship", label: "Ship" },
  { key: "luci", label: "Luci" },
  { key: "lampo", label: "Lampo" },
  { key: "foto", label: "Foto" },
  { key: "pausa", label: "Mini-gioco" },
  { key: "chemistry", label: "Chemistry" },
  { key: "speed", label: "Speed set" },
  { key: "recap", label: "Recap" },
];

function NumChip({
  label,
  value,
  min,
  max,
  onStep,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onStep: (n: number) => void;
}) {
  return (
    <div className="casa-board-prep-num">
      <span>{label}</span>
      <div className="casa-board-prep-stepper">
        <button
          type="button"
          aria-label={`${label} meno`}
          onClick={() => onStep(Math.max(min, value - 1))}
        >
          −
        </button>
        <strong>{value}</strong>
        <button
          type="button"
          aria-label={`${label} più`}
          onClick={() => onStep(Math.min(max, value + 1))}
        >
          +
        </button>
      </div>
    </div>
  );
}

export function CasaPrep({ prep, onChange }: Props) {
  const [venues, setVenues] = useState<CasaVenue[]>([]);
  const [query, setQuery] = useState("");
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    void fetch("/api/venues")
      .then((res) => res.json() as Promise<{ venues?: CasaVenue[]; error?: string }>)
      .then((data) => {
        if (!live) return;
        setVenues(data.venues ?? []);
        if (data.error && !(data.venues ?? []).length) {
          setNote("Locali non disponibili. Controlla Supabase.");
        }
      })
      .catch(() => {
        if (live) setNote("Locali non disponibili. Controlla Supabase.");
      });
    return () => {
      live = false;
    };
  }, []);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? venues.filter((v) => venueLabel(v).toLowerCase().includes(q))
      : venues;
    return list.slice(0, 8);
  }, [venues, query]);

  return (
    <div className="casa-board-prep">
      <section className="casa-regia-block space-y-1.5">
        <p className="casa-board-prep-kicker">Locale</p>
        <div className="casa-board-prep-row">
          <input
            className="casa-board-prep-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cerca locale o città"
            aria-label="Cerca locale"
          />
        </div>
        <div className="casa-board-prep-chips">
          {shown.map((v) => (
            <button
              key={v.id}
              type="button"
              className="casa-board-prep-chip"
              data-on={prep.venueId === v.id ? "1" : undefined}
              onClick={() => onChange({ venueId: v.id, venueName: v.name })}
            >
              {venueLabel(v)}
            </button>
          ))}
          {!shown.length ? (
            <p className="casa-board-prep-hint">
              {note ?? "Nessun locale. Prova un’altra ricerca."}
            </p>
          ) : null}
        </div>
        {prep.venueName ? (
          <p className="casa-board-prep-hint">
            Selezionato: <b>{prep.venueName}</b>
          </p>
        ) : null}
      </section>

      <section className="casa-regia-block space-y-1.5">
        <p className="casa-board-prep-kicker">Stile · ripescaggio</p>
        <div className="casa-board-prep-row">
          <span className="casa-board-prep-label">Stile</span>
          {STILE.map((s) => (
            <button
              key={s.id}
              type="button"
              className="casa-board-prep-chip"
              data-on={prep.stile === s.id ? "1" : undefined}
              onClick={() => onChange({ stile: s.id })}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="casa-board-prep-row">
          <span className="casa-board-prep-label">Ripescaggio</span>
          {RIPESCA.map((s) => (
            <button
              key={s.id}
              type="button"
              className="casa-board-prep-chip"
              data-on={prep.ripescaggio === s.id ? "1" : undefined}
              onClick={() => onChange({ ripescaggio: s.id })}
            >
              {s.label}
            </button>
          ))}
        </div>
      </section>

      <section className="casa-regia-block space-y-1.5">
        <p className="casa-board-prep-kicker">Moduli serata</p>
        <div className="casa-board-prep-chips">
          {FLAGS.map((f) => (
            <button
              key={f.key}
              type="button"
              className="casa-board-prep-chip"
              data-on={prep[f.key] ? "1" : undefined}
              onClick={() => onChange({ [f.key]: !prep[f.key] })}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="casa-board-prep-row">
          {prep.ship ? (
            <NumChip
              label="Top ship"
              value={prep.shipTopN}
              min={1}
              max={20}
              onStep={(n) => onChange({ shipTopN: n })}
            />
          ) : null}
          {prep.luci ? (
            <NumChip
              label="Flash luci (s)"
              value={prep.luciFlashSec}
              min={1}
              max={60}
              onStep={(n) => onChange({ luciFlashSec: n })}
            />
          ) : null}
          {prep.ripescaggio === "salva" ? (
            <NumChip
              label="Salva sala (s)"
              value={prep.salvaSec}
              min={5}
              max={120}
              onStep={(n) => onChange({ salvaSec: n })}
            />
          ) : null}
        </div>
      </section>
    </div>
  );
}
