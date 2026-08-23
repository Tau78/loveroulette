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
import { AdminPanelShell } from "@/components/admin/AdminDeckPanel";
import { AdminButton } from "@/components/admin/AdminButton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ADMIN_UI } from "@/lib/admin/admin-ui-tokens";

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
  closed: { label: "Chiuso", className: "border-white/30 bg-white/10 text-white" },
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
  /** `panel` = inline deck block; `footer` = legacy bottom bar (deprecated). */
  variant?: "panel" | "footer";
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
  variant = "panel",
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

  const phaseBadgeAction = (
    <Badge
      variant="outline"
      className={cn(
        "h-7 px-2 text-xs font-semibold",
        phaseBadge.className,
      )}
    >
      {phaseBadge.label}
    </Badge>
  );

  const statusLine =
    runtimeState === "quiz" && quizState ? (
      <span className={ADMIN_UI.stat}>
        {quizState.currentIndex + 1}/{quizState.total} · {quizRemaining}s
      </span>
    ) : (runtimeState === "finals" || runtimeState === "winner") &&
      finalsShow &&
      (finalsShow.phase === "voting_prep" ||
        finalsShow.phase === "voting" ||
        finalsShow.phase === "winner_spectacle") ? (
      <span className={ADMIN_UI.stat}>{finalsRemaining}s</span>
    ) : pairProgress && runtimeState === "extraction" ? (
      <span className={ADMIN_UI.stat}>
        {pairProgress.shownCount}/{pairProgress.maxExtractions}
      </span>
    ) : pairProgress && runtimeState === "elimination" ? (
      <span className={ADMIN_UI.stat}>{pairProgress.activePairCount} coppie</span>
    ) : null;

  const secondaryActions = (
    <div className="flex flex-wrap items-center gap-1 min-w-0">
      {runtimeState === "extraction" && pairProgress?.canExtractMore !== false ? (
        <select
          value={extractionMode}
          onChange={(e) => onExtractionModeChange(e.target.value as ExtractionMode)}
          className={cn(ADMIN_UI.select, "max-w-[7rem] truncate")}
          aria-label="Modalità"
        >
          <option value="random">Sorte</option>
          <option value="ranked">Classifica</option>
          <option value="hybrid">Mix</option>
        </select>
      ) : null}

      {runtimeState === "elimination" && pairProgress?.canEliminateMore ? (
        <AdminButton
          type="button"
          variant="outline"
          disabled={disabled || busy}
          onClick={() => void eliminatePair("auto_to_finalists")}
        >
          Top 3
        </AdminButton>
      ) : null}

      {votingOpen ? (
        <>
          <Badge variant="outline" className="h-9 border-red-400/50 bg-red-500/20 text-white text-xs font-bold">
            <Vote className="size-4" />
            Voto
          </Badge>
          <AdminButton
            type="button"
            variant="outline"
            disabled={disabled || busy}
            onClick={() => void simulateBotVotes()}
          >
            <Users className="size-4" />
            Bot
          </AdminButton>
        </>
      ) : null}

      {runtimeState === "finals" || runtimeState === "winner" ? (
        <AdminButton
          type="button"
          variant="outline"
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
          <Trophy className="size-4" />
          Vincitore
        </AdminButton>
      ) : null}
    </div>
  );

  const primaryButton = primaryAction ? (
    <AdminButton
      type="button"
      size="lg"
      disabled={primaryDisabled}
      className={cn(primaryDisabled && "opacity-40 shadow-none")}
      onClick={primaryAction}
    >
      <PrimaryIcon className="size-4 stroke-[2.5]" />
      {primaryLabel}
    </AdminButton>
  ) : (
    <span className={cn(ADMIN_UI.caption, "font-medium")}>Serata chiusa</span>
  );

  if (variant === "footer") {
    return (
      <footer
        className={cn(
          "shrink-0 border-t border-border/50 bg-card/90 backdrop-blur-md",
          "grid grid-cols-[auto_1fr_auto] items-center gap-3 px-3 h-[4.25rem]",
          className,
        )}
        aria-label="Transport"
      >
        <div className="flex flex-wrap items-center gap-1.5 min-w-0">
          {phaseBadgeAction}
          {statusLine}
        </div>
        <div className="flex justify-center min-w-0">{primaryButton}</div>
        <div className="flex items-center justify-end gap-1.5 min-w-0">
          {secondaryActions}
          {error ? (
            <span className="text-[10px] text-destructive truncate max-w-[8rem]" title={error}>
              {error}
            </span>
          ) : null}
        </div>
      </footer>
    );
  }

  return (
    <AdminPanelShell
      variant="deck"
      title="Azioni fase"
      accent
      collapsible={false}
      className={className}
      actions={phaseBadgeAction}
    >
      {statusLine}
      {primaryButton}
      {secondaryActions}
      {error ? (
        <p className={ADMIN_UI.error} title={error}>
          {error}
        </p>
      ) : null}
    </AdminPanelShell>
  );
}
