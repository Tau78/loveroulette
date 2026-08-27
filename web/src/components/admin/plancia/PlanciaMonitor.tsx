import { cn } from "@/lib/utils";
import type {
  DemoQuestion,
  DemoTeam,
  LeaderboardMode,
  PlanciaDemoState,
  QuizFlowPhase,
} from "@/lib/admin/plancia-demo";
import {
  answerStats,
  optionLetter,
  rankedTeams,
} from "@/lib/admin/plancia-demo";

type MonitorKind = "preview" | "program";

interface PlanciaMonitorProps {
  kind: MonitorKind;
  state: PlanciaDemoState;
  question: DemoQuestion;
  label: string;
  notes?: string;
}

export function PlanciaMonitor({
  kind,
  state,
  question,
  label,
  notes,
}: PlanciaMonitorProps) {
  const isProgram = kind === "program";
  const overlay = isProgram ? programOverlay(state) : null;

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2 px-0.5">
        <span
          className={cn(
            "text-xs font-bold uppercase tracking-wide",
            isProgram ? "text-[#ff8a96]" : "text-[#7dd3fc]",
          )}
        >
          {label}
        </span>
        <span className="text-xs font-medium tabular-nums text-[#d4d4de]">
          16:9 · 1080p
        </span>
      </div>
      <div
        className={cn(
          "relative aspect-video overflow-hidden rounded-lg border-2 bg-[#050508]",
          isProgram ? "border-[#ff8a96]" : "border-[#7dd3fc]",
        )}
      >
        <MonitorScene state={state} question={question} kind={kind} />
        {overlay}
        {notes ? (
          <div className="absolute inset-x-1.5 bottom-1.5 rounded-md border border-white/20 bg-black/85 px-2 py-1.5 text-[11px] font-semibold leading-snug text-[#f5c84b]">
            {notes}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function programOverlay(state: PlanciaDemoState) {
  if (state.panic.blackout) {
    return (
      <div
        className="absolute inset-0 z-10 flex items-center justify-center bg-black"
        aria-label="Blackout"
      >
        <span className="rounded bg-white px-2 py-1 text-xs font-bold uppercase text-black">
          Blackout
        </span>
      </div>
    );
  }
  if (state.panic.logo) {
    return (
      <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0d0d12]">
        <div className="rounded-xl border border-white/20 bg-black/70 px-4 py-3 text-center">
          <p className="text-3xl font-bold tracking-tight text-white">LR</p>
          <p className="mt-1 text-xs font-bold uppercase tracking-wider text-white">
            Love Roulette
          </p>
        </div>
      </div>
    );
  }
  if (state.panic.freeze) {
    return (
      <div className="pointer-events-none absolute inset-0 z-10 ring-4 ring-inset ring-[#7dd3fc]">
        <span className="absolute right-1.5 top-1.5 rounded bg-[#7dd3fc] px-2 py-0.5 text-xs font-bold uppercase text-black">
          Freeze
        </span>
      </div>
    );
  }
  return null;
}

function MonitorScene({
  state,
  question,
  kind,
}: {
  state: PlanciaDemoState;
  question: DemoQuestion;
  kind: MonitorKind;
}) {
  const phase: QuizFlowPhase =
    kind === "preview" ? previewPhase(state.phase) : state.phase;

  if (kind === "preview" && state.phase === "waiting") {
    return <QuestionFrame question={question} phase="waiting" remaining={question.durationSec} />;
  }
  if (phase === "stats") {
    return <StatsFrame state={state} question={question} />;
  }
  if (phase === "leaderboard") {
    return <BoardFrame state={state} />;
  }
  return (
    <QuestionFrame
      question={question}
      phase={phase}
      remaining={state.remaining}
    />
  );
}

function previewPhase(phase: QuizFlowPhase): QuizFlowPhase {
  if (phase === "waiting" || phase === "on_air") return "waiting";
  if (phase === "timer") return "closed";
  if (phase === "closed") return "revealed";
  if (phase === "revealed") return "stats";
  if (phase === "stats") return "leaderboard";
  return "waiting";
}

function QuestionFrame({
  question,
  phase,
  remaining,
}: {
  question: DemoQuestion;
  phase: QuizFlowPhase;
  remaining: number;
}) {
  const reveal = phase === "revealed" || phase === "stats";
  return (
    <div className="flex h-full flex-col bg-[#0a0a10] p-2">
      <p
        className="line-clamp-2 rounded-md bg-black/80 px-1.5 py-1 text-center text-[11px] font-bold uppercase leading-tight text-white"
        style={{
          textShadow: "0 1px 2px rgba(0,0,0,1), 0 0 10px rgba(0,0,0,0.8)",
        }}
      >
        {question.body}
      </p>
      <div className="mt-1.5 grid flex-1 grid-rows-4 gap-1">
        {question.options.map((option, index) => {
          const correct = reveal && index === question.correctIndex;
          return (
            <div
              key={option}
              className={cn(
                "flex items-center gap-1.5 rounded-md border px-1.5 text-[11px] font-bold uppercase",
                correct
                  ? "border-[#3ee08a] bg-[#0f2a1c] text-white"
                  : "border-white/20 bg-black/75 text-white",
              )}
            >
              <span className={correct ? "text-[#3ee08a]" : "text-[#ff8ac4]"}>
                {optionLetter(index)}
              </span>
              <span className="truncate">{option}</span>
            </div>
          );
        })}
      </div>
      {(phase === "timer" || phase === "on_air") && (
        <p
          className="mt-1 rounded bg-black/80 text-center text-2xl font-bold tabular-nums text-white"
          aria-live="polite"
          style={{ textShadow: "0 2px 8px rgba(0,0,0,1)" }}
        >
          {phase === "timer" ? remaining : "—"}
        </p>
      )}
    </div>
  );
}

function StatsFrame({
  state,
  question,
}: {
  state: PlanciaDemoState;
  question: DemoQuestion;
}) {
  const counts = answerStats(state);
  const total = Math.max(1, counts.reduce((sum, n) => sum + n, 0));
  return (
    <div className="flex h-full flex-col justify-center gap-1.5 bg-[#0a0a10] p-2">
      {question.options.map((option, index) => {
        const pct = Math.round((counts[index]! / total) * 100);
        return (
          <div key={option} className="space-y-0.5">
            <div className="flex justify-between text-[11px] font-bold uppercase text-white">
              <span className="truncate">
                {optionLetter(index)} {option}
              </span>
              <span className="tabular-nums">{pct}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/20">
              <div
                className={cn(
                  "h-full rounded-full",
                  index === question.correctIndex ? "bg-[#3ee08a]" : "bg-primary",
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function BoardFrame({ state }: { state: PlanciaDemoState }) {
  const rows: DemoTeam[] = rankedTeams(state).slice(0, 6);
  const modeLabel: Record<LeaderboardMode, string> = {
    absolute: "Assoluta",
    climb: "Scalata",
    tables: "Tavoli",
    podium: "Podio",
  };
  return (
    <div className="flex h-full flex-col bg-[#0a0a10] p-2">
      <p className="mb-1 rounded bg-black/80 text-center text-[11px] font-bold uppercase tracking-wide text-white">
        Classifica · {modeLabel[state.leaderboardMode]}
      </p>
      <ol className="space-y-1">
        {rows.map((team, index) => (
          <li
            key={team.id}
            className="flex items-center justify-between rounded-md bg-black/75 px-2 py-0.5 text-[11px] font-semibold text-white"
          >
            <span className="truncate">
              <span className="mr-1.5 tabular-nums text-[#ff8ac4]">{index + 1}</span>
              {team.name}
            </span>
            <span className="tabular-nums text-white">{team.score}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
