export type CasaClockPrefs = {
  showElapsed: boolean;
  showExact: boolean;
  originMs: number;
};

export const DEFAULT_CASA_CLOCK: CasaClockPrefs = {
  showElapsed: true,
  showExact: true,
  originMs: 0,
};

const storageKey = (eventCode: string) =>
  `lr_casa_clock_${eventCode.toUpperCase()}`;

export function loadClock(eventCode: string): CasaClockPrefs {
  if (typeof window === "undefined") return DEFAULT_CASA_CLOCK;
  try {
    const raw = localStorage.getItem(storageKey(eventCode));
    if (!raw) return { ...DEFAULT_CASA_CLOCK, originMs: Date.now() };
    const parsed = JSON.parse(raw) as Partial<CasaClockPrefs>;
    return {
      ...DEFAULT_CASA_CLOCK,
      ...parsed,
      originMs: parsed.originMs || Date.now(),
    };
  } catch {
    return { ...DEFAULT_CASA_CLOCK, originMs: Date.now() };
  }
}

export function saveClock(eventCode: string, prefs: CasaClockPrefs): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(storageKey(eventCode), JSON.stringify(prefs));
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function formatExact(ms: number) {
  const d = new Date(ms);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function formatElapsed(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}
