const PIN_STORAGE_PREFIX = "lr_animator_pin_";

export function animatorPinStorageKey(eventCode: string): string {
  return `${PIN_STORAGE_PREFIX}${eventCode.toUpperCase()}`;
}

export function readStoredAnimatorPin(eventCode: string): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(animatorPinStorageKey(eventCode));
}

export function storeAnimatorPin(eventCode: string, pin: string): void {
  sessionStorage.setItem(animatorPinStorageKey(eventCode), pin);
}

export function clearStoredAnimatorPin(eventCode: string): void {
  sessionStorage.removeItem(animatorPinStorageKey(eventCode));
}

export async function verifyAnimatorPinApi(
  eventCode: string,
  pin: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const response = await fetch(
    `/api/events/${encodeURIComponent(eventCode)}/animator-pin`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    },
  );

  const data = (await response.json().catch(() => null)) as {
    error?: string;
  } | null;

  if (!response.ok) {
    return {
      ok: false,
      error: data?.error ?? "PIN non valido.",
    };
  }

  return { ok: true };
}

export function isInvalidAnimatorPinError(message: string): boolean {
  const lower = message.toLowerCase();
  return lower.includes("invalid animator pin") || lower.includes("pin non valido");
}

export function animatorAuthHeaders(pin: string | null): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (pin) {
    headers["X-Animator-Pin"] = pin;
  }
  return headers;
}

export async function postQuizAction(
  eventCode: string,
  body: {
    action:
      | "start"
      | "advance"
      | "back"
      | "finish"
      | "setAutoplaySeconds"
      | "setAutoplayEnabled"
      | "tick"
      | "skipPhase"
      | "setPhase";
    autoplaySeconds?: number;
    questionCount?: number;
    questionSeconds?: number;
    enabled?: boolean;
    displayPhase?:
      | "start_countdown"
      | "theme_intro"
      | "question"
      | "answers"
      | "results"
      | "next_question";
  },
  pin: string | null,
): Promise<Response> {
  return fetch(`/api/events/${encodeURIComponent(eventCode)}/quiz`, {
    method: "POST",
    headers: animatorAuthHeaders(pin),
    body: JSON.stringify(body),
  });
}

export async function postDisplayAudioStart(
  eventCode: string,
  pin: string | null,
): Promise<Response> {
  return fetch(
    `/api/events/${encodeURIComponent(eventCode)}/display-audio`,
    {
      method: "POST",
      headers: animatorAuthHeaders(pin),
    },
  );
}

export async function patchSessionRuntimeState(
  eventCode: string,
  runtimeState: string,
  pin: string | null,
): Promise<Response> {
  return fetch(`/api/events/${encodeURIComponent(eventCode)}/session`, {
    method: "PATCH",
    headers: animatorAuthHeaders(pin),
    body: JSON.stringify({ runtimeState }),
  });
}

export async function patchEventConfig(
  eventCode: string,
  body: { badgeRequired: boolean },
  pin: string | null,
): Promise<Response> {
  return fetch(`/api/events/${encodeURIComponent(eventCode)}/config`, {
    method: "PATCH",
    headers: animatorAuthHeaders(pin),
    body: JSON.stringify(body),
  });
}

export async function postDisplayCommand(
  eventCode: string,
  body: Record<string, string>,
  pin: string | null,
): Promise<Response> {
  return fetch(`/api/events/${encodeURIComponent(eventCode)}/display`, {
    method: "POST",
    headers: animatorAuthHeaders(pin),
    body: JSON.stringify(body),
  });
}

export async function postResetEvent(
  eventCode: string,
  body: { clearParticipants?: boolean },
  pin: string | null,
): Promise<Response> {
  return fetch(`/api/events/${encodeURIComponent(eventCode)}/reset`, {
    method: "POST",
    headers: animatorAuthHeaders(pin),
    body: JSON.stringify(body),
  });
}

