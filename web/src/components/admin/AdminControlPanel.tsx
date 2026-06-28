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
  /** Azioni primarie gestite dalla transport bar. */
  hideTransportActions?: boolean;
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
  hideTransportActions = false,
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
      title="Fase"
      cardTitle="Controlli di fase"
      collapsible={false}
    >
      <p className="text-[10px] text-muted-foreground tabular-nums">
        Domande{" "}
        <span className="font-semibold text-foreground">
          {questionCountLoading && questionCount === null
            ? "…"
            : (questionCount ?? "—")}
        </span>
        {questionCount === 27 ? (
          <span className="ml-1 text-primary/80">· OK</span>
        ) : null}
      </p>

      {pairProgress &&
      (runtimeState === "extraction" || runtimeState === "elimination") ? (
        <p className="text-[10px] text-muted-foreground tabular-nums">
          {runtimeState === "extraction" ? (
            <>
              Estratte{" "}
              <span className="font-semibold text-foreground">
                {pairProgress.shownCount}/{pairProgress.maxExtractions}
              </span>
            </>
          ) : (
            <>
              In gara{" "}
              <span className="font-semibold text-foreground">
                {pairProgress.activePairCount}
              </span>
            </>
          )}
        </p>
      ) : null}

      {error ? <p className="text-[10px] text-destructive">{error}</p> : null}

      {!hideTransportActions && runtimeState === "matching" && (
        <Button
          size={compact ? "sm" : "lg"}
          className={compact ? "w-full" : undefined}
          disabled={disabled || busy}
          onClick={() => void goTo("extraction")}
        >
          Estrazione
        </Button>
      )}

      {!hideTransportActions && runtimeState === "extraction" && (
        <div className={compact ? "space-y-2" : "space-y-4 max-w-md"}>
          {pairProgress?.canExtractMore !== false ? (
            <div className="space-y-1.5">
              <Label htmlFor="extraction-mode" className="text-[10px]">
                Modalità
              </Label>
              <select
                id="extraction-mode"
                value={extractionMode}
                onChange={(event) =>
                  setExtractionMode(event.target.value as ExtractionMode)
                }
                className="block w-full rounded-md border border-input bg-input/30 px-2.5 py-1.5 text-xs"
              >
                <option value="random">Sorte</option>
                <option value="ranked">Classifica</option>
                <option value="hybrid">Mix</option>
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
            {extractionComplete ? "Sfoltimento" : "Estrai"}
          </Button>
        </div>
      )}

      {!hideTransportActions && runtimeState === "elimination" && (
        <div className={compact ? "space-y-2" : "space-y-3 max-w-md"}>
          <Button
            size={compact ? "sm" : "lg"}
            className="w-full"
            disabled={disabled || busy}
            variant={eliminationComplete ? "secondary" : "default"}
            onClick={() => void handleEliminationPrimaryAction()}
          >
            {eliminationComplete ? "Finali" : "Elimina"}
          </Button>
          {pairProgress?.canEliminateMore ? (
            <Button
              variant="outline"
              size={compact ? "sm" : "lg"}
              className="w-full"
              disabled={disabled || busy}
              onClick={() => void eliminatePair("auto_to_finalists")}
            >
              Top 3
            </Button>
          ) : null}
        </div>
      )}

      {!hideTransportActions && runtimeState === "winner" && (
        <Button
          size={compact ? "sm" : "lg"}
          className={compact ? "w-full" : undefined}
          disabled={disabled || busy}
          onClick={() => void goTo("closed")}
        >
          Chiudi
        </Button>
      )}
    </AdminPanelShell>
  );
}
