"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { EventState } from "@/lib/types";
import type { LoveRouletteQuestion } from "@/lib/musicpro/types";
import type { QuizSessionState } from "@/lib/musicpro/quiz-state";
import type { QuestionResults } from "@/lib/musicpro/quiz-results";
import {
  resolveThemeForQuizIndex,
  type QuizDisplayPhase,
  isMancheThemeIntroForIndex,
} from "@/lib/musicpro/quiz-display";
import { DisplayPhaseHero } from "@/components/display/DisplayShowText";
import { DisplayQuizFooter } from "@/components/display/DisplayQuizFooter";
import { DisplayQuizLaunchSpectacle } from "@/components/display/DisplayQuizLaunchSpectacle";
import {
  QUIZ_ANSWER_LETTER_CLASS,
  QUIZ_ANSWER_TEXT_CLASS,
  QUIZ_QUESTION_TEXT_CLASS,
  QUIZ_RESULT_LABEL_CLASS,
  QUIZ_RESULT_PERCENT_CLASS,
  QUIZ_THEME_TITLE_CLASS,
} from "@/lib/display/quiz-display-typography";
import { useQuizPhaseSync } from "@/hooks/useQuizPhaseSync";
import { cn } from "@/lib/utils";
import {
  PROJECTOR_QUIZ_HEADER_HEIGHT,
  PROJECTOR_QUIZ_MAIN_PAD,
} from "@/lib/display/projector-canvas";
import { resolveEveningHeartProgress } from "@/lib/display/evening-heart-progress";

interface DisplayQuizStageProps {
  eventSlug: string;
  quizState: QuizSessionState;
  currentQuestion: LoveRouletteQuestion | null;
  progressLabel: string | null;
  onQuizUpdate?: (
    quiz: QuizSessionState | null,
    runtimeState?: EventState,
  ) => void;
}

/** Tre zone fisse: header · centro · footer unificato (cuore · countdown · logo). */
function DisplayQuizGameLayout({
  header,
  center,
  footerCountdown,
  heartProgress,
  centerKey,
}: {
  header: ReactNode;
  center: ReactNode;
  footerCountdown?: { value: number; total: number } | null;
  heartProgress?: number;
  centerKey?: string;
}) {
  return (
    <div className="mx-auto flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden">
      <div className="mx-auto flex min-h-0 w-full max-w-[1280px] flex-1 flex-col overflow-hidden">
        <header className={cn("shrink-0 px-4 pt-2", PROJECTOR_QUIZ_HEADER_HEIGHT)}>
          <div className="flex h-full min-h-0 flex-col justify-center">{header}</div>
        </header>

        <section className={cn("min-h-0 flex-1 overflow-hidden", PROJECTOR_QUIZ_MAIN_PAD)}>
          <AnimatePresence mode="wait">
            <motion.div
              key={centerKey ?? "center"}
              className="flex h-full min-h-0 w-full flex-col"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              {center}
            </motion.div>
          </AnimatePresence>
        </section>
      </div>

      <DisplayQuizFooter
        countdown={footerCountdown ?? null}
        heartProgress={heartProgress}
      />
    </div>
  );
}

/** Testo quiz proiettore — sans + maiuscolo (vedi quiz-display-typography.ts). */
const QUIZ_READABLE = "font-sans font-semibold uppercase tracking-wide leading-tight";

function QuestionHeaderPanel({
  body,
  progressLabel,
  compact = false,
}: {
  body: string;
  progressLabel: string | null;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col justify-center rounded-2xl border border-white/15 bg-black/55 px-8 py-3 backdrop-blur-md shadow-[0_12px_48px_rgba(0,0,0,0.5)]",
        compact && "border-white/10 bg-black/45 py-2",
      )}
    >
      <p
        className={cn(
          "mb-2 uppercase tracking-[0.22em] text-primary/90",
          compact ? "text-xs" : "text-sm",
        )}
      >
        {progressLabel ?? "Quiz"}
      </p>
      <p className={cn(QUIZ_QUESTION_TEXT_CLASS, compact && "text-white/90")}>
        {body}
      </p>
    </div>
  );
}

