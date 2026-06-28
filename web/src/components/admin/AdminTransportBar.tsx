"use client";

import { useCallback, useState } from "react";
import {
  ChevronRight,
  FastForward,
  Play,
  Trophy,
  Users,
  Vote,
} from "lucide-react";
import {
  isInvalidAnimatorPinError,
  patchSessionRuntimeState,
  postEliminatePair,
  postExtractCouple,
  postQuizAction,
  postVotingAction,
} from "@/lib/admin/animator-api";
import { useFinalsShowSync } from "@/hooks/useFinalsShowSync";
import { useQuizPhaseSync } from "@/hooks/useQuizPhaseSync";
import { finalsAdvanceState } from "@/components/admin/AdminFinalsAdvanceButton";
import type { FinalsShowState } from "@/lib/musicpro/finals-show";
import type { QuizSessionState } from "@/lib/musicpro/quiz-state";
import type { PairProgress } from "@/lib/musicpro/pair-progress";
import type { VotingMetadata } from "@/lib/musicpro/voting";
import type { EventState, ExtractionMode } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const PHASE_BADGE: Record<
  EventState,
  { label: string; className: string }
> = {
  lobby: { label: "Lobby", className: "border-sky-500/40 bg-sky-500/15 text-sky-200" },
  quiz: { label: "Quiz", className: "border-emerald-500/40 bg-emerald-500/15 text-emerald-200" },
  matching: { label: "Match", className: "border-violet-500/40 bg-violet-500/15 text-violet-200" },
  extraction: { label: "Estrazione", className: "border-amber-500/40 bg-amber-500/15 text-amber-100" },
  elimination: { label: "Sfoltimento", className: "border-orange-500/40 bg-orange-500/15 text-orange-100" },
  finals: { label: "Finali", className: "border-primary/40 bg-primary/15 text-primary" },
  winner: { label: "Vincitore", className: "border-yellow-500/40 bg-yellow-500/15 text-yellow-100" },
  closed: { label: "Chiuso", className: "border-muted-foreground/30 bg-muted/20 text-muted-foreground" },
};

interface AdminTransportBarProps {
  eventCode: string;
  runtimeState: EventState;
  animatorPin: string | null;
  disabled?: boolean;
  quizState: QuizSessionState | null;
  finalsShow: FinalsShowState | null;
  voting: VotingMetadata;
  pairProgress?: PairProgress | null;
  extractionMode: ExtractionMode;
  onExtractionModeChange: (mode: ExtractionMode) => void;
  onInvalidPin?: () => void;
  onQuizChange?: (quiz: QuizSessionState | null) => void;
  onFinalsChange?: (payload: {
    show?: FinalsShowState | null;
    runtimeState?: EventState;
  }) => void;
  onRefreshProgress?: () => Promise<unknown>;
  onStartQuiz?: () => void;
  startQuizDisabled?: boolean;
  className?: string;
}

