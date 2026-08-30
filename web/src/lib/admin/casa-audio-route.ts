export type CasaAudioRouteKind = "local" | "projector" | "vercel";

export type CasaAudioRoute = {
  kind: CasaAudioRouteKind;
  /** HTMLMediaElement.setSinkId — only for kind=local. */
  sinkId?: string;
  label: string;
};

export const CASA_AUDIO_ROUTE_KEY = "lr_casa_audio_route";

export const DEFAULT_CASA_AUDIO_ROUTE: CasaAudioRoute = {
  kind: "local",
  sinkId: "default",
  label: "Questo dispositivo",
};

export const PROJECTOR_AUDIO_ROUTE: CasaAudioRoute = {
  kind: "projector",
  label: "Proiettore",
};

export const VERCEL_AUDIO_ROUTE: CasaAudioRoute = {
  kind: "vercel",
  label: "Vercel",
};

export function isRemoteAudioRoute(route: CasaAudioRoute): boolean {
  return route.kind === "projector" || route.kind === "vercel";
}

export function parseCasaAudioRoute(raw: unknown): CasaAudioRoute {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_CASA_AUDIO_ROUTE };
  const rec = raw as Record<string, unknown>;
  if (rec.kind === "projector") return { ...PROJECTOR_AUDIO_ROUTE };
  if (rec.kind === "vercel") return { ...VERCEL_AUDIO_ROUTE };
  const sinkId = typeof rec.sinkId === "string" && rec.sinkId ? rec.sinkId : "default";
  const label =
    typeof rec.label === "string" && rec.label.trim()
      ? rec.label.trim()
      : sinkId === "default"
        ? DEFAULT_CASA_AUDIO_ROUTE.label
        : sinkId;
  return { kind: "local", sinkId, label };
}

export function loadCasaAudioRoute(): CasaAudioRoute {
  if (typeof window === "undefined") return { ...DEFAULT_CASA_AUDIO_ROUTE };
  try {
    const raw = window.localStorage.getItem(CASA_AUDIO_ROUTE_KEY);
    if (!raw) return { ...DEFAULT_CASA_AUDIO_ROUTE };
    return parseCasaAudioRoute(JSON.parse(raw) as unknown);
  } catch {
    return { ...DEFAULT_CASA_AUDIO_ROUTE };
  }
}

export function saveCasaAudioRoute(route: CasaAudioRoute): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CASA_AUDIO_ROUTE_KEY, JSON.stringify(route));
}

export type CasaAudioOutputOption = {
  id: string;
  route: CasaAudioRoute;
};

export async function listCasaAudioOutputs(): Promise<CasaAudioOutputOption[]> {
  const local: CasaAudioOutputOption[] = [
    { id: "local:default", route: { ...DEFAULT_CASA_AUDIO_ROUTE } },
  ];

  if (typeof navigator !== "undefined" && navigator.mediaDevices?.enumerateDevices) {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      for (const device of devices) {
        if (device.kind !== "audiooutput") continue;
        const sinkId = device.deviceId || "default";
        if (sinkId === "default" || sinkId === "communications") continue;
        const label = device.label.trim() || `Uscita ${sinkId.slice(0, 6)}`;
        local.push({
          id: `local:${sinkId}`,
          route: { kind: "local", sinkId, label },
        });
      }
    } catch {
      /* Safari / iOS: lista vuota, resta "Questo dispositivo" */
    }
  }

  return [
    ...local,
    { id: "projector", route: { ...PROJECTOR_AUDIO_ROUTE } },
    { id: "vercel", route: { ...VERCEL_AUDIO_ROUTE } },
  ];
}

type MediaDevicesWithOutputPicker = MediaDevices & {
  selectAudioOutput?: (options?: { deviceId?: string }) => Promise<MediaDeviceInfo>;
};

export function canPickCasaLocalAudioOutput(): boolean {
  if (typeof navigator === "undefined") return false;
  const devices = navigator.mediaDevices as MediaDevicesWithOutputPicker | undefined;
  return typeof devices?.selectAudioOutput === "function";
}

export async function pickCasaLocalAudioOutput(): Promise<CasaAudioRoute | null> {
  const devices = navigator.mediaDevices as MediaDevicesWithOutputPicker | undefined;
  if (typeof devices?.selectAudioOutput !== "function") return null;
  try {
    const device = await devices.selectAudioOutput();
    const sinkId = device.deviceId || "default";
    return {
      kind: "local",
      sinkId,
      label: device.label.trim() || (sinkId === "default" ? DEFAULT_CASA_AUDIO_ROUTE.label : sinkId),
    };
  } catch {
    return null;
  }
}

export function casaAudioOptionId(route: CasaAudioRoute): string {
  if (route.kind === "projector") return "projector";
  if (route.kind === "vercel") return "vercel";
  return `local:${route.sinkId || "default"}`;
}

type Sinkable = HTMLMediaElement & {
  setSinkId?: (id: string) => Promise<void>;
};

export async function applyAudioSink(
  el: HTMLMediaElement | null,
  route: CasaAudioRoute,
): Promise<void> {
  if (!el || isRemoteAudioRoute(route)) return;
  const sink = (el as Sinkable).setSinkId;
  if (typeof sink !== "function") return;
  const id = route.sinkId && route.sinkId !== "default" ? route.sinkId : "";
  try {
    await sink.call(el, id);
  } catch {
    /* iOS WebView often lacks setSinkId */
  }
}
