/**
 * Scale tipografiche Schermo (proiettore) e Plancia (Casa).
 * Default schermo 1.8 (= +50% rispetto al default precedente 1.2).
 * Default plancia 1.5 (= +50% rispetto a 1).
 * Cambiare i default qui oppure dalle Impostazioni.
 */

export const DISPLAY_TYPE_SCALE_DEFAULT = 1.8 as const;
export const PLANCIA_TYPE_SCALE_DEFAULT = 1.5 as const;

export const TYPE_SCALE_MIN = 0.8 as const;
export const TYPE_SCALE_MAX = 2 as const;

/** Valori selezionabili nello stepper impostazioni. */
export const TYPE_SCALE_PRESETS = [
  0.8, 0.9, 1, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2,
] as const;

export type TypeScalePreset = (typeof TYPE_SCALE_PRESETS)[number];

export const DISPLAY_TYPE_SCALE_CSS_VAR = "--lr-display-type-scale";
export const PLANCIA_TYPE_SCALE_CSS_VAR = "--casa-type-scale";

export type TypeScalePrefs = {
  display: number;
  plancia: number;
};

export const DEFAULT_TYPE_SCALE_PREFS: TypeScalePrefs = {
  display: DISPLAY_TYPE_SCALE_DEFAULT,
  plancia: PLANCIA_TYPE_SCALE_DEFAULT,
};

const storageKey = (eventCode: string) =>
  `lr_type_scale_v2_${eventCode.toUpperCase()}`;

export function clampTypeScale(value: number): number {
  if (!Number.isFinite(value)) return DISPLAY_TYPE_SCALE_DEFAULT;
  const rounded = Math.round(value * 10) / 10;
  return Math.min(TYPE_SCALE_MAX, Math.max(TYPE_SCALE_MIN, rounded));
}

export function snapTypeScale(value: number): TypeScalePreset {
  const clamped = clampTypeScale(value);
  let best: TypeScalePreset = TYPE_SCALE_PRESETS[0];
  let bestDist = Math.abs(best - clamped);
  for (const preset of TYPE_SCALE_PRESETS) {
    const dist = Math.abs(preset - clamped);
    if (dist < bestDist) {
      best = preset;
      bestDist = dist;
    }
  }
  return best;
}

export function formatTypeScalePercent(scale: number): string {
  return `${Math.round(clampTypeScale(scale) * 100)}%`;
}

export function loadTypeScalePrefs(eventCode: string): TypeScalePrefs {
  if (typeof window === "undefined") return { ...DEFAULT_TYPE_SCALE_PREFS };
  try {
    const raw = localStorage.getItem(storageKey(eventCode));
    if (!raw) return { ...DEFAULT_TYPE_SCALE_PREFS };
    const parsed = JSON.parse(raw) as Partial<TypeScalePrefs>;
    return {
      display: clampTypeScale(
        typeof parsed.display === "number"
          ? parsed.display
          : DISPLAY_TYPE_SCALE_DEFAULT,
      ),
      plancia: clampTypeScale(
        typeof parsed.plancia === "number"
          ? parsed.plancia
          : PLANCIA_TYPE_SCALE_DEFAULT,
      ),
    };
  } catch {
    return { ...DEFAULT_TYPE_SCALE_PREFS };
  }
}

export function saveTypeScalePrefs(
  eventCode: string,
  prefs: TypeScalePrefs,
): TypeScalePrefs {
  const next: TypeScalePrefs = {
    display: clampTypeScale(prefs.display),
    plancia: clampTypeScale(prefs.plancia),
  };
  if (typeof window !== "undefined") {
    localStorage.setItem(storageKey(eventCode), JSON.stringify(next));
  }
  return next;
}

/**
 * Box inverso per il fallback `transform: scale` (motori senza `zoom`).
 * Chromium non lo usa: lì `width/height: 100%` + `zoom` basta.
 * `inverse × scale = 100`.
 */
export function casaFitInversePercent(scale: number): number {
  return 100 / clampTypeScale(scale);
}

export function typeScaleStyleVars(prefs: Partial<TypeScalePrefs>): {
  [DISPLAY_TYPE_SCALE_CSS_VAR]?: string;
  [PLANCIA_TYPE_SCALE_CSS_VAR]?: string;
} {
  const style: {
    [DISPLAY_TYPE_SCALE_CSS_VAR]?: string;
    [PLANCIA_TYPE_SCALE_CSS_VAR]?: string;
  } = {};
  if (prefs.display != null) {
    style[DISPLAY_TYPE_SCALE_CSS_VAR] = String(clampTypeScale(prefs.display));
  }
  if (prefs.plancia != null) {
    style[PLANCIA_TYPE_SCALE_CSS_VAR] = String(clampTypeScale(prefs.plancia));
  }
  return style;
}
