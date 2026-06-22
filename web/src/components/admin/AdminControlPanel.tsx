"use client";

import { useCallback, useState } from "react";
import { useEventQuestionCount } from "@/hooks/useEventQuestionCount";
import {
  type EventState,
  type ExtractionMode,
} from "@/lib/types";
import {
  isInvalidAnimatorPinError,
  patchSessionRuntimeState,
  postExtractCouple,
  postEliminatePair,
} from "@/lib/admin/animator-api";
import { AdminPanelShell } from "@/components/admin/AdminDeckPanel";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { runtimeStateLabel } from "@/lib/events";
import type { PairProgress } from "@/lib/musicpro/pair-progress";
import type { EventStats } from "@/lib/musicpro/session";

interface AdminControlPanelProps {
  eventCode: string;
  runtimeState: EventState;
  animatorPin: string | null;
  initialExtractionMode?: ExtractionMode;
  disabled?: boolean;
  onInvalidPin?: () => void;
  questionsRefreshKey?: number;
  variant?: "card" | "deck";
  pairProgress?: PairProgress | null;
  onRefreshProgress?: () => Promise<{ stats: EventStats } | null>;
}

export function AdminControlPanel({
  eventCode,
  runtimeState,
  animatorPin,
  initialExtractionMode = "random",
  disabled = false,
  onInvalidPin,
  questionsRefreshKey = 0,
  variant = "card",
  pairProgress = null,
  onRefreshProgress,
}: AdminControlPanelProps) {
  const { count: questionCount, loading: questionCountLoading } =
    useEventQuestionCount(eventCode, true, questionsRefreshKey);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractionMode, setExtractionMode] =
    useState<ExtractionMode>(initialExtractionMode);

  const compact = variant === "deck";

  const refreshProgress = useCallback(async () => {
    if (!onRefreshProgress) return;
    await onRefreshProgress();
  }, [onRefreshProgress]);

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

      await refreshProgress();
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

      await refreshProgress();
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

      await refreshProgress();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore di rete.");
    } finally {
      setBusy(false);
    }
  }

  async function handleExtractionPrimaryAction() {
    if (pairProgress?.canExtractMore === false) {
      await goTo("elimination");
      return;
    }
    await extractNextCouple();
  }

  async function handleEliminationPrimaryAction() {
    if (pairProgress?.canEliminateMore === false) {
      await goTo("finals");
      return;
    }
    await eliminatePair("next");
  }

  const extractionComplete = pairProgress?.canExtractMore === false;
  const eliminationComplete =
    pairProgress?.readyForFinals === true &&
    pairProgress.canEliminateMore === false;

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
        {questionCount === 27 ? (
          <span className="ml-1 text-primary/80">· bundle OK</span>
        ) : null}
      </p>

      {pairProgress &&
      (runtimeState === "extraction" || runtimeState === "elimination") ? (
        <p className="text-[11px] text-muted-foreground tabular-nums">
          Coppie estratte{" "}
          <span className="font-semibold text-foreground">
            {pairProgress.shownCount}/{pairProgress.maxExtractions}
          </span>
          {runtimeState === "elimination" ? (
            <>
              {" "}
              · in gara{" "}
              <span className="font-semibold text-foreground">
                {pairProgress.activePairCount}
              </span>
            </>
          ) : null}
        </p>
      ) : null}

      {error ? <p className="text-xs text-destructive">{error}</p> : null}

      {runtimeState === "lobby" && (
        <p className="text-xs text-muted-foreground">
          Imposta numero domande e secondi nel pannello Quiz — regia, poi avvia.
        </p>
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
          {pairProgress?.canExtractMore !== false ? (
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
          ) : null}
          <Button
            size={compact ? "sm" : "lg"}
            className="w-full"
            disabled={disabled || busy}
            variant={extractionComplete ? "secondary" : "default"}
            onClick={() => void handleExtractionPrimaryAction()}
          >
            {extractionComplete
              ? "Fase eliminazione"
              : "Estrai prossima coppia"}
          </Button>
        </div>
      )}

      {runtimeState === "elimination" && (
        <div className={compact ? "space-y-2" : "space-y-3 max-w-md"}>
          <Button
            size={compact ? "sm" : "lg"}
            className="w-full"
            disabled={disabled || busy}
            variant={eliminationComplete ? "secondary" : "default"}
            onClick={() => void handleEliminationPrimaryAction()}
          >
            {eliminationComplete
              ? "Fase prove finali"
              : "Elimina prossima coppia"}
          </Button>
          {pairProgress?.canEliminateMore ? (
            <Button
              variant="outline"
              size={compact ? "sm" : "lg"}
              className="w-full"
              disabled={disabled || busy}
              onClick={() => void eliminatePair("auto_to_finalists")}
            >
              Auto → Top 3
            </Button>
          ) : null}
        </div>
      )}

      {runtimeState === "finals" && (
        <p className="text-xs text-muted-foreground">
          Usa AVANTI in alto per avanzare; prove e regia nel pannello «Finali».
        </p>
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
