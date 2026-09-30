/**
 * Gate: gong sul «bianco» (STOP) → piccolo silenzio → poi musica %.
 * I listener partono solo dopo coda gong + gap.
 */

export const QUIZ_GONG_POST_GAP_MS = 850;

type Listener = () => void;

let busy = false;
let releaseTimer: number | null = null;
const waiters = new Set<Listener>();

function flushWaiters(): void {
  const pending = [...waiters];
  waiters.clear();
  for (const cb of pending) {
    try {
      cb();
    } catch {
      /* ignore listener errors */
    }
  }
}

/** Chiamato all’attacco del gong (lock risposte / STOP). */
export function markQuizGongStarted(): void {
  busy = true;
  if (releaseTimer != null) {
    window.clearTimeout(releaseTimer);
    releaseTimer = null;
  }
}

/** Fine file gong → aspetta gap, poi sblocca la musica risultati. */
export function markQuizGongEnded(): void {
  if (typeof window === "undefined") {
    busy = false;
    flushWaiters();
    return;
  }
  if (releaseTimer != null) window.clearTimeout(releaseTimer);
  releaseTimer = window.setTimeout(() => {
    releaseTimer = null;
    busy = false;
    flushWaiters();
  }, QUIZ_GONG_POST_GAP_MS);
}

/**
 * Esegue `cb` subito se il gong non è in corso / già scaricato,
 * altrimenti dopo gong + gap.
 */
export function whenQuizGongCleared(cb: Listener): () => void {
  if (!busy) {
    cb();
    return () => undefined;
  }
  waiters.add(cb);
  return () => {
    waiters.delete(cb);
  };
}

export function isQuizGongGateBusy(): boolean {
  return busy;
}

/** Test / reset. */
export function resetQuizGongGate(): void {
  busy = false;
  if (releaseTimer != null) {
    window.clearTimeout(releaseTimer);
    releaseTimer = null;
  }
  waiters.clear();
}