export function AdminTransportBar({
  eventCode,
  runtimeState,
  animatorPin,
  disabled = false,
  quizState,
  finalsShow,
  voting,
  pairProgress = null,
  extractionMode,
  onExtractionModeChange,
  onInvalidPin,
  onQuizChange,
  onFinalsChange,
  onRefreshProgress,
  onStartQuiz,
  startQuizDisabled = false,
  className,
}: AdminTransportBarProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const autoplayEnabled = quizState?.autoplayEnabled === true;

  const { remaining: quizRemaining, displayPhase } = useQuizPhaseSync({
    eventSlug: eventCode,
    quizState,
    enabled: runtimeState === "quiz" && Boolean(quizState) && !disabled,
    driveTicks: autoplayEnabled && !disabled,
    onTick: (quiz) => onQuizChange?.(quiz),
  });

  const { remaining: finalsRemaining, tickServer } = useFinalsShowSync({
    eventSlug: eventCode,
    show: finalsShow,
    enabled: (runtimeState === "finals" || runtimeState === "winner") && Boolean(finalsShow) && !disabled,
    driveTicks: true,
    onTick: (data) => onFinalsChange?.(data),
  });

  const runWithBusy = useCallback(
    async (fn: () => Promise<void>) => {
      if (disabled || busy) return;
      setBusy(true);
      setError(null);
      try {
        await fn();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Errore");
      } finally {
        setBusy(false);
      }
    },
    [busy, disabled],
  );

  async function goTo(nextState: EventState) {
    await runWithBusy(async () => {
      const response = await patchSessionRuntimeState(eventCode, nextState, animatorPin);
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        const message = payload?.error ?? "Fase non cambiata.";
        if (response.status === 401 || isInvalidAnimatorPinError(message)) onInvalidPin?.();
        throw new Error(message);
      }
      await onRefreshProgress?.();
    });
  }

  async function extractNextCouple() {
    await runWithBusy(async () => {
      const response = await postExtractCouple(eventCode, { mode: extractionMode }, animatorPin);
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        const message = payload?.error ?? "Estrazione fallita.";
        if (response.status === 401 || isInvalidAnimatorPinError(message)) onInvalidPin?.();
        throw new Error(message);
      }
      await onRefreshProgress?.();
    });
  }

  async function eliminatePair(mode: "next" | "auto_to_finalists") {
    await runWithBusy(async () => {
      const response = await postEliminatePair(eventCode, { mode }, animatorPin);
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        const message = payload?.error ?? "Eliminazione fallita.";
        if (response.status === 401 || isInvalidAnimatorPinError(message)) onInvalidPin?.();
        throw new Error(message);
      }
      await onRefreshProgress?.();
    });
  }

  async function quizSkipPhase() {
    await runWithBusy(async () => {
      const response = await postQuizAction(eventCode, { action: "skipPhase" }, animatorPin);
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        const message = payload?.error ?? "Azione quiz fallita.";
        if (response.status === 401 || isInvalidAnimatorPinError(message)) onInvalidPin?.();
        throw new Error(message);
      }
      const data = (await response.json()) as { quiz: QuizSessionState | null };
      onQuizChange?.(data.quiz ?? null);
    });
  }

  async function handleFinalsAdvance() {
    if (
      finalsShow &&
      (finalsShow.phase === "voting_prep" ||
        finalsShow.phase === "voting" ||
        finalsShow.phase === "winner_spectacle") &&
      finalsRemaining <= 0
    ) {
      await runWithBusy(async () => {
        await tickServer();
      });
      return;
    }

    await runWithBusy(async () => {
      const response = await postVotingAction(eventCode, { action: "advance" }, animatorPin);
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        const message = payload?.error ?? "Avanzamento fallito.";
        if (response.status === 401 || isInvalidAnimatorPinError(message)) onInvalidPin?.();
        throw new Error(message);
      }
      const data = (await response.json()) as { show?: FinalsShowState | null; runtimeState?: EventState };
      onFinalsChange?.({ show: data.show, runtimeState: data.runtimeState });
    });
  }

  async function simulateBotVotes() {
    await runWithBusy(async () => {
      const response = await postVotingAction(eventCode, { action: "simulate_bot_votes" }, animatorPin);
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        const message = payload?.error ?? "Voti bot falliti.";
        if (response.status === 401 || isInvalidAnimatorPinError(message)) onInvalidPin?.();
        throw new Error(message);
      }
    });
  }

  const phaseBadge = PHASE_BADGE[runtimeState];
  const extractionComplete = pairProgress?.canExtractMore === false;
  const eliminationComplete =
    pairProgress?.readyForFinals === true && pairProgress.canEliminateMore === false;

  const isLastQuestion =
    quizState != null && quizState.currentIndex >= quizState.total - 1;
  const onLastResults =
    isLastQuestion &&
    (displayPhase === "results" || displayPhase === "next_question");

  const finalsAdvanceInfo = finalsAdvanceState(finalsShow, finalsRemaining);
  const votingOpen = voting.current?.status === "open";

  let primaryLabel = "Avanti";
  let primaryIcon = ChevronRight;
  let primaryAction: (() => void) | null = null;
  let primaryDisabled = disabled || busy;

  switch (runtimeState) {
    case "lobby":
      primaryLabel = "Avvia quiz";
      primaryIcon = Play;
      primaryAction = onStartQuiz ? () => onStartQuiz() : null;
      primaryDisabled = primaryDisabled || startQuizDisabled || !onStartQuiz;
      break;
    case "quiz":
      primaryLabel = onLastResults ? "Matching" : "Avanti";
      primaryIcon = onLastResults ? FastForward : ChevronRight;
      primaryAction = () => void quizSkipPhase();
      break;
    case "matching":
      primaryLabel = "Estrazione";
      primaryAction = () => void goTo("extraction");
      break;
    case "extraction":
      primaryLabel = extractionComplete ? "Sfoltimento" : "Estrai";
      primaryAction = () =>
        void (extractionComplete ? goTo("elimination") : extractNextCouple());
      break;
    case "elimination":
      primaryLabel = eliminationComplete ? "Finali" : "Elimina";
      primaryAction = () =>
        void (eliminationComplete ? goTo("finals") : eliminatePair("next"));
      break;
    case "finals":
      primaryLabel = "Avanti";
      primaryIcon = ChevronRight;
      primaryAction = () => void handleFinalsAdvance();
      primaryDisabled = primaryDisabled || !finalsAdvanceInfo.enabled;
      break;
    case "winner":
      if (finalsShow?.phase === "winner_podium" || !finalsShow) {
        primaryLabel = "Chiudi";
        primaryAction = () => void goTo("closed");
      } else {
        primaryLabel = "Avanti";
        primaryIcon = ChevronRight;
        primaryAction = () => void handleFinalsAdvance();
        primaryDisabled = primaryDisabled || !finalsAdvanceInfo.enabled;
      }
      break;
    case "closed":
      primaryAction = null;
      break;
  }

  const PrimaryIcon = primaryIcon;

  if (primaryAction && runtimeState === "winner" && finalsShow?.phase === "winner_podium") {
    primaryDisabled = disabled || busy;
  }

  return (
    <footer
      className={cn(
        "shrink-0 border-t border-border/50 bg-card/90 backdrop-blur-md",
        "grid grid-cols-[auto_1fr_auto] items-center gap-3 px-3 h-[4.25rem]",
        className,
      )}
      aria-label="Transport"
    >
      <div className="flex items-center gap-2 min-w-0">
        <Badge
          variant="outline"
          className={cn("h-7 px-2.5 text-[11px] font-semibold uppercase tracking-wide", phaseBadge.className)}
        >
          {phaseBadge.label}
        </Badge>
        {runtimeState === "quiz" && quizState ? (
          <span className="text-[11px] tabular-nums text-muted-foreground hidden sm:inline">
            {quizState.currentIndex + 1}/{quizState.total} · {quizRemaining}s
          </span>
        ) : null}
        {(runtimeState === "finals" || runtimeState === "winner") &&
        finalsShow &&
        (finalsShow.phase === "voting_prep" ||
          finalsShow.phase === "voting" ||
          finalsShow.phase === "winner_spectacle") ? (
          <span className="text-[11px] tabular-nums text-muted-foreground hidden sm:inline">
            {finalsRemaining}s
          </span>
        ) : null}
        {pairProgress && runtimeState === "extraction" ? (
          <span className="text-[11px] tabular-nums text-muted-foreground hidden md:inline">
            {pairProgress.shownCount}/{pairProgress.maxExtractions}
          </span>
        ) : null}
        {pairProgress && runtimeState === "elimination" ? (
          <span className="text-[11px] tabular-nums text-muted-foreground hidden md:inline">
            {pairProgress.activePairCount} coppie
          </span>
        ) : null}
      </div>

      <div className="flex justify-center min-w-0">
        {primaryAction ? (
          <Button
            type="button"
            size="lg"
            disabled={primaryDisabled}
            className={cn(
              "h-12 min-w-[10rem] max-w-full px-8 font-bold uppercase tracking-[0.14em]",
              "shadow-[0_0_24px_rgba(236,72,153,0.28)]",
              primaryDisabled && "opacity-50 shadow-none",
            )}
            onClick={primaryAction}
          >
            <PrimaryIcon className="size-5 stroke-[2.5]" />
            {primaryLabel}
          </Button>
        ) : (
          <span className="text-[11px] text-muted-foreground uppercase tracking-wide">
            Serata chiusa
          </span>
        )}
      </div>

      <div className="flex items-center justify-end gap-1.5 min-w-0">
        {runtimeState === "extraction" && pairProgress?.canExtractMore !== false ? (
          <select
            value={extractionMode}
            onChange={(e) => onExtractionModeChange(e.target.value as ExtractionMode)}
            className="h-8 max-w-[7rem] rounded-md border border-input/50 bg-input/20 px-1.5 text-[10px] truncate"
            aria-label="Modalità"
          >
            <option value="random">Sorte</option>
            <option value="ranked">Classifica</option>
            <option value="hybrid">Mix</option>
          </select>
        ) : null}

        {runtimeState === "elimination" && pairProgress?.canEliminateMore ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-[11px] px-2"
            disabled={disabled || busy}
            onClick={() => void eliminatePair("auto_to_finalists")}
          >
            Top 3
          </Button>
        ) : null}

        {votingOpen ? (
          <>
            <Badge variant="outline" className="h-7 border-red-500/40 bg-red-500/10 text-red-200 text-[10px]">
              <Vote className="size-3" />
              Voto
            </Badge>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 text-[11px] px-2 gap-1"
              disabled={disabled || busy}
              onClick={() => void simulateBotVotes()}
            >
              <Users className="size-3" />
              Bot
            </Button>
          </>
        ) : null}

        {runtimeState === "finals" || runtimeState === "winner" ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-[11px] px-2 gap-1"
            disabled={
              disabled ||
              busy ||
              finalsShow?.phase === "voting_prep" ||
              finalsShow?.phase === "voting" ||
              finalsShow?.phase === "winner_spectacle"
            }
            onClick={() =>
              void runWithBusy(async () => {
                const response = await postVotingAction(
                  eventCode,
                  { action: "proclaim_winner" },
                  animatorPin,
                );
                if (!response.ok) throw new Error("Proclamazione fallita.");
                const data = (await response.json()) as {
                  show?: FinalsShowState | null;
                  runtimeState?: EventState;
                };
                onFinalsChange?.({ show: data.show, runtimeState: data.runtimeState });
              })
            }
          >
            <Trophy className="size-3" />
            Vincitore
          </Button>
        ) : null}

        {error ? (
          <span className="text-[10px] text-destructive truncate max-w-[8rem]" title={error}>
            {error}
          </span>
        ) : null}
      </div>
    </footer>
  );
}
