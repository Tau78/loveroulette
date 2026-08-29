export type CasaWidgetSize = "S" | "M" | "L" | "XL";
export type CasaWidgetType =
  | "settings"
  | "players"
  | "messages"
  | "projector"
  | "audio"
  | "pad"
  | "avanti"
  | "clock"
  | "timer"
  | "notes"
  | "qr_help"
  | "volume_master"
  | "audio_bed"
  | "video_player"
  | "quiz_regia"
  | "transport"
  | "preflight"
  | "panic"
  | "finals"
  | "extraction"
  | "leaderboard"
  | "cue";

export type CasaWidgetInstance = {
  id: string;
  type: CasaWidgetType;
  x: number;
  y: number;
  size: CasaWidgetSize;
};

export type CasaLayoutProfile = {
  id: string;
  name: string;
  widgets: CasaWidgetInstance[];
  updatedAt: number;
  /** true only for the Default profile — never deletable */
  isDefault?: boolean;
};

export type CasaLayoutsState = {
  activeId: string;
  profiles: CasaLayoutProfile[];
};

export const STORAGE_KEY = "lr_casa_layouts";
export const MAX_CUSTOM_PROFILES = 5;
export const NAME_MIN = 1;
export const NAME_MAX = 24;
export const DEFAULT_PROFILE_ID = "default";

const WIDGET_TYPES: ReadonlySet<CasaWidgetType> = new Set([
  "settings",
  "players",
  "messages",
  "projector",
  "audio",
  "pad",
  "avanti",
  "clock",
  "timer",
  "notes",
  "qr_help",
  "volume_master",
  "audio_bed",
  "video_player",
  "quiz_regia",
  "transport",
  "preflight",
  "panic",
  "finals",
  "extraction",
  "leaderboard",
  "cue",
]);

const WIDGET_SIZES: ReadonlySet<CasaWidgetSize> = new Set([
  "S",
  "M",
  "L",
  "XL",
]);

export const WIDGET_LABELS: Record<CasaWidgetType, string> = {
  settings: "Impostazioni",
  players: "Giocatori",
  messages: "Messaggi",
  projector: "Proiettore",
  audio: "Mixer",
  pad: "Pad",
  avanti: "Avanti",
  clock: "Orologio",
  timer: "Timer",
  notes: "Note",
  qr_help: "Wi-Fi / QR",
  volume_master: "Volume master",
  audio_bed: "Sottofondo",
  video_player: "Video",
  quiz_regia: "Foglio quiz",
  transport: "Transport GO",
  preflight: "Preflight",
  panic: "Panic",
  finals: "Finali",
  extraction: "Estrazione",
  leaderboard: "Classifica",
  cue: "Prossima domanda",
};

export const UNIQUE_WIDGET_TYPES: ReadonlySet<CasaWidgetType> = new Set([
  "settings",
  "players",
  "messages",
  "projector",
  "audio",
  "pad",
  "avanti",
  "clock",
  "qr_help",
  "volume_master",
  "audio_bed",
  "video_player",
  "quiz_regia",
  "transport",
  "preflight",
  "panic",
  "finals",
  "extraction",
  "leaderboard",
  "cue",
]);

/** Logical canvas snapshot (~1200×700) approximating the current 3-col CasaPad. */
export const FACTORY_DEFAULT_WIDGETS: Omit<CasaWidgetInstance, "id">[] = [
  { type: "settings", x: 12, y: 12, size: "S" },
  { type: "players", x: 12, y: 140, size: "M" },
  { type: "messages", x: 12, y: 420, size: "S" },
  { type: "projector", x: 280, y: 12, size: "XL" },
  { type: "audio", x: 900, y: 12, size: "S" },
  { type: "audio_bed", x: 900, y: 140, size: "M" },
  { type: "pad", x: 900, y: 330, size: "M" },
  { type: "avanti", x: 900, y: 520, size: "S" },
  { type: "clock", x: 12, y: 548, size: "S" },
];

const SIZE_PX: Record<CasaWidgetSize, { w: number; h: number }> = {
  S: { w: 180, h: 120 },
  M: { w: 280, h: 180 },
  L: { w: 400, h: 240 },
  XL: { w: 560, h: 360 },
};

export function sizeToPx(size: CasaWidgetSize): { w: number; h: number } {
  return { ...SIZE_PX[size] };
}

