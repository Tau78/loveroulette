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
  /** Custom pixel size; when set, overrides the discrete size box. */
  w?: number;
  h?: number;
  /** Collapsed to header only; default open. */
  collapsed?: boolean;
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
  /** Bump to reset Default profile to the new factory packing. */
  version: number;
  activeId: string;
  profiles: CasaLayoutProfile[];
};

export const STORAGE_KEY = "lr_casa_layouts";
export const LAYOUT_VERSION = 2;
export const MAX_CUSTOM_PROFILES = 5;
export const NAME_MIN = 1;
export const NAME_MAX = 24;
export const DEFAULT_PROFILE_ID = "default";
export const CANVAS_WIDTH = 1200;
export const CANVAS_HEIGHT = 700;
export const WIDGET_MIN_W = 120;
export const WIDGET_MIN_H = 80;
/** Header-only height when a widget is collapsed. */
export const WIDGET_COLLAPSED_H = 36;

/** Canonical list — gallery / registry must cover every entry. */
export const ALL_WIDGET_TYPES: readonly CasaWidgetType[] = [
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
] as const;

const WIDGET_TYPES: ReadonlySet<CasaWidgetType> = new Set(ALL_WIDGET_TYPES);

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

/**
 * Packed 3-column deck filling the 1200×700 logical canvas (8px margin/gap).
 * Custom w/h keep the board full; `size` is the nearest discrete badge.
 */
export const FACTORY_DEFAULT_WIDGETS: Omit<CasaWidgetInstance, "id">[] = [
  { type: "settings", x: 8, y: 8, size: "S", w: 280, h: 112 },
  { type: "players", x: 8, y: 128, size: "M", w: 280, h: 200 },
  { type: "messages", x: 8, y: 336, size: "M", w: 280, h: 200 },
  { type: "clock", x: 8, y: 544, size: "S", w: 280, h: 148 },
  { type: "projector", x: 296, y: 8, size: "XL", w: 608, h: 684 },
  { type: "audio", x: 912, y: 8, size: "S", w: 280, h: 112 },
  { type: "audio_bed", x: 912, y: 128, size: "M", w: 280, h: 152 },
  { type: "pad", x: 912, y: 288, size: "L", w: 280, h: 280 },
  { type: "avanti", x: 912, y: 576, size: "S", w: 280, h: 116 },
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

/** Resolved pixel box for a widget (custom w/h or discrete size). */
export function widgetPx(w: Pick<CasaWidgetInstance, "size" | "w" | "h">): {
  w: number;
  h: number;
} {
  if (
    typeof w.w === "number" &&
    Number.isFinite(w.w) &&
    typeof w.h === "number" &&
    Number.isFinite(w.h)
  ) {
    return {
      w: Math.max(WIDGET_MIN_W, Math.round(w.w)),
      h: Math.max(WIDGET_MIN_H, Math.round(w.h)),
    };
  }
  return sizeToPx(w.size);
}

/** Layout box on the deck (collapsed widgets shrink to header height). */
export function widgetLayoutPx(
  w: Pick<CasaWidgetInstance, "size" | "w" | "h" | "collapsed">,
): { w: number; h: number } {
  const px = widgetPx(w);
  if (w.collapsed) return { w: px.w, h: WIDGET_COLLAPSED_H };
  return px;
}

/** Nearest discrete size label for a pixel box (badge / cycle start). */
export function nearestSize(w: number, h: number): CasaWidgetSize {
  const area = Math.max(1, w) * Math.max(1, h);
  let best: CasaWidgetSize = "M";
  let bestDelta = Infinity;
  for (const size of WIDGET_SIZES) {
    const px = SIZE_PX[size];
    const delta = Math.abs(px.w * px.h - area);
    if (delta < bestDelta) {
      bestDelta = delta;
      best = size;
    }
  }
  return best;
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
    version: LAYOUT_VERSION,
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

function sanitizeDim(raw: unknown, fallback?: number): number | undefined {
  if (typeof raw !== "number" || !Number.isFinite(raw)) return fallback;
  return Math.max(WIDGET_MIN_W, Math.min(CANVAS_WIDTH, Math.round(raw)));
}

function sanitizeDimH(raw: unknown, fallback?: number): number | undefined {
  if (typeof raw !== "number" || !Number.isFinite(raw)) return fallback;
  return Math.max(WIDGET_MIN_H, Math.min(CANVAS_HEIGHT, Math.round(raw)));
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
    const size = clampSize(w.size);
    const ww = sanitizeDim(w.w);
    const hh = sanitizeDimH(w.h);
    const entry: CasaWidgetInstance = {
      id,
      type: w.type as CasaWidgetType,
      x,
      y,
      size,
    };
    if (ww !== undefined && hh !== undefined) {
      entry.w = ww;
      entry.h = hh;
      entry.size = nearestSize(ww, hh);
    }
    if (w.collapsed === true) entry.collapsed = true;
    out.push(entry);
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

  const version =
    typeof data.version === "number" && Number.isFinite(data.version)
      ? data.version
      : 0;

  let state: CasaLayoutsState = { version, activeId, profiles: trimmed };

  // Layout packing / canvas contract changed — refresh Default only.
  if (state.version < LAYOUT_VERSION) {
    state = {
      ...resetDefaultToFactory(state),
      version: LAYOUT_VERSION,
    };
  }

  return state;
}

export function loadLayouts(): CasaLayoutsState {
  if (typeof window === "undefined") return createDefaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultState();
    const parsed = JSON.parse(raw) as Partial<CasaLayoutsState>;
    const state = sanitizeState(parsed);
    // Persist migration (version bump / Default refresh) so it runs once.
    if (
      typeof parsed.version !== "number" ||
      parsed.version < LAYOUT_VERSION
    ) {
      saveLayouts(state);
    }
    return state;
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
      version: state.version ?? LAYOUT_VERSION,
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
  return { state: { ...state, activeId, profiles } };
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
  return { ...state, version: LAYOUT_VERSION, activeId, profiles };
}
