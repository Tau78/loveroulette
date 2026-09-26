/**
 * Client HTTP verso le API Love Roulette esistenti.
 *
 * - Browser (`npm run dev`): path relativi `/api/...` via proxy Vite → host
 *   configurato (default Vercel). Evita CORS.
 * - Tauri: `@tauri-apps/plugin-http` con URL assoluto (niente CORS browser).
 *
 * Nessuna chiave Supabase nel client.
 */

import type { EventSnapshot, QuizSnapshot, SessionPayload } from "./types";

export const DEFAULT_HOST = "https://loveroulette.vercel.app";

export function normalizeHost(raw: string): string {
  const trimmed = raw.trim().replace(/\/+$/, "");
  if (!trimmed) return DEFAULT_HOST;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function isTauriRuntime(): boolean {
  return (
    typeof window !== "undefined" &&
    // Tauri 2 injects this; keep loose for HMR / tests
    Boolean(
      (window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__,
    )
  );
}

export function animatorAuthHeaders(pin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (pin) {
    headers["X-Animator-Pin"] = pin;
  }
  return headers;
}

function eventsPath(code: string, suffix = ""): string {
  return `/api/events/${encodeURIComponent(code)}${suffix}`;
}

type FetchLike = (
  input: string,
  init?: RequestInit,
) => Promise<Response>;

async function resolveFetch(): Promise<FetchLike> {
  if (isTauriRuntime()) {
    const mod = await import("@tauri-apps/plugin-http");
    return mod.fetch as FetchLike;
  }
  return globalThis.fetch.bind(globalThis);
}

/**
 * Browser: relative `/api` (Vite proxy).
 * Tauri: absolute `{host}/api/...`.
 */
export function resolveRequestUrl(host: string, path: string): string {
  if (isTauriRuntime()) {
    return `${normalizeHost(host)}${path}`;
  }
  // Dev/browser: always hit Vite proxy (see vite.config.ts).
  // Il campo Host in toolbar controlla preview/proiettore; in browser
  // l'API passa dal proxy verso DEFAULT_HOST (o VITE_API_PROXY_TARGET).
  return path;
}

export async function apiFetch(
  host: string,
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const fetchFn = await resolveFetch();
  const url = resolveRequestUrl(host, path);
  return fetchFn(url, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.headers as Record<string, string> | undefined),
    },
  });
}

function parseQuizState(raw: unknown): QuizSnapshot | null {
  if (!raw || typeof raw !== "object") return null;
  const q = raw as Record<string, unknown>;
  return {
    displayPhase: typeof q.displayPhase === "string" ? q.displayPhase : null,
    currentIndex: typeof q.currentIndex === "number" ? q.currentIndex : null,
    totalQuestions:
      typeof q.total === "number"
        ? q.total
        : typeof q.totalQuestions === "number"
          ? q.totalQuestions
          : Array.isArray(q.questionIds)
            ? q.questionIds.length
            : null,
    updatedAt: typeof q.updatedAt === "string" ? q.updatedAt : null,
  };
}

export async function fetchEventSnapshot(
  host: string,
  code: string,
): Promise<EventSnapshot> {
  const res = await apiFetch(host, eventsPath(code));
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(body?.error ?? `Evento non trovato (${res.status}).`);
  }
  const data = (await res.json()) as Record<string, unknown>;
  return {
    id: String(data.id ?? ""),
    slug: String(data.slug ?? code),
    title: String(data.title ?? code),
    runtimeState: String(data.runtimeState ?? "lobby"),
    sessionId:
      typeof data.sessionId === "string" || data.sessionId === null
        ? (data.sessionId as string | null)
        : null,
    animatorPinRequired: Boolean(data.animatorPinRequired),
    quizState: parseQuizState(data.quizState),
  };
}

export async function fetchSession(
  host: string,
  code: string,
): Promise<SessionPayload> {
  const res = await apiFetch(host, eventsPath(code, "/session"));
  if (!res.ok) {
    throw new Error(`Sessione non disponibile (${res.status}).`);
  }
  const data = (await res.json()) as {
    runtimeState?: string;
    sessionId?: string | null;
    stats?: {
      onlineCount?: number;
      participantCount?: number;
      pairProgress?: number | null;
    };
  };
  return {
    runtimeState: data.runtimeState ?? "lobby",
    sessionId: data.sessionId ?? null,
    stats: {
      onlineCount: data.stats?.onlineCount ?? 0,
      participantCount: data.stats?.participantCount ?? 0,
      pairProgress: data.stats?.pairProgress ?? null,
    },
  };
}

export async function verifyAnimatorPin(
  host: string,
  code: string,
  pin: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await apiFetch(host, eventsPath(code, "/animator-pin"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pin }),
  });
  const data = (await res.json().catch(() => null)) as {
    error?: string;
  } | null;
  if (!res.ok) {
    return { ok: false, error: data?.error ?? "PIN non valido." };
  }
  return { ok: true };
}

/**
 * Solo advance quiz via API — NON è il binario AVANTI completo
 * (sigla/slide/matching restano sulla plancia web).
 */
export async function postQuizAdvance(
  host: string,
  code: string,
  pin: string | null,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await apiFetch(host, eventsPath(code, "/quiz"), {
    method: "POST",
    headers: animatorAuthHeaders(pin),
    body: JSON.stringify({ action: "advance" }),
  });
  const data = (await res.json().catch(() => null)) as {
    error?: string;
  } | null;
  if (!res.ok) {
    return { ok: false, error: data?.error ?? "Advance quiz non riuscito." };
  }
  return { ok: true };
}

export function displayEmbedUrl(host: string, code: string): string {
  return `${normalizeHost(host)}/s/${encodeURIComponent(code)}/display?embed=1`;
}

export function displayPresentUrl(host: string, code: string): string {
  return `${normalizeHost(host)}/s/${encodeURIComponent(code)}/display?present=1`;
}

/** Poll ms: 350 in quiz/finals, altrimenti 3s — allineato a useLoveRouletteSession. */
export function pollIntervalMs(runtimeState: string | null): number {
  if (runtimeState === "quiz" || runtimeState === "finals") return 350;
  return 3000;
}

export const PIN_STORAGE_PREFIX = "lr.desktop.animator_pin_";

export function pinStorageKey(code: string): string {
  return `${PIN_STORAGE_PREFIX}${code.toUpperCase()}`;
}

export function readStoredPin(code: string): string {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem(pinStorageKey(code)) ?? "";
}

export function storePin(code: string, pin: string): void {
  sessionStorage.setItem(pinStorageKey(code), pin);
}

export function clearStoredPin(code: string): void {
  sessionStorage.removeItem(pinStorageKey(code));
}
