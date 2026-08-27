export type PlayerQueuedActionKind = "answer" | "vote";

export interface PlayerAnswerAction {
  id: string;
  kind: "answer";
  eventSlug: string;
  participantId: string;
  questionId: string;
  optionId: string;
  optionLabel?: string;
  elapsedSeconds?: number;
  createdAt: number;
}

export interface PlayerVoteAction {
  id: string;
  kind: "vote";
  eventSlug: string;
  participantId: string;
  pairId: string;
  createdAt: number;
}

export type PlayerQueuedAction = PlayerAnswerAction | PlayerVoteAction;

export type PlayerActionFlushOutcome = "acked" | "dropped" | "retry";

export interface PlayerActionSendResult {
  ok: boolean;
  queued: boolean;
  error?: string;
}

function queueKey(eventSlug: string): string {
  return `lr_player_action_queue_${eventSlug}`;
}

export function playerActionId(action: Pick<PlayerQueuedAction, "kind"> & {
  questionId?: string;
  participantId?: string;
}): string {
  if (action.kind === "answer") {
    return `answer:${action.questionId ?? ""}`;
  }
  return `vote:${action.participantId ?? ""}`;
}

export function classifyPlayerActionResponse(
  kind: PlayerQueuedActionKind,
  status: number,
): PlayerActionFlushOutcome {
  if (status >= 200 && status < 300) return "acked";
  if (kind === "answer" && status === 409) return "acked";
  if (
    status === 400 ||
    status === 403 ||
    status === 404 ||
    status === 409 ||
    status === 422
  ) {
    return "dropped";
  }
  return "retry";
}

function getLocalStorage(): Storage | null {
  try {
    if (typeof localStorage === "undefined") return null;
    return localStorage;
  } catch {
    return null;
  }
}

function readRawQueue(eventSlug: string): PlayerQueuedAction[] {
  const storage = getLocalStorage();
  if (!storage) return [];
  try {
    const raw = storage.getItem(queueKey(eventSlug));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isQueuedAction);
  } catch {
    return [];
  }
}

function writeRawQueue(eventSlug: string, items: PlayerQueuedAction[]): void {
  const storage = getLocalStorage();
  if (!storage) return;
  try {
    if (items.length === 0) {
      storage.removeItem(queueKey(eventSlug));
      return;
    }
    storage.setItem(queueKey(eventSlug), JSON.stringify(items));
  } catch {
    // quota / private mode
  }
}

function isQueuedAction(value: unknown): value is PlayerQueuedAction {
  if (!value || typeof value !== "object") return false;
  const row = value as Partial<PlayerQueuedAction>;
  if (row.kind === "answer") {
    return (
      typeof row.id === "string" &&
      typeof row.eventSlug === "string" &&
      typeof row.participantId === "string" &&
      typeof row.questionId === "string" &&
      typeof row.optionId === "string"
    );
  }
  if (row.kind === "vote") {
    return (
      typeof row.id === "string" &&
      typeof row.eventSlug === "string" &&
      typeof row.participantId === "string" &&
      typeof row.pairId === "string"
    );
  }
  return false;
}

export function readPlayerActionQueue(eventSlug: string): PlayerQueuedAction[] {
  return readRawQueue(eventSlug);
}

export function enqueuePlayerAction(action: PlayerQueuedAction): void {
  const items = readRawQueue(action.eventSlug).filter(
    (item) => item.id !== action.id,
  );
  items.push(action);
  writeRawQueue(action.eventSlug, items);
}

export function removePlayerAction(eventSlug: string, id: string): void {
  writeRawQueue(
    eventSlug,
    readRawQueue(eventSlug).filter((item) => item.id !== id),
  );
}

function actionUrl(action: PlayerQueuedAction): string {
  const slug = encodeURIComponent(action.eventSlug);
  if (action.kind === "answer") {
    return `/api/events/${slug}/answers`;
  }
  return `/api/events/${slug}/voting`;
}

function actionBody(action: PlayerQueuedAction): string {
  if (action.kind === "answer") {
    return JSON.stringify({
      participantId: action.participantId,
      questionId: action.questionId,
      optionId: action.optionId,
    });
  }
  return JSON.stringify({
    action: "vote",
    participantId: action.participantId,
    pairId: action.pairId,
  });
}

export async function sendPlayerAction(
  action: PlayerQueuedAction,
  fetchImpl: typeof fetch = fetch,
): Promise<{ outcome: PlayerActionFlushOutcome; error?: string }> {
  try {
    const res = await fetchImpl(actionUrl(action), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: actionBody(action),
      keepalive: true,
      cache: "no-store",
    });

    const outcome = classifyPlayerActionResponse(action.kind, res.status);
    if (outcome === "acked") {
      return { outcome };
    }

    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    return {
      outcome,
      error: data?.error ?? (outcome === "dropped" ? "Azione non accettata." : undefined),
    };
  } catch {
    return { outcome: "retry" };
  }
}

export async function enqueueAndSendPlayerAction(
  action: Omit<PlayerAnswerAction, "id" | "createdAt"> | Omit<PlayerVoteAction, "id" | "createdAt">,
  fetchImpl: typeof fetch = fetch,
): Promise<PlayerActionSendResult> {
  const queued: PlayerQueuedAction =
    action.kind === "answer"
      ? {
          ...action,
          id: playerActionId(action),
          createdAt: Date.now(),
        }
      : {
          ...action,
          id: playerActionId(action),
          createdAt: Date.now(),
        };

  enqueuePlayerAction(queued);
  const { outcome, error } = await sendPlayerAction(queued, fetchImpl);

  if (outcome === "acked") {
    removePlayerAction(queued.eventSlug, queued.id);
    return { ok: true, queued: false };
  }

  if (outcome === "dropped") {
    removePlayerAction(queued.eventSlug, queued.id);
    return { ok: false, queued: false, error: error ?? "Azione non accettata." };
  }

  return { ok: true, queued: true };
}

export async function flushPlayerActionQueue(
  eventSlug: string,
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  const items = readRawQueue(eventSlug);
  for (const item of items) {
    const { outcome } = await sendPlayerAction(item, fetchImpl);
    if (outcome !== "retry") {
      removePlayerAction(eventSlug, item.id);
    }
  }
}
