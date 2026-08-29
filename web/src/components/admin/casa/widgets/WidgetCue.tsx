"use client";

import { useMemo, useState } from "react";
import { useCasaLiveSession } from "@/components/admin/casa/casa-live-session-context";
import { useQuizQuestions } from "@/hooks/useQuizQuestions";

export type WidgetCueProps = {
  className?: string;
};

const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F"] as const;

/**
 * Next-question cue (“Dopo · Qn”) + Salta via live runQuizAction(skipPhase).
 */
export function WidgetCue({ className }: WidgetCueProps) {
  const {
    eventCode,
    quizState,
    controlsDisabled,
    runQuizAction,
  } = useCasaLiveSession();

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasQuiz = Boolean(quizState);
  const { questions, loading } = useQuizQuestions(eventCode, hasQuiz);

  const nextIndex = quizState ? quizState.currentIndex + 1 : -1;
  const canSkip =
    Boolean(quizState) &&
    nextIndex >= 0 &&
    nextIndex < (quizState?.total ?? 0);

  const cue = useMemo(() => {
    if (!quizState || nextIndex < 0 || nextIndex >= quizState.total) {
      return null;
    }
    const id = quizState.questionIds[nextIndex];
    if (!id) return null;
    return questions.find((q) => q.id === id) ?? null;
  }, [nextIndex, questions, quizState]);

  async function handleSkip() {
    if (!canSkip || controlsDisabled || busy) return;
    setBusy(true);
    setError(null);
    try {
      const result = await runQuizAction("skipPhase");
      if (!result.ok) {
        setError(result.error);
      }
    } finally {
      setBusy(false);
    }
  }

  const qNum = nextIndex >= 0 ? nextIndex + 1 : null;

  return (
    <div className={["casa-live-widget", className].filter(Boolean).join(" ")}>
      <div className="casa-cue">
        <div className="casa-cue-body">
          <p className="casa-cue-kicker">
            Dopo{qNum != null ? ` · Q${qNum}` : ""}
          </p>
          {!quizState ? (
            <p className="casa-cue-text">Quiz non avviato</p>
          ) : !canSkip ? (
            <p className="casa-cue-text">Ultima domanda</p>
          ) : loading && !cue ? (
            <p className="casa-cue-text">Caricamento…</p>
          ) : cue ? (
            <>
              <p className="casa-cue-text">{cue.body}</p>
              <p className="casa-cue-opts">
                {cue.options
                  .map(
                    (opt, i) =>
                      `${OPTION_LETTERS[i] ?? String(i + 1)} ${opt.label}`,
                  )
                  .join(" · ")}
              </p>
            </>
          ) : (
            <p className="casa-cue-text">Domanda {qNum}</p>
          )}
          {error ? <p className="casa-live-error">{error}</p> : null}
        </div>
        <button
          type="button"
          className="casa-cue-skip"
          disabled={!canSkip || controlsDisabled || busy}
          onClick={() => void handleSkip()}
        >
          Salta
        </button>
      </div>
    </div>
  );
}
