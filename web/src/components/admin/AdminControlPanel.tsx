"use client";

import { useState } from "react";
import { useEventQuestionCount } from "@/hooks/useEventQuestionCount";
import {
  CHALLENGE_LABELS,
  type ChallengeId,
  type EventState,
  type ExtractionMode,
} from "@/lib/types";
import {
  isInvalidAnimatorPinError,
  patchSessionRuntimeState,
  postExtractCouple,
  postEliminatePair,
  postQuizAction,
  postVotingAction,
} from "@/lib/admin/animator-api";
import { AdminPanelShell } from "@/components/admin/AdminDeckPanel";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { runtimeStateLabel } from "@/lib/events";
import type { QuizSessionState } from "@/lib/musicpro/quiz-state";

interface AdminControlPanelProps {
  eventCode: string;
  runtimeState: EventState;
  animatorPin: string | null;
  initialExtractionMode?: ExtractionMode;
  disabled?: boolean;
  onInvalidPin?: () => void;
  onQuizChange?: (quiz: QuizSessionState | null) => void;
  questionsRefreshKey?: number;
  variant?: "card" | "deck";
}

export function AdminControlPanel({
  eventCode,
  runtimeState,
  animatorPin,
  initialExtractionMode = "random",
  disabled = false,
  onInvalidPin,
  onQuizChange,
  questionsRefreshKey = 0,
  variant = "card",
}: AdminControlPanelProps) {
  const { count: questionCount, loading: questionCountLoading } =
    useEventQuestionCount(eventCode, true, questionsRefreshKey);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractionMode, setExtractionMode] =
    useState<ExtractionMode>(initialExtractionMode);
  const [activeChallenge, setActiveChallenge] = useState<ChallengeId | null>(
    null,
  );

  const compact = variant === "deck";

  async function goTo(nextState: EventState) {
    if (disabled || busy) return;

    setBusy(true);
    setError(null);

    try {
      const response = await patchSessionRuntimeState(
        eventCode,
        nextState,
        animatorPin,
      );

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        const message = payload?.error ?? "Impossibile cambiare fase.";
        if (response.status === 401 || isInvalidAnimatorPinError(message)) {
          onInvalidPin?.();
        }
        throw new Error(message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore di rete.");
    } finally {
      setBusy(false);
    }
  }

  async function startQuiz() {
    if (disabled || busy) return;

    setBusy(true);
    setError(null);

    try {
      const response = await postQuizAction(
        eventCode,
        { action: "start" },
        animatorPin,
      );

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        const message = payload?.error ?? "Impossibile avviare il quiz.";
        if (response.status === 401 || isInvalidAnimatorPinError(message)) {
          onInvalidPin?.();
        }
        throw new Error(message);
      }

      const data = (await response.json()) as { quiz: QuizSessionState | null };
      onQuizChange?.(data.quiz ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore di rete.");
    } finally {
      setBusy(false);
    }
  }

  async function extractNextCouple() {
    if (disabled || busy) return;

    setBusy(true);
    setError(null);

    try {
      const response = await postExtractCouple(
        eventCode,
        { mode: extractionMode },
        animatorPin,
      );

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        const message = payload?.error ?? "Estrazione non riuscita.";
        if (response.status === 401 || isInvalidAnimatorPinError(message)) {
          onInvalidPin?.();
        }
        throw new Error(message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore di rete.");
    } finally {
      setBusy(false);
    }
  }

  async function eliminatePair(mode: "next" | "auto_to_finalists") {
    if (disabled || busy) return;

    setBusy(true);
    setError(null);

    try {
      const response = await postEliminatePair(eventCode, { mode }, animatorPin);

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        const message = payload?.error ?? "Eliminazione non riuscita.";
        if (response.status === 401 || isInvalidAnimatorPinError(message)) {
          onInvalidPin?.();
        }
        throw new Error(message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore di rete.");
    } finally {
      setBusy(false);
    }
  }

  async function startVoting(challengeId: ChallengeId) {
    if (disabled || busy) return;

    setBusy(true);
    setError(null);

    try {
      const response = await postVotingAction(
        eventCode,
        { action: "start_challenge", challengeId },
        animatorPin,
      );

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        const message = payload?.error ?? "Impossibile avviare la votazione.";
        if (response.status === 401 || isInvalidAnimatorPinError(message)) {
          onInvalidPin?.();
        }
        throw new Error(message);
      }

      setActiveChallenge(challengeId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore di rete.");
    } finally {
      setBusy(false);
    }
  }

  async function closeVoting() {
    if (disabled || busy) return;

    setBusy(true);
    setError(null);

    try {
      const response = await postVotingAction(
        eventCode,
        { action: "close" },
        animatorPin,
      );

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        const message = payload?.error ?? "Impossibile chiudere la votazione.";
        if (response.status === 401 || isInvalidAnimatorPinError(message)) {
          onInvalidPin?.();
        }
        throw new Error(message);
      }

      setActiveChallenge(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore di rete.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminPanelShell
      variant={variant}
      title="Controlli fase"
      cardTitle="Controlli di fase"
      subtitle={`In sala: ${runtimeStateLabel(runtimeState)}`}
      cardDescription={`Ora in sala: ${runtimeStateLabel(runtimeState)}. Le azioni si aggiornano su telefoni e proiettore.`}
    >
      <p className="text-[11px] text-muted-foreground tabular-nums">
        Domande caricate:{" "}
        <span className="font-semibold text-foreground">
          {questionCountLoading && questionCount === null
            ? "…"
            : (questionCount ?? "—")}
        </span>
      </p>

      {error ? <p className="text-xs text-destructive">{error}</p> : null}

      {runtimeState === "lobby" && (
        <Button
          size={compact ? "sm" : "lg"}
          className={compact ? "w-full" : "h-12 px-8 text-base font-semibold"}
          disabled={disabled || busy}
          onClick={() => void startQuiz()}
        >
          Avvia quiz
        </Button>
      )}

      {runtimeState === "quiz" && (
        <p className="text-xs text-muted-foreground">
          Usa i controlli quiz sotto per avanzare domanda per domanda.
        </p>
      )}

      {runtimeState === "matching" && (
        <Button
          size={compact ? "sm" : "lg"}
          className={compact ? "w-full" : undefined}
          disabled={disabled || busy}
          onClick={() => void goTo("extraction")}
        >
          Inizia estrazione coppie
        </Button>
      )}

      {runtimeState === "extraction" && (
        <div className={compact ? "space-y-2" : "space-y-4 max-w-md"}>
          <div className="space-y-1.5">
            <Label htmlFor="extraction-mode" className="text-xs">
              Modalità estrazione
            </Label>
            <select
              id="extraction-mode"
              value={extractionMode}
              onChange={(event) =>
                setExtractionMode(event.target.value as ExtractionMode)
              }
              className="block w-full rounded-md border border-input bg-input/30 px-2.5 py-1.5 text-xs"
            >
              <option value="random">A sorte</option>
              <option value="ranked">Classifica (basso → alto)</option>
              <option value="hybrid">Mix casuale + classifica</option>
            </select>
          </div>
          <Button
            size={compact ? "sm" : "lg"}
            className="w-full"
            disabled={disabled || busy}
            onClick={() => void extractNextCouple()}
          >
            Estrai prossima coppia
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full h-8 text-xs"
            disabled={disabled || busy}
            onClick={() => void goTo("elimination")}
          >
            Passa allo sfoltimento →
          </Button>
        </div>
      )}

      {runtimeState === "elimination" && (
        <div className={compact ? "space-y-2" : "space-y-3 max-w-md"}>
          <Button
            size={compact ? "sm" : "lg"}
            className="w-full"
            disabled={disabled || busy}
            onClick={() => void eliminatePair("next")}
          >
            Elimina prossima coppia
          </Button>
          <Button
            variant="secondary"
            size={compact ? "sm" : "lg"}
            className="w-full"
            disabled={disabled || busy}
            onClick={() => void eliminatePair("auto_to_finalists")}
          >
            Auto → Top 3
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full h-8 text-xs"
            disabled={disabled || busy}
            onClick={() => void goTo("finals")}
          >
            Top 3 pronti → finali
          </Button>
        </div>
      )}

      {runtimeState === "finals" && (
        <div className="space-y-2">
          {(Object.keys(CHALLENGE_LABELS) as ChallengeId[]).map((id) => (
            <div
              key={id}
              className="flex items-center gap-2 rounded-md border border-border/40 px-2.5 py-1.5"
            >
              <span className="flex-1 text-xs">{CHALLENGE_LABELS[id]}</span>
              <Button
                variant={activeChallenge === id ? "default" : "outline"}
                size="xs"
                disabled={disabled || busy}
                onClick={() => void startVoting(id)}
              >
                Votazione
              </Button>
            </div>
          ))}
          {activeChallenge ? (
            <Button
              variant="secondary"
              size="sm"
              className="w-full"
              disabled={disabled || busy}
              onClick={() => void closeVoting()}
            >
              Chiudi votazione
            </Button>
          ) : null}
          <Button
            size={compact ? "sm" : "lg"}
            className="w-full mt-1"
            disabled={disabled || busy}
            onClick={() => void goTo("winner")}
          >
            Proclama vincitore
          </Button>
        </div>
      )}

      {runtimeState === "winner" && (
        <Button
          size={compact ? "sm" : "lg"}
          className={compact ? "w-full" : undefined}
          disabled={disabled || busy}
          onClick={() => void goTo("closed")}
        >
          Chiudi serata
        </Button>
      )}

      {runtimeState === "closed" && (
        <p className="text-xs text-muted-foreground">
          Serata conclusa — schermo di chiusura attivo.
        </p>
      )}
    </AdminPanelShell>
  );
}
