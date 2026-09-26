import type { EventSnapshot } from "../api/types";

interface PanelLiveProps {
  event: EventSnapshot | null;
  lastPolledAt: number | null;
}

function fmtTime(ts: number | null): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleTimeString("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function PanelLive({ event, lastPolledAt }: PanelLiveProps) {
  const quiz = event?.quizState;
  return (
    <section className="panel">
      <header className="panel-head">
        <h2>Live</h2>
        <span className="panel-meta">poll {fmtTime(lastPolledAt)}</span>
      </header>
      <dl className="kv">
        <div>
          <dt>runtimeState</dt>
          <dd className="mono accent">{event?.runtimeState ?? "—"}</dd>
        </div>
        <div>
          <dt>displayPhase</dt>
          <dd className="mono">{quiz?.displayPhase ?? "—"}</dd>
        </div>
        <div>
          <dt>quiz index</dt>
          <dd className="mono">
            {quiz?.currentIndex != null
              ? `${quiz.currentIndex}${
                  quiz.totalQuestions != null ? ` / ${quiz.totalQuestions}` : ""
                }`
              : "—"}
          </dd>
        </div>
        <div>
          <dt>sessionId</dt>
          <dd className="mono truncate" title={event?.sessionId ?? undefined}>
            {event?.sessionId ?? "—"}
          </dd>
        </div>
        <div>
          <dt>titolo</dt>
          <dd>{event?.title ?? "—"}</dd>
        </div>
      </dl>
    </section>
  );
}
