/**
 * Pad effetti plancia — libreria builtin + set salvato in locale.
 * I sample sono MP3 reali in /grafiche/audio/pad/ (Mixkit / asset show).
 */

export type CasaPadHitId = string;

export type CasaPadHitDef = {
  id: CasaPadHitId;
  label: string;
  src: string;
  /** Builtin = file in public/; altrimenti data-URL custom. */
  builtin: boolean;
};

/** Catalogo fisso (sempre disponibile nella suite). */
export const CASA_PAD_BUILTIN: readonly CasaPadHitDef[] = [
  { id: "applausi", label: "Applausi", src: "/grafiche/audio/pad/applausi.mp3", builtin: true },
  { id: "risate", label: "Risate", src: "/grafiche/audio/pad/risate.mp3", builtin: true },
  { id: "ohno", label: "Oh no", src: "/grafiche/audio/pad/ohno.mp3?v=2", builtin: true },
  { id: "buuuh", label: "Buuuh", src: "/grafiche/audio/pad/buuuh.mp3", builtin: true },
  { id: "tuono", label: "Tuono", src: "/grafiche/audio/pad/tuono.mp3", builtin: true },
  { id: "cuore", label: "Cuore che batte", src: "/grafiche/audio/pad/cuore.mp3", builtin: true },
  { id: "sospiro", label: "Sospiro innamorato", src: "/grafiche/audio/pad/sospiro.mp3?v=2", builtin: true },
  { id: "spavento", label: "Urlo di spavento", src: "/grafiche/audio/pad/spavento.mp3", builtin: true },
  { id: "dolore", label: "Asino", src: "/grafiche/audio/pad/dolore.mp3", builtin: true },
  { id: "gong", label: "Gong", src: "/grafiche/audio/pad/gong.mp3", builtin: true },
  { id: "rullo", label: "Rullo", src: "/grafiche/audio/pad/rullo.mp3", builtin: true },
  { id: "confetti", label: "Confetti", src: "/grafiche/audio/pad/confetti.mp3", builtin: true },
  { id: "fanfara", label: "Fanfara", src: "/grafiche/audio/pad/fanfara.mp3", builtin: true },
  { id: "reveal", label: "Reveal", src: "/grafiche/audio/pad/reveal.mp3", builtin: true },
  { id: "impatto", label: "Impatto", src: "/grafiche/audio/pad/impatto.mp3", builtin: true },
] as const;

/** Alias legacy per i 9 hit storici (+ synth fallback). */
export const CASA_PAD_HITS = CASA_PAD_BUILTIN.map(({ id, label }) => ({ id, label }));

export const CASA_PAD_SRC: Record<string, string> = Object.fromEntries(
  CASA_PAD_BUILTIN.map((h) => [h.id, h.src]),
);

/** Set default in plancia (6 tasti). */
export const DEFAULT_PAD_SET_IDS: CasaPadHitId[] = [
  "applausi",
  "risate",
  "ohno",
  "buuuh",
  "tuono",
  "cuore",
];

export const PAD_SET_SLOTS = 6;

const PAD_SET_KEY = "casa-board-pad-set-v1";
const PAD_CUSTOM_KEY = "casa-board-pad-custom-v1";
const PAD_LABELS_KEY = "casa-board-pad-labels-v1";

export type CasaPadBankExport = {
  version: 1;
  setIds: CasaPadHitId[];
  custom: CasaPadHitDef[];
  labels: Record<string, string>;
};

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota */
  }
}

export function loadPadCustomHits(): CasaPadHitDef[] {
  const raw = readJson<CasaPadHitDef[]>(PAD_CUSTOM_KEY, []);
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (h) =>
      h &&
      typeof h.id === "string" &&
      typeof h.label === "string" &&
      typeof h.src === "string" &&
      h.builtin === false,
  );
}

export function savePadCustomHits(hits: CasaPadHitDef[]): void {
  writeJson(PAD_CUSTOM_KEY, hits);
}

export function loadPadLabelOverrides(): Record<string, string> {
  const raw = readJson<Record<string, string>>(PAD_LABELS_KEY, {});
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === "string" && v.trim()) out[k] = v.trim();
  }
  return out;
}

export function savePadLabelOverrides(labels: Record<string, string>): void {
  writeJson(PAD_LABELS_KEY, labels);
}

export function loadPadSetIds(): CasaPadHitId[] {
  const raw = readJson<CasaPadHitId[]>(PAD_SET_KEY, DEFAULT_PAD_SET_IDS);
  if (!Array.isArray(raw) || raw.length === 0) return [...DEFAULT_PAD_SET_IDS];
  const cleaned = raw.filter((id) => typeof id === "string" && id.trim());
  if (cleaned.length === 0) return [...DEFAULT_PAD_SET_IDS];
  return cleaned.slice(0, PAD_SET_SLOTS);
}

export function savePadSetIds(ids: CasaPadHitId[]): void {
  writeJson(PAD_SET_KEY, ids.slice(0, PAD_SET_SLOTS));
}

export function resolvePadLibrary(
  custom: CasaPadHitDef[],
  labels: Record<string, string>,
): CasaPadHitDef[] {
  const builtin = CASA_PAD_BUILTIN.map((h) => ({
    ...h,
    label: labels[h.id] ?? h.label,
  }));
  const customs = custom.map((h) => ({
    ...h,
    label: labels[h.id] ?? h.label,
  }));
  return [...builtin, ...customs];
}

export function resolvePadSet(
  setIds: CasaPadHitId[],
  library: CasaPadHitDef[],
): CasaPadHitDef[] {
  const byId = new Map(library.map((h) => [h.id, h]));
  const out: CasaPadHitDef[] = [];
  for (const id of setIds) {
    const hit = byId.get(id);
    if (hit) out.push(hit);
  }
  // Riempi fino a 6 con default mancanti.
  if (out.length < PAD_SET_SLOTS) {
    for (const id of DEFAULT_PAD_SET_IDS) {
      if (out.length >= PAD_SET_SLOTS) break;
      if (out.some((h) => h.id === id)) continue;
      const hit = byId.get(id);
      if (hit) out.push(hit);
    }
  }
  return out.slice(0, PAD_SET_SLOTS);
}

export function exportPadBank(
  setIds: CasaPadHitId[],
  custom: CasaPadHitDef[],
  labels: Record<string, string>,
): CasaPadBankExport {
  return { version: 1, setIds, custom, labels };
}

export function parsePadBankImport(raw: unknown): CasaPadBankExport | null {
  if (!raw || typeof raw !== "object") return null;
  const rec = raw as Record<string, unknown>;
  if (rec.version !== 1) return null;
  if (!Array.isArray(rec.setIds)) return null;
  const setIds = rec.setIds.filter(
    (id): id is string => typeof id === "string" && id.trim().length > 0,
  );
  const custom = Array.isArray(rec.custom)
    ? (rec.custom as CasaPadHitDef[]).filter(
        (h) =>
          h &&
          typeof h.id === "string" &&
          typeof h.label === "string" &&
          typeof h.src === "string",
      ).map((h) => ({ ...h, builtin: false as const }))
    : [];
  const labels =
    rec.labels && typeof rec.labels === "object" && !Array.isArray(rec.labels)
      ? (rec.labels as Record<string, string>)
      : {};
  return { version: 1, setIds, custom, labels };
}

export function newCustomPadId(): string {
  return `custom_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("Read failed"));
    reader.readAsDataURL(file);
  });
}
