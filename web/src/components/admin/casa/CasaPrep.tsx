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

const FLAGS: { key: keyof Prep; label: string }[] = [
  { key: "ship", label: "Ship" },
  { key: "luci", label: "Luci" },
  { key: "lampo", label: "Lampo" },
  { key: "foto", label: "Foto" },
  { key: "pausa", label: "Mini-gioco" },
  { key: "chemistry", label: "Chemistry" },
  { key: "speed", label: "Speed set" },
  { key: "recap", label: "Recap" },
];

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
    <div className="casa-prep">
      <p className="casa-sub">
        Preparazione evento. Sparisce dopo la sigla. Locali da Supabase (APP Eventi).
      </p>
      <label className="casa-pop-field">
        <span>Cerca locale</span>
        <input
          className="casa-field"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Nome o città"
        />
      </label>
      <div className="casa-prep-venues">
        {shown.map((v) => (
          <button
            key={v.id}
            type="button"
            className="casa-hit"
            data-on={prep.venueId === v.id ? "1" : undefined}
            onClick={() => onChange({ venueId: v.id, venueName: v.name })}
          >
            {venueLabel(v)}
          </button>
        ))}
        {!shown.length ? (
          <p className="casa-sub">{note ?? "Nessun locale. Prova un’altra ricerca."}</p>
        ) : null}
      </div>
      <div className="casa-setup-row">
        <span>Stile serata</span>
        <div className="casa-secs">
          {STILE.map((s) => (
            <button
              key={s.id}
              type="button"
              className="casa-sec"
              data-on={prep.stile === s.id ? "1" : undefined}
              onClick={() => onChange({ stile: s.id })}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
      <div className="casa-setup-row">
        <span>Ripescaggio</span>
        <div className="casa-secs">
          {RIPESCA.map((s) => (
            <button
              key={s.id}
              type="button"
              className="casa-sec"
              data-on={prep.ripescaggio === s.id ? "1" : undefined}
              onClick={() => onChange({ ripescaggio: s.id })}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
      <div className="casa-prep-flags">
        {FLAGS.map((f) => (
          <button
            key={f.key}
            type="button"
            className="casa-hit"
            data-on={prep[f.key] ? "1" : undefined}
            onClick={() => onChange({ [f.key]: !prep[f.key] })}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}
