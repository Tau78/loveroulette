"use client";

import { useEffect, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { EventState } from "@/lib/types";
import type { LoveRouletteQuestion } from "@/lib/musicpro/types";
import type { QuizSessionState } from "@/lib/musicpro/quiz-state";
import type { QuestionResults } from "@/lib/musicpro/quiz-results";
import {
  resolveThemeForQuizIndex,
  type QuizDisplayPhase,
} from "@/lib/musicpro/quiz-display";
import { DisplayPhaseHero } from "@/components/display/DisplayShowText";
import { DisplayQuizFooter } from "@/components/display/DisplayQuizFooter";
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

/** Tre zone fisse: header · centro · footer (countdown). Cuore/logo sullo sfondo. */
function DisplayQuizGameLayout({
  header,
  center,
  footerCountdown,
  centerKey,
}: {
  header: ReactNode;
  center: ReactNode;
  footerCountdown?: { value: number; total: number } | null;
  centerKey?: string;
}) {
  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-5xl flex-1 flex-col overflow-hidden">
      <header
        className={cn(
          "shrink-0 px-2 pt-1 md:px-4 md:pt-2",
          "h-[clamp(5.5rem,20vh,9.5rem)] min-h-[5.5rem] max-h-[9.5rem]",
        )}
      >
        <div className="flex h-full min-h-0 flex-col justify-center">{header}</div>
      </header>

      <section className="min-h-0 flex-1 overflow-hidden px-2 md:px-4 py-2 md:py-3">
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

      <DisplayQuizFooter countdown={footerCountdown ?? null} />
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
        "flex h-full min-h-0 flex-col justify-center rounded-2xl border border-white/15 bg-black/55 px-5 py-3 backdrop-blur-md shadow-[0_12px_48px_rgba(0,0,0,0.5)] md:px-8",
        compact && "border-white/10 bg-black/45 py-2",
      )}
    >
      <p
        className={cn(
          "mb-1.5 uppercase tracking-[0.22em] text-primary/90 md:mb-2",
          compact ? "text-[10px] md:text-xs" : "text-xs md:text-sm",
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
    <div className="flex h-full min-h-0 flex-col justify-center rounded-2xl border border-white/15 bg-black/55 px-5 py-3 backdrop-blur-md md:px-8">
      <p className="mb-1.5 text-xs uppercase tracking-[0.22em] text-primary/90 md:mb-2 md:text-sm">
        {progressLabel ?? "Prossima manche"}
      </p>
      {subtitle ? (
        <p
          className={cn(
            QUIZ_READABLE,
            "line-clamp-2 text-[clamp(0.875rem,min(2.2vh,2.8vw),1.5rem)] text-white/80",
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
    <div className="flex h-full min-h-0 flex-col justify-center rounded-2xl border border-white/15 bg-black/55 px-5 py-3 backdrop-blur-md md:px-8">
      <p className="text-xs uppercase tracking-[0.22em] text-primary/90 md:text-sm">
        Attenti
      </p>
      <p className="mt-1 font-sans text-xl font-semibold text-white md:text-3xl">
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
    <ul className="grid h-full min-h-0 w-full grid-rows-4 gap-[clamp(0.35rem,1vh,0.65rem)]">
      {options.map((option, index) => (
        <motion.li
          key={option.id}
          className="flex min-h-0 items-center rounded-xl border border-white/15 bg-black/50 px-[clamp(0.5rem,1.5vw,1.25rem)] font-sans text-white backdrop-blur-sm"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 + index * 0.05, duration: 0.3 }}
        >
          <span className={cn(QUIZ_ANSWER_LETTER_CLASS, "mr-[clamp(0.35rem,1vw,0.75rem)]")}>
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
      <div className="relative z-10 w-full max-w-4xl rounded-2xl border border-white/15 bg-black/55 px-6 py-10 text-center backdrop-blur-md shadow-[0_12px_48px_rgba(0,0,0,0.5)] md:px-10 md:py-14">
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
      className="flex h-full min-h-0 w-full flex-col gap-2 md:gap-3"
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
        <p className="text-xs uppercase tracking-[0.2em] text-primary font-semibold md:text-sm">
          Risultati in sala
        </p>
        <p className="text-[10px] text-white/50 tabular-nums md:text-xs">
          {results.totalAnswers}{" "}
          {results.totalAnswers === 1 ? "risposta" : "risposte"}
        </p>
      </motion.div>

      <div className="grid min-h-0 flex-1 grid-rows-4 gap-[clamp(0.25rem,0.8vh,0.5rem)]">
        {results.options.map((stat, index) => {
          const letter = String.fromCharCode(65 + index);
          return (
            <motion.div
              key={stat.optionId}
              className="flex min-h-0 flex-col justify-center rounded-xl border border-white/15 bg-black/55 px-[clamp(0.5rem,1.2vw,1rem)] py-[clamp(0.25rem,0.8vh,0.5rem)] backdrop-blur-sm"
              variants={{
                hidden: { opacity: 0, x: -20 },
                show: { opacity: 1, x: 0 },
              }}
            >
              <div className="flex min-h-0 items-center justify-between gap-2">
                <span className="flex min-w-0 flex-1 items-center gap-[clamp(0.35rem,1vw,0.5rem)]">
                  <span className="inline-flex size-[clamp(1.5rem,min(3.5vh,4vw),2rem)] shrink-0 items-center justify-center rounded-md border border-primary/55 bg-primary/15 font-mono text-[clamp(0.65rem,min(1.8vh,2.2vw),1rem)] font-bold text-primary">
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
              <div className="mt-1 h-[clamp(0.35rem,0.9vh,0.65rem)] overflow-hidden rounded-full bg-white/10">
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
  const phase = quizState.displayPhase as QuizDisplayPhase;
  const timing = quizState.timing;

  const { remaining } = useQuizPhaseSync({
    eventSlug,
    quizState,
    enabled: true,
    driveTicks: quizState.autoplayEnabled !== false,
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
    phase === "start_countdown"
      ? { value: remaining, total: timing.startCountdownSeconds }
      : phase === "answers"
        ? { value: remaining, total: timing.questionSeconds }
        : null;

  if (phase === "start_countdown") {
    return (
      <DisplayQuizGameLayout
        centerKey="start-countdown"
        header={<CountdownHeaderPanel />}
        center={
          <div className="flex h-full items-center justify-center">
            <DisplayPhaseHero
              kicker="Countdown"
              headline={`${remaining}`}
              subline="secondi al via"
              pulse
              uppercase
            />
          </div>
        }
        footerCountdown={footerCountdown}
      />
    );
  }

  if (phase === "theme_intro" && theme) {
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
      />
    );
  }

  return null;
}