export async function postVotingAction(
  eventCode: string,
  body:
    | { action: "start_challenge"; challengeId: string }
    | { action: "advance" }
    | { action: "tick" }
    | { action: "proclaim_winner" }
    | { action: "simulate_bot_votes" }
    | { action: "vote"; participantId: string; pairId: string }
    | { action: "close" },
  pin: string | null,
): Promise<Response> {
  return fetch(`/api/events/${encodeURIComponent(eventCode)}/voting`, {
    method: "POST",
    headers: animatorAuthHeaders(pin),
    body: JSON.stringify(body),
  });
}

export async function postEliminatePair(
  eventCode: string,
  body: { mode: "next" | "auto_to_finalists" },
  pin: string | null,
): Promise<Response> {
  return fetch(`/api/events/${encodeURIComponent(eventCode)}/eliminate`, {
    method: "POST",
    headers: animatorAuthHeaders(pin),
    body: JSON.stringify(body),
  });
}

export async function postExtractCouple(
  eventCode: string,
  body: { mode?: "random" | "ranked" | "hybrid" },
  pin: string | null,
): Promise<Response> {
  return fetch(`/api/events/${encodeURIComponent(eventCode)}/extract`, {
    method: "POST",
    headers: animatorAuthHeaders(pin),
    body: JSON.stringify(body),
  });
}

export async function fetchParticipants(
  eventCode: string,
  pin: string | null,
): Promise<Response> {
  return fetch(`/api/events/${encodeURIComponent(eventCode)}/participants`, {
    headers: animatorAuthHeaders(pin),
  });
}

export async function createParticipant(
  eventCode: string,
  body: {
    nickname: string;
    gender: "male" | "female";
    badgeCode?: string | null;
  },
  pin: string | null,
): Promise<Response> {
  return fetch(`/api/events/${encodeURIComponent(eventCode)}/participants`, {
    method: "POST",
    headers: animatorAuthHeaders(pin),
    body: JSON.stringify(body),
  });
}

export async function updateParticipant(
  eventCode: string,
  participantId: string,
  body: {
    nickname?: string;
    gender?: "male" | "female";
    badgeCode?: string | null;
    forceOffline?: boolean;
  },
  pin: string | null,
): Promise<Response> {
  return fetch(
    `/api/events/${encodeURIComponent(eventCode)}/participants/${encodeURIComponent(participantId)}`,
    {
      method: "PATCH",
      headers: animatorAuthHeaders(pin),
      body: JSON.stringify(body),
    },
  );
}

export async function deleteParticipant(
  eventCode: string,
  participantId: string,
  pin: string | null,
): Promise<Response> {
  return fetch(
    `/api/events/${encodeURIComponent(eventCode)}/participants/${encodeURIComponent(participantId)}`,
    {
      method: "DELETE",
      headers: animatorAuthHeaders(pin),
    },
  );
}

export async function postSimulatePlayers(
  eventCode: string,
  body: { coupleCount?: number; replace?: boolean; goToMatching?: boolean },
  pin: string | null,
): Promise<Response> {
  return fetch(
    `/api/events/${encodeURIComponent(eventCode)}/simulate-players`,
    {
      method: "POST",
      headers: animatorAuthHeaders(pin),
      body: JSON.stringify(body),
    },
  );
}

/** URL per simulare il terminale giocatore (nuova finestra). */
export function playerTerminalTestUrl(
  eventCode: string,
  player: {
    id: string;
    nickname: string;
    gender: "male" | "female";
    badge_code: string | null;
  },
): string {
  const params = new URLSearchParams({
    animatorTest: "1",
    pid: player.id,
    nick: player.nickname,
    gender: player.gender,
    badge: player.badge_code ?? "",
  });
  if (typeof window !== "undefined") {
    return `${window.location.origin}/s/${eventCode}/play?${params.toString()}`;
  }
  return `/s/${eventCode}/play?${params.toString()}`;
}

export function clientJoinUrl(eventSlug: string): string {
  if (typeof window === "undefined") {
    return `/s/${eventSlug}/play`;
  }
  return `${window.location.origin}/s/${eventSlug}/play`;
}
