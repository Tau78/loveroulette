import {
  currentQuestion,
  nextQuestionPreview,
  optionLetter,
  type PlanciaDemoState,
} from "@/lib/admin/plancia-demo";
import { PlanciaMonitor } from "@/components/admin/plancia/PlanciaMonitor";
import { DeckKey, PlanciaModule } from "@/components/admin/plancia/plancia-ui";

interface PlanciaMediaColumnProps {
  state: PlanciaDemoState;
  onSkipCue: () => void;
}

export function PlanciaMediaColumn({
  state,
  onSkipCue,
}: PlanciaMediaColumnProps) {
  const live = currentQuestion(state);
  const cue = nextQuestionPreview(state);
  const cueIndex = state.questionIndex + 1;
  const canSkip = cueIndex < state.totalQuestions;

  return (
    <PlanciaModule title="Cosa vede la sala" bodyClassName="space-y-2.5">
      <PlanciaMonitor
        kind="program"
        state={state}
        question={live}
        label="Sala"
      />
      <div className="grid grid-cols-[minmax(0,1fr)_5.5rem] items-center gap-1.5 rounded-lg border border-white/15 bg-[#12121a] px-2.5 py-2">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#d4d4de]">
            Dopo · Q{cueIndex + 1}
          </p>
          <p className="truncate text-sm font-semibold text-white">{cue.body}</p>
          <p className="truncate text-xs text-[#d4d4de]">
            {cue.options
              .map((option, index) => `${optionLetter(index)} ${option}`)
              .join(" · ")}
          </p>
        </div>
        <DeckKey
          slot="SK"
          tone="warn"
          disabled={!canSkip}
          onClick={onSkipCue}
          className="h-12"
        >
          Salta
        </DeckKey>
      </div>
    </PlanciaModule>
  );
}
