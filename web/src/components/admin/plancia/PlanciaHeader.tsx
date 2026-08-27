import Link from "next/link";
import {
  CONDUCTOR_PHASE,
  answeredCount,
  type PlanciaDemoState,
} from "@/lib/admin/plancia-demo";
import { DeckBank, DeckKey } from "@/components/admin/plancia/plancia-ui";

interface PlanciaHeaderProps {
  state: PlanciaDemoState;
  onBlackout: () => void;
  onMute: () => void;
}

export function PlanciaHeader({
  state,
  onBlackout,
  onMute,
}: PlanciaHeaderProps) {
  const answered = answeredCount(state);

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-white/15 bg-[#1a1a24] px-3">
      <Link
        href="/"
        className="shrink-0 rounded-md bg-[#2c2c3a] px-2 py-1 text-xs font-bold tracking-tight text-white hover:bg-[#3a3a4c]"
      >
        DEMO
      </Link>
      <p className="min-w-0 truncate text-sm font-bold text-white">
        Domanda {state.questionIndex + 1}
        <span className="font-medium text-[#d4d4de]">
          {" "}
          / {state.totalQuestions}
        </span>
      </p>
      <span className="rounded-md bg-primary px-2 py-1 text-xs font-bold uppercase tracking-wide text-white">
        {CONDUCTOR_PHASE[state.phase]}
      </span>
      <p className="min-w-0 flex-1 text-sm font-semibold tabular-nums text-white">
        {answered}/{state.teams.length}{" "}
        <span className="font-medium text-[#d4d4de]">hanno risposto</span>
      </p>
      <DeckBank cols={2} className="w-56 shrink-0">
        <DeckKey
          slot="F11"
          tone="danger"
          active={state.panic.blackout}
          onClick={onBlackout}
          title="F11"
          className="h-10"
        >
          Blackout
        </DeckKey>
        <DeckKey
          slot="F12"
          tone="danger"
          active={state.audio.muted}
          onClick={onMute}
          title="F12"
          className="h-10"
        >
          Mute
        </DeckKey>
      </DeckBank>
    </header>
  );
}