function ThemeHeaderPanel({
  progressLabel,
  subtitle,
}: {
  progressLabel: string | null;
  subtitle?: string;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col justify-center rounded-2xl border border-white/15 bg-black/55 px-8 py-3 backdrop-blur-md">
      <p className="mb-2 text-sm uppercase tracking-[0.22em] text-primary/90">
        {progressLabel ?? "Prossima manche"}
      </p>
      {subtitle ? (
        <p
          className={cn(
            QUIZ_READABLE,
            "line-clamp-2 text-[24px] text-white/80",
          )}
        >
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

function CountdownHeaderPanel() {
  return (
    <div className="flex h-full min-h-0 flex-col justify-center rounded-2xl border border-white/15 bg-black/55 px-8 py-3 backdrop-blur-md">
      <p className="text-sm uppercase tracking-[0.22em] text-primary/90">
        Attenti
      </p>
      <p className="mt-1 font-sans text-3xl font-semibold text-white">
        Il quiz sta per iniziare
      </p>
    </div>
  );
}

function QuestionPhaseCenter() {
  return (
    <div
      className="flex h-full min-h-0 items-center justify-center px-2"
      aria-hidden
    />
  );
}

function NextQuestionCenter({ progressLabel }: { progressLabel: string | null }) {
  return (
    <div className="flex h-full min-h-0 items-center justify-center">
      <DisplayPhaseHero
        kicker={progressLabel ?? "Quiz"}
        headline="Prossima domanda"
        subline="Preparatevi"
        pulse
        uppercase
      />
    </div>
  );
}

function AnswerOptions({
  options,
}: {
  options: LoveRouletteQuestion["options"];
}) {
  return (
    <ul className="grid h-full min-h-0 w-full grid-rows-4 gap-2">
      {options.map((option, index) => (
        <motion.li
          key={option.id}
          className="flex min-h-0 items-center rounded-xl border border-white/15 bg-black/50 px-5 font-sans text-white backdrop-blur-sm"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 + index * 0.05, duration: 0.3 }}
        >
          <span className={cn(QUIZ_ANSWER_LETTER_CLASS, "mr-3")}>
            {String.fromCharCode(65 + index)}.
          </span>
          <span className={cn(QUIZ_ANSWER_TEXT_CLASS, "min-w-0 flex-1")}>
            {option.label}
          </span>
        </motion.li>
      ))}
    </ul>
  );
}

function ThemeCenter({ title }: { title: string }) {
  return (
    <div className="relative flex h-full min-h-0 items-center justify-center px-4">
      {[0, 1, 2].map((ring) => (
        <motion.div
          key={ring}
          className="pointer-events-none absolute left-1/2 top-1/2 size-[min(70%,420px)] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary/35"
          initial={{ scale: 0.5, opacity: 0.65 }}
          animate={{ scale: 1.65, opacity: 0 }}
          transition={{
            duration: 2.6,
            repeat: Infinity,
            delay: ring * 0.7,
            ease: "easeOut",
          }}
          aria-hidden
        />
      ))}
      <div className="relative z-10 w-full max-w-4xl rounded-2xl border border-white/15 bg-black/55 px-10 py-14 text-center backdrop-blur-md shadow-[0_12px_48px_rgba(0,0,0,0.5)]">
        <motion.p
          className={cn(QUIZ_THEME_TITLE_CLASS, "text-center")}
          style={{ textShadow: "0 2px 24px rgba(0,0,0,0.9)" }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          {title}
        </motion.p>
      </div>
    </div>
  );
}

function ResultsBars({
  results,
  animateFill,
}: {
  results: QuestionResults;
  animateFill: boolean;
}) {
  return (
    <motion.div
      className="flex h-full min-h-0 w-full flex-col gap-3"
      initial="hidden"
      animate="show"
      variants={{
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: {
            staggerChildren: 0.12,
            delayChildren: 0.08,
          },
        },
      }}
    >
      <motion.div
        className="flex shrink-0 items-baseline justify-between gap-3 px-1"
        variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}
      >
        <p className="text-sm uppercase tracking-[0.2em] text-primary font-semibold">
          Risultati in sala
        </p>
        <p className="text-xs text-white/50 tabular-nums">
          {results.totalAnswers}{" "}
          {results.totalAnswers === 1 ? "risposta" : "risposte"}
        </p>
      </motion.div>

      <div className="grid min-h-0 flex-1 grid-rows-4 gap-2">
        {results.options.map((stat, index) => {
          const letter = String.fromCharCode(65 + index);
          return (
            <motion.div
              key={stat.optionId}
              className="flex min-h-0 flex-col justify-center rounded-xl border border-white/15 bg-black/55 px-4 py-2 backdrop-blur-sm"
              variants={{
                hidden: { opacity: 0, x: -20 },
                show: { opacity: 1, x: 0 },
              }}
            >
              <div className="flex min-h-0 items-center justify-between gap-2">
                <span className="flex min-w-0 flex-1 items-center gap-2">
                  <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-md border border-primary/55 bg-primary/15 font-mono text-base font-bold text-primary">
                    {letter}
                  </span>
                  <span className={cn(QUIZ_RESULT_LABEL_CLASS, "min-w-0 flex-1")}>
                    {stat.label}
                  </span>
                </span>
                <motion.span
                  className={QUIZ_RESULT_PERCENT_CLASS}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: animateFill ? 0.3 + index * 0.1 : 0 }}
                >
                  {stat.percent}%
                </motion.span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-primary/70 via-primary to-primary/90"
                  initial={{ width: "0%" }}
                  animate={{ width: `${stat.percent}%` }}
                  transition={
                    animateFill
                      ? { delay: 0.15 + index * 0.1, type: "spring", stiffness: 90 }
                      : { duration: 0 }
                  }
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

export function DisplayQuizStage({
  eventSlug,
  quizState,
  currentQuestion,
  progressLabel,
  onQuizUpdate,
}: DisplayQuizStageProps) {
  const [results, setResults] = useState<QuestionResults | null>(null);
  const serverPhase = quizState.displayPhase as QuizDisplayPhase;
  const timing = quizState.timing;
  const heartProgress = resolveEveningHeartProgress("quiz", quizState);

  const autoplayEnabled = quizState.autoplayEnabled === true;

  const { remaining, displayPhase: phase, tickServer } = useQuizPhaseSync({
    eventSlug,
    quizState,
    enabled: true,
    driveTicks: autoplayEnabled && serverPhase !== "start_countdown",
    onPhaseChange: (nextPhase) => {
      if (nextPhase === "results") {
        setResults(null);
      }
    },
    onTick: (quiz, runtimeState) => onQuizUpdate?.(quiz, runtimeState),
  });

  useEffect(() => {
    if (phase !== "results" || !currentQuestion) return;

    let cancelled = false;

    async function loadStats() {
      try {
        const res = await fetch(
          `/api/events/${encodeURIComponent(eventSlug)}/quiz/stats?questionId=${encodeURIComponent(currentQuestion!.id)}`,
        );
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as QuestionResults;
        if (!cancelled) setResults(data);
      } catch {
        // keep empty bars
      }
    }

    void loadStats();
    const refresh = window.setInterval(loadStats, 1500);

    return () => {
      cancelled = true;
      window.clearInterval(refresh);
    };
  }, [currentQuestion, eventSlug, phase, quizState.currentIndex]);

  const theme = resolveThemeForQuizIndex(
    quizState.questionIds,
    quizState.currentIndex,
    quizState.manche,
    currentQuestion?.category,
  );

  const footerCountdown =
    phase === "answers"
      ? { value: remaining, total: timing.questionSeconds }
      : null;

  const handleLaunchComplete = useCallback(() => {
    void tickServer();
  }, [tickServer]);

  if (serverPhase === "start_countdown") {
    return (
      <div className="mx-auto flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden">
        <DisplayQuizLaunchSpectacle
          remaining={remaining}
          onComplete={handleLaunchComplete}
          phaseNumber={1}
          className="flex-1"
        />
        <DisplayQuizFooter countdown={null} heartProgress={heartProgress} />
      </div>
    );
  }

  if (phase === "theme_intro" && theme) {
    if (
      !isMancheThemeIntroForIndex(
        quizState.questionIds,
        quizState.currentIndex,
        quizState.manche,
      )
    ) {
      return (
        <DisplayQuizGameLayout
          centerKey={`next-${quizState.currentIndex}`}
          header={
            currentQuestion ? (
              <QuestionHeaderPanel
                body={currentQuestion.body}
                progressLabel={progressLabel}
                compact
              />
            ) : (
              <CountdownHeaderPanel />
            )
          }
          center={<NextQuestionCenter progressLabel={progressLabel} />}
          footerCountdown={null}
          heartProgress={heartProgress}
        />
      );
    }

    return (
      <DisplayQuizGameLayout
        centerKey={`theme-${quizState.currentIndex}`}
        header={
          <ThemeHeaderPanel
            progressLabel={progressLabel}
            subtitle={theme.subtitle}
          />
        }
        center={<ThemeCenter title={theme.title} />}
        footerCountdown={null}
        heartProgress={heartProgress}
      />
    );
  }

  if (phase === "question" && currentQuestion) {
    return (
      <DisplayQuizGameLayout
        centerKey={`question-stem-${quizState.currentIndex}`}
        header={
          <QuestionHeaderPanel
            body={currentQuestion.body}
            progressLabel={progressLabel}
          />
        }
        center={<QuestionPhaseCenter />}
        footerCountdown={null}
        heartProgress={heartProgress}
      />
    );
  }

  if (phase === "answers" && currentQuestion) {
    return (
      <DisplayQuizGameLayout
        centerKey={`answers-${quizState.currentIndex}`}
        header={
          <QuestionHeaderPanel
            body={currentQuestion.body}
            progressLabel={progressLabel}
          />
        }
        center={<AnswerOptions options={currentQuestion.options} />}
        footerCountdown={footerCountdown}
        heartProgress={heartProgress}
      />
    );
  }

  if (phase === "next_question") {
    return (
      <DisplayQuizGameLayout
        centerKey={`next-${quizState.currentIndex}`}
        header={
          currentQuestion ? (
            <QuestionHeaderPanel
              body={currentQuestion.body}
              progressLabel={progressLabel}
              compact
            />
          ) : (
            <CountdownHeaderPanel />
          )
        }
        center={<NextQuestionCenter progressLabel={progressLabel} />}
        footerCountdown={null}
        heartProgress={heartProgress}
      />
    );
  }

  if (phase === "results" && currentQuestion) {
    return (
      <DisplayQuizGameLayout
        centerKey={`results-${quizState.currentIndex}`}
        header={
          <QuestionHeaderPanel
            body={currentQuestion.body}
            progressLabel={progressLabel}
            compact
          />
        }
        center={
          <ResultsBars
            results={
              results ?? {
                questionId: currentQuestion.id,
                totalAnswers: 0,
                options: currentQuestion.options.map((o, i) => ({
                  optionId: o.id,
                  label: o.label,
                  sortOrder: o.sortOrder ?? i,
                  count: 0,
                  percent: 0,
                })),
              }
            }
            animateFill={Boolean(results)}
          />
        }
        footerCountdown={null}
        heartProgress={heartProgress}
      />
    );
  }

  return null;
}
