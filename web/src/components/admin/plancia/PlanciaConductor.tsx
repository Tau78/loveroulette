import {
  CONDUCTOR_PHASE,
  conductorPrimary,
  currentQuestion,
  formatCountdown,
  optionLetter,
  visibleCountdown,
  type ConductorPrimary,
  type PlanciaDemoState,
} from "@/lib/admin/plancia-demo";
import { DeckBank, DeckKey, PlanciaModule } from "@/components/admin/plancia/plancia-ui";
import { cn } from "@/lib/utils";

export type ConductorTap = ConductorPrimary["type"];

interface PlanciaConductorProps {
  state: PlanciaDemoState;
  onAction: (type: ConductorTap) => void;
}

export function PlanciaConductor({ state, onAction }: PlanciaConductorProps) {
  const question = currentQuestion(state);
  const primary = conductorPrimary(state);
  const clock = formatCountdown(visibleCountdown(state));
  const ticking = state.phase === "timer";
  const canClose = state.phase === "timer";
  const canReveal =
    state.phase === "closed" ||
    state.phase === "timer" ||
    state.phase === "on_air";
  const canBoard = state.phase !== "waiting";
  const canNext =
    state.questionIndex + 1 < state.totalQuestions &&
    (state.phase === "revealed" ||
      state.phase === "stats" ||
      state.phase === "leaderboard" ||
      state.phase === "closed");

  return (
    <PlanciaModule
      title="Foglio"
      actions={
        <span className="text-xs font-bold uppercase tracking-wide text-[#d4d4de]">
          Solo tu · {CONDUCTOR_PHASE[state.phase]}
        </span>
      }
      className="h-full"
      bodyClassName="flex min-h-0 flex-col gap-3"
    >
      <p className="text-xl font-bold uppercase leading-snug text-white sm:text-2xl">
        {question.body}
      </p>
      <ol className="grid flex-1 grid-rows-4 gap-1.5">
        {question.options.map((option, index) => {
          const correct = index === question.correctIndex;
          return (
            <li
              key={option}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-2 text-base font-bold uppercase",
                correct
                  ? "border-[#3ee08a] bg-[#0f2a1c] text-white"
                  : "border-white/15 bg-[#12121a] text-white",
              )}
            >
              <span className={correct ? "text-[#3ee08a]" : "text-[#ff8ac4]"}>
                {optionLetter(index)}
              </span>
              <span className="min-w-0 flex-1 truncate">{option}</span>
              {correct ? (
                <span className="shrink-0 text-[11px] font-bold uppercase tracking-wide text-[#3ee08a]">
                  Esatta
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>

      <p
        className={cn(
          "text-center text-6xl font-bold tabular-nums leading-none text-white sm:text-7xl",
          ticking && state.remaining <= 5 && "text-[#ff6b7a]",
        )}
        aria-live="polite"
      >
        {clock}
      </p>

      <DeckKey
        slot="↵"
        tone="primary"
        active
        onClick={() => onAction(primary.type)}
        className="h-16 text-lg"
      >
        {primary.label}
      </DeckKey>
      <DeckBank cols={4}>
        <DeckKey
          slot="1"
          tone="warn"
          active={primary.type === "stop_timer"}
          disabled={!canClose}
          onClick={() => onAction("stop_timer")}
        >
          Chiudi
        </DeckKey>
        <DeckKey
          slot="2"
          tone="ok"
          active={primary.type === "reveal"}
          disabled={!canReveal}
          onClick={() => onAction("reveal")}
        >
          Rivela
        </DeckKey>
        <DeckKey
          slot="3"
          active={primary.type === "show_leaderboard"}
          disabled={!canBoard}
          onClick={() => onAction("show_leaderboard")}
        >
          Classifica
        </DeckKey>
        <DeckKey
          slot="4"
          active={primary.type === "next_question"}
          disabled={!canNext}
          onClick={() => onAction("next_question")}
        >
          Prossima
        </DeckKey>
      </DeckBank>
    </PlanciaModule>
  );
}
