import {
  currentQuestion,
  optionLetter,
  rankedTeams,
  teamCellTone,
  type PlanciaDemoState,
} from "@/lib/admin/plancia-demo";
import { DeckBank, DeckKey, PlanciaModule } from "@/components/admin/plancia/plancia-ui";
import { cn } from "@/lib/utils";

interface PlanciaTeamsColumnProps {
  state: PlanciaDemoState;
  onSelect: (id: string) => void;
  onAdjust: (id: string, delta: number) => void;
}

export function PlanciaTeamsColumn({
  state,
  onSelect,
  onAdjust,
}: PlanciaTeamsColumnProps) {
  const question = currentQuestion(state);
  const selected = state.teams.find((team) => team.id === state.selectedTeamId);

  return (
    <PlanciaModule
      title="Tavoli"
      className="min-h-0 flex-1"
      bodyClassName="flex min-h-0 flex-col gap-2"
    >
      <ol className="min-h-0 flex-1 space-y-0.5 overflow-y-auto">
        {rankedTeams(state).map((team, index) => {
          const tone = teamCellTone(team, state.phase, question.correctIndex);
          const letter =
            team.answerIndex != null ? optionLetter(team.answerIndex) : "—";
          return (
            <li key={team.id}>
              <button
                type="button"
                onClick={() => onSelect(team.id)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm",
                  state.selectedTeamId === team.id
                    ? "bg-[#2c2c3a]"
                    : "hover:bg-[#22222e]",
                )}
              >
                <span className="w-5 text-xs font-bold tabular-nums text-[#d4d4de]">
                  {index + 1}
                </span>
                <span
                  className={cn(
                    "size-2.5 shrink-0 rounded-full",
                    tone === "idle" && "bg-white/35",
                    tone === "answered" && "bg-[#f5c84b]",
                    tone === "correct" && "bg-[#3ee08a]",
                    tone === "wrong" && "bg-[#ff6b7a]",
                    tone === "muted" && "bg-white/15",
                  )}
                />
                <span className="min-w-0 flex-1 truncate font-semibold text-white">
                  {team.name}
                </span>
                <span className="w-4 text-center text-xs font-bold text-[#d4d4de]">
                  {letter}
                </span>
                <span className="w-12 text-right text-sm font-bold tabular-nums text-white">
                  {team.score}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      <div className="shrink-0 space-y-1.5 border-t border-white/10 pt-2">
        <p className="truncate text-sm font-bold text-white">
          {selected?.name ?? "Tocca un tavolo"}
        </p>
        <DeckBank cols={2}>
          <DeckKey
            slot="+"
            tone="ok"
            disabled={!selected}
            onClick={() => selected && onAdjust(selected.id, 50)}
          >
            +50
          </DeckKey>
          <DeckKey
            slot="−"
            tone="danger"
            disabled={!selected}
            onClick={() => selected && onAdjust(selected.id, -50)}
          >
            −50
          </DeckKey>
        </DeckBank>
      </div>
    </PlanciaModule>
  );
}
