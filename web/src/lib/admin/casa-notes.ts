export type CasaNotesState = {
  byInstanceId: Record<string, string>;
};

export const DEFAULT_NOTES: CasaNotesState = { byInstanceId: {} };

const STORAGE_KEY = "lr_casa_notes";

function sanitizeByInstanceId(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, string> = {};
  for (const [id, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!id || typeof value !== "string") continue;
    out[id] = value;
  }
  return out;
}

export function loadNotes(): CasaNotesState {
  if (typeof window === "undefined") return DEFAULT_NOTES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_NOTES;
    const parsed = JSON.parse(raw) as Partial<CasaNotesState>;
    if (!parsed || typeof parsed.byInstanceId !== "object" || !parsed.byInstanceId) {
      return DEFAULT_NOTES;
    }
    return { byInstanceId: sanitizeByInstanceId(parsed.byInstanceId) };
  } catch {
    return DEFAULT_NOTES;
  }
}

export function saveNotes(state: CasaNotesState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function getNote(state: CasaNotesState, id: string): string {
  return state.byInstanceId[id] ?? "";
}

export function setNote(
  state: CasaNotesState,
  id: string,
  text: string,
): CasaNotesState {
  return {
    byInstanceId: {
      ...state.byInstanceId,
      [id]: text,
    },
  };
}