export function createId(prefix = "w"): string {
  const uuid =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}-${uuid}`;
}

export function getFactoryDefaultWidgets(): CasaWidgetInstance[] {
  return FACTORY_DEFAULT_WIDGETS.map((w) => ({
    ...w,
    id: `factory-${w.type}`,
  }));
}

export function createDefaultState(): CasaLayoutsState {
  return {
    activeId: DEFAULT_PROFILE_ID,
    profiles: [
      {
        id: DEFAULT_PROFILE_ID,
        name: "Default",
        widgets: getFactoryDefaultWidgets(),
        updatedAt: Date.now(),
        isDefault: true,
      },
    ],
  };
}

function clampSize(raw: unknown): CasaWidgetSize {
  if (typeof raw === "string" && WIDGET_SIZES.has(raw as CasaWidgetSize)) {
    return raw as CasaWidgetSize;
  }
  return "M";
}

function sanitizeWidgets(raw: unknown): CasaWidgetInstance[] {
  if (!Array.isArray(raw)) return getFactoryDefaultWidgets();
  const out: CasaWidgetInstance[] = [];
  const seenIds = new Set<string>();
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const w = item as Partial<CasaWidgetInstance>;
    if (typeof w.type !== "string" || !WIDGET_TYPES.has(w.type as CasaWidgetType)) {
      continue;
    }
    let id =
      typeof w.id === "string" && w.id.trim()
        ? w.id.trim()
        : createId(w.type);
    if (seenIds.has(id)) id = createId(w.type);
    seenIds.add(id);
    const x = typeof w.x === "number" && Number.isFinite(w.x) ? w.x : 0;
    const y = typeof w.y === "number" && Number.isFinite(w.y) ? w.y : 0;
    out.push({
      id,
      type: w.type as CasaWidgetType,
      x,
      y,
      size: clampSize(w.size),
    });
  }
  return out;
}

function sanitizeName(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const name = raw.trim();
  if (name.length < NAME_MIN || name.length > NAME_MAX) return null;
  return name;
}

function normalizeNameKey(name: string): string {
  return name.trim().toLowerCase();
}

function findDefault(profiles: CasaLayoutProfile[]): CasaLayoutProfile | undefined {
  return profiles.find((p) => p.isDefault || p.id === DEFAULT_PROFILE_ID);
}

function ensureDefaultProfile(
  profiles: CasaLayoutProfile[],
): CasaLayoutProfile[] {
  const existing = findDefault(profiles);
  if (existing) {
    return profiles.map((p) =>
      p.id === existing.id
        ? {
            ...p,
            id: DEFAULT_PROFILE_ID,
            name: p.name.trim() || "Default",
            isDefault: true,
            widgets: sanitizeWidgets(p.widgets),
          }
        : { ...p, isDefault: false },
    );
  }
  return [
    {
      id: DEFAULT_PROFILE_ID,
      name: "Default",
      widgets: getFactoryDefaultWidgets(),
      updatedAt: Date.now(),
      isDefault: true,
    },
    ...profiles.map((p) => ({ ...p, isDefault: false })),
  ];
}

function sanitizeState(raw: unknown): CasaLayoutsState {
  if (!raw || typeof raw !== "object") return createDefaultState();
  const data = raw as Partial<CasaLayoutsState>;
  if (!Array.isArray(data.profiles)) return createDefaultState();

  const profiles: CasaLayoutProfile[] = [];
  for (const item of data.profiles) {
    if (!item || typeof item !== "object") continue;
    const p = item as Partial<CasaLayoutProfile>;
    const id =
      typeof p.id === "string" && p.id.trim() ? p.id.trim() : createId("profile");
    const name = sanitizeName(p.name) ?? (id === DEFAULT_PROFILE_ID ? "Default" : null);
    if (!name) continue;
    profiles.push({
      id,
      name,
      widgets: sanitizeWidgets(p.widgets),
      updatedAt:
        typeof p.updatedAt === "number" && Number.isFinite(p.updatedAt)
          ? p.updatedAt
          : Date.now(),
      isDefault: Boolean(p.isDefault) || id === DEFAULT_PROFILE_ID,
    });
  }

  const withDefault = ensureDefaultProfile(profiles);
  const custom = withDefault.filter((p) => !p.isDefault).slice(0, MAX_CUSTOM_PROFILES);
  const defaults = withDefault.filter((p) => p.isDefault);
  const trimmed = [...defaults.slice(0, 1), ...custom];

  const activeId =
    typeof data.activeId === "string" &&
    trimmed.some((p) => p.id === data.activeId)
      ? data.activeId
      : DEFAULT_PROFILE_ID;

  return { activeId, profiles: trimmed };
}

export function loadLayouts(): CasaLayoutsState {
  if (typeof window === "undefined") return createDefaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultState();
    return sanitizeState(JSON.parse(raw));
  } catch {
    return createDefaultState();
  }
}

export function saveLayouts(state: CasaLayoutsState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function getActiveProfile(state: CasaLayoutsState): CasaLayoutProfile {
  return (
    state.profiles.find((p) => p.id === state.activeId) ??
    state.profiles.find((p) => p.isDefault) ??
    createDefaultState().profiles[0]
  );
}

export function setActiveProfile(
  state: CasaLayoutsState,
  id: string,
): CasaLayoutsState {
  if (!state.profiles.some((p) => p.id === id)) return state;
  return { ...state, activeId: id };
}

export function updateActiveWidgets(
  state: CasaLayoutsState,
  widgets: CasaWidgetInstance[],
): CasaLayoutsState {
  const now = Date.now();
  return {
    ...state,
    profiles: state.profiles.map((p) =>
      p.id === state.activeId
        ? { ...p, widgets: sanitizeWidgets(widgets), updatedAt: now }
        : p,
    ),
  };
}

function nameTaken(
  profiles: CasaLayoutProfile[],
  name: string,
  exceptId?: string,
): boolean {
  const key = normalizeNameKey(name);
  return profiles.some(
    (p) => p.id !== exceptId && normalizeNameKey(p.name) === key,
  );
}

function validateNewName(
  profiles: CasaLayoutProfile[],
  name: string,
  exceptId?: string,
): string | undefined {
  const trimmed = name.trim();
  if (trimmed.length < NAME_MIN || trimmed.length > NAME_MAX) {
    return `Il nome deve avere tra ${NAME_MIN} e ${NAME_MAX} caratteri.`;
  }
  if (nameTaken(profiles, trimmed, exceptId)) {
    return "Esiste già un profilo con questo nome.";
  }
  return undefined;
}

export function createProfileFromCurrent(
  state: CasaLayoutsState,
  name: string,
): { state: CasaLayoutsState; error?: string } {
  const customCount = state.profiles.filter((p) => !p.isDefault).length;
  if (customCount >= MAX_CUSTOM_PROFILES) {
    return {
      state,
      error: `Puoi salvare al massimo ${MAX_CUSTOM_PROFILES} layout personalizzati.`,
    };
  }
  const nameError = validateNewName(state.profiles, name);
  if (nameError) return { state, error: nameError };

  const active = getActiveProfile(state);
  const profile: CasaLayoutProfile = {
    id: createId("profile"),
    name: name.trim(),
    widgets: active.widgets.map((w) => ({ ...w, id: createId(w.type) })),
    updatedAt: Date.now(),
    isDefault: false,
  };
  return {
    state: {
      activeId: profile.id,
      profiles: [...state.profiles, profile],
    },
  };
}

export function renameProfile(
  state: CasaLayoutsState,
  id: string,
  name: string,
): { state: CasaLayoutsState; error?: string } {
  const target = state.profiles.find((p) => p.id === id);
  if (!target) return { state, error: "Profilo non trovato." };
  const nameError = validateNewName(state.profiles, name, id);
  if (nameError) return { state, error: nameError };

  return {
    state: {
      ...state,
      profiles: state.profiles.map((p) =>
        p.id === id
          ? { ...p, name: name.trim(), updatedAt: Date.now() }
          : p,
      ),
    },
  };
}

export function deleteProfile(
  state: CasaLayoutsState,
  id: string,
): { state: CasaLayoutsState; error?: string } {
  const target = state.profiles.find((p) => p.id === id);
  if (!target) return { state, error: "Profilo non trovato." };
  if (target.isDefault || target.id === DEFAULT_PROFILE_ID) {
    return { state, error: "Il profilo Default non si può eliminare." };
  }
  const profiles = state.profiles.filter((p) => p.id !== id);
  const activeId =
    state.activeId === id ? DEFAULT_PROFILE_ID : state.activeId;
  return { state: { activeId, profiles } };
}

export function resetDefaultToFactory(
  state: CasaLayoutsState,
): CasaLayoutsState {
  const now = Date.now();
  const profiles = ensureDefaultProfile(state.profiles).map((p) =>
    p.isDefault || p.id === DEFAULT_PROFILE_ID
      ? {
          ...p,
          id: DEFAULT_PROFILE_ID,
          isDefault: true,
          widgets: getFactoryDefaultWidgets(),
          updatedAt: now,
        }
      : p,
  );
  const activeId = profiles.some((p) => p.id === state.activeId)
    ? state.activeId
    : DEFAULT_PROFILE_ID;
  return { activeId, profiles };
}
