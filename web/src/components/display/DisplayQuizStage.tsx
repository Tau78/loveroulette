"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import type { EventState } from "@/lib/types";
import type { LoveRouletteQuestion } from "@/lib/musicpro/types";
import type { QuizSessionState } from "@/lib/musicpro/quiz-state";
import type { QuestionResults } from "@/lib/musicpro/quiz-results";
import type { PreviewPairRow } from "@/lib/musicpro/matching";
import {
  resolveThemeForQuizIndex,
  type QuizDisplayPhase,
  isMancheThemeIntroForIndex,
} from "@/lib/musicpro/quiz-display";
import { DisplayPhaseHero } from "@/components/display/DisplayShowText";
import { DisplayQuizFooter } from "@/components/display/DisplayQuizFooter";
import { DisplayQuizLaunchSpectacle } from "@/components/display/DisplayQuizLaunchSpectacle";
import { DisplayThemeSlide } from "@/components/display/DisplayThemeSlide";
import {
  QUIZ_ANSWER_LETTER_CLASS,
  QUIZ_ANSWER_TEXT_CLASS,
  QUIZ_QUESTION_TEXT_CLASS,
  QUIZ_RESULT_LABEL_CLASS,
  QUIZ_RESULT_PERCENT_CLASS,
} from "@/lib/display/quiz-display-typography";
import {
  QUIZ_ANSWER_SLIDE,
  QUIZ_QUESTION_SLIDE,
  quizAnswerEnterX,
  quizAnswersRevealMs,
} from "@/lib/display/quiz-reveal-motion";
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
  instantCenter = false,
}: {
  header: ReactNode;
  center: ReactNode;
  footerCountdown?: { value: number; total: number } | null;
  heartProgress?: number;
  centerKey?: string;
  /** Evita fade sul centro (es. reveal risposte con slide laterali). */
  instantCenter?: boolean;
}) {
  return (
    <div className="mx-auto flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden">
      <div
        className={cn(
          "mx-auto flex min-h-0 w-full max-w-[1280px] flex-1 flex-col",
          instantCenter
            ? "overflow-x-visible overflow-y-hidden"
            : "overflow-hidden",
        )}
      >
        <header className={cn("shrink-0 px-4 pt-2", PROJECTOR_QUIZ_HEADER_HEIGHT)}>
          <div className="flex h-full min-h-0 flex-col justify-center overflow-hidden">
            {header}
          </div>
        </header>

        <section
          className={cn(
            "min-h-0 flex-1",
            PROJECTOR_QUIZ_MAIN_PAD,
            instantCenter
              ? "overflow-x-visible overflow-y-hidden"
              : "overflow-hidden",
          )}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={centerKey ?? "center"}
              className="flex h-full min-h-0 w-full flex-col"
              initial={instantCenter ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={instantCenter ? undefined : { opacity: 0 }}
              transition={{ duration: instantCenter ? 0 : 0.18 }}
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
  slideIn = false,
  motionKey,
}: {
  body: string;
  progressLabel: string | null;
  compact?: boolean;
  /** Domanda che entra da sinistra (fase question). */
  slideIn?: boolean;
  motionKey?: string;
}) {
  const reduceMotion = useReducedMotion();
  const shouldSlide = slideIn && !reduceMotion;

  return (
    <motion.div
      key={motionKey ?? body}
      className={cn(
        "flex h-full min-h-0 flex-col justify-center rounded-2xl border border-white/15 bg-black/55 px-8 py-3 backdrop-blur-md shadow-[0_12px_48px_rgba(0,0,0,0.5)]",
        compact && "border-white/10 bg-black/45 py-2",
      )}
      initial={
        shouldSlide
          ? { opacity: 0, x: QUIZ_QUESTION_SLIDE.fromX }
          : false
      }
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: QUIZ_QUESTION_SLIDE.duration,
        ease: QUIZ_QUESTION_SLIDE.ease,
      }}
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
    </motion.div>
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
      <p className="mb-1 text-sm uppercase tracking-[0.22em] text-primary/90">
        {progressLabel ?? "Prossima manche"}
      </p>
      <p
        className={cn(
          QUIZ_READABLE,
            "line-clamp-2 text-[26px] text-white/75",
        )}
      >
        {subtitle ?? "Nuova manche"}
      </p>
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

function AnswerRowShell({
  index,
  children,
  skeleton = false,
}: {
  index: number;
  children?: ReactNode;
  skeleton?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex min-h-0 items-center rounded-xl border px-5 font-sans backdrop-blur-sm",
        skeleton
          ? "border-dashed border-white/20 bg-black/25"
          : "border-white/15 bg-black/50 text-white",
      )}
    >
      <span
        className={cn(
          QUIZ_ANSWER_LETTER_CLASS,
          "mr-3",
          skeleton && "text-primary/55",
        )}
      >
        {String.fromCharCode(65 + index)}.
      </span>
      {children}
    </div>
  );
}

/** Scheletro A–D vuoto: la domanda è già leggibile, le risposte arrivano al prossimo AVANTI. */
function AnswerSkeleton() {
  return (
    <ul className="grid h-full min-h-0 w-full grid-rows-4 gap-2" aria-hidden>
      {[0, 1, 2, 3].map((index) => (
        <li key={index} className="min-h-0">
          <AnswerRowShell index={index} skeleton>
            <span className="h-3 w-[42%] rounded-full bg-white/10" />
          </AnswerRowShell>
        </li>
      ))}
    </ul>
  );
}

function QuestionPhaseCenter() {
  return (
    <div className="flex h-full min-h-0 flex-col px-2">
      <AnswerSkeleton />
    </div>
  );
}

function AnswerOptions({
  options,
  onRevealComplete,
}: {
  options: LoveRouletteQuestion["options"];
  onRevealComplete?: () => void;
}) {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!onRevealComplete) return;
    if (reduceMotion) {
      onRevealComplete();
      return;
    }
    const timer = window.setTimeout(onRevealComplete, quizAnswersRevealMs());
    return () => window.clearTimeout(timer);
  }, [onRevealComplete, reduceMotion, options]);

  return (
    <ul className="grid h-full min-h-0 w-full grid-rows-4 gap-2">
      {options.map((option, index) => (
        <motion.li
          key={option.id}
          className="min-h-0"
          initial={
            reduceMotion
              ? false
              : { opacity: 0, x: quizAnswerEnterX(index) }
          }
          animate={{ opacity: 1, x: 0 }}
          transition={{
            delay: reduceMotion ? 0 : index * QUIZ_ANSWER_SLIDE.stagger,
            duration: QUIZ_ANSWER_SLIDE.duration,
            ease: QUIZ_ANSWER_SLIDE.ease,
          }}
        >
          <AnswerRowShell index={index}>
            <span className={cn(QUIZ_ANSWER_TEXT_CLASS, "min-w-0 flex-1")}>
              {option.label}
            </span>
          </AnswerRowShell>
        </motion.li>
      ))}
    </ul>
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

function AnswersStopOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
      <div className="relative px-10 py-8">
        <div
          className="pointer-events-none absolute -inset-x-6 -inset-y-4 rounded-[2rem] bg-gradient-to-b from-black/85 via-black/75 to-black/85 backdrop-blur-md border border-white/15 shadow-[0_24px_80px_rgba(0,0,0,0.7)]"
          aria-hidden
        />
        <p
          className="relative z-10 font-sans text-[86px] font-bold uppercase tracking-[0.18em] text-white"
          style={{
            textShadow:
              "0 0 24px rgba(233,30,140,0.5), 0 2px 8px rgba(0,0,0,1), 0 4px 24px rgba(0,0,0,0.85)",
          }}
        >
          Stop
        </p>
        <p className="relative z-10 mt-2 text-center text-sm uppercase tracking-[0.28em] text-primary">
          Tempo scaduto
        </p>
      </div>
    </div>
  );
}

function PairingRanking({
  pairs,
  questionCount,
}: {
  pairs: PreviewPairRow[];
  questionCount: number;
}) {
  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-3">
      <div className="flex shrink-0 items-baseline justify-between gap-3 px-1">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          Classifica temporanea
        </p>
        <p className="text-xs tabular-nums text-white/50">
          {questionCount} {questionCount === 1 ? "domanda" : "domande"}
        </p>
      </div>
      {pairs.length === 0 ? (
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <DisplayPhaseHero
            kicker="Accoppiamento"
            headline="In formazione"
            subline="Servono più voti"
            uppercase
          />
        </div>
      ) : (
        <ol className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-hidden">
          {pairs.map((pair) => (
            <li
              key={`${pair.rank}-${pair.maleNickname}-${pair.femaleNickname}`}
              className="flex min-h-0 items-center justify-between gap-3 rounded-xl border border-white/15 bg-black/55 px-4 py-1.5 backdrop-blur-sm"
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-md border border-primary/55 bg-primary/15 font-mono text-base font-bold text-primary">
                  {pair.rank}
                </span>
                <span className={cn(QUIZ_RESULT_LABEL_CLASS, "min-w-0 flex-1")}>
                  {pair.maleNickname} · {pair.femaleNickname}
                </span>
              </span>
              <span className={QUIZ_RESULT_PERCENT_CLASS}>
                {Math.round(pair.score)}%
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function ThemeCenter({
  title,
  subtitle,
  category,
}: {
  title: string;
  subtitle?: string;
  category?: string | null;
}) {
  return (
    <DisplayThemeSlide
      title={title}
      subtitle={subtitle}
      category={category}
      kicker="Manche"
      className="h-full"
    />
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
  const [ranking, setRanking] = useState<{
    pairs: PreviewPairRow[];
    questionCount: number;
  } | null>(null);
  const [answersCountdownReady, setAnswersCountdownReady] = useState(false);
  const serverPhase = quizState.displayPhase as QuizDisplayPhase;
  const timing = quizState.timing;
  const heartProgress = resolveEveningHeartProgress("quiz", quizState);

  const autoplayEnabled = quizState.autoplayEnabled === true;

  const { remaining, displayPhase: phase, tickServer } = useQuizPhaseSync({
    eventSlug,
    quizState,
    enabled: true,
    driveTicks:
      autoplayEnabled &&
      serverPhase !== "start_countdown" &&
      serverPhase !== "answers",
    onPhaseChange: (nextPhase) => {
      if (nextPhase === "results") {
        setResults(null);
      }
      if (nextPhase === "answers") {
        setAnswersCountdownReady(false);
      }
    },
    onTick: (quiz, runtimeState) => onQuizUpdate?.(quiz, runtimeState),
  });

  useEffect(() => {
    if (phase !== "answers") {
      setAnswersCountdownReady(false);
    }
  }, [phase, quizState.currentIndex]);

  const handleAnswersRevealed = useCallback(() => {
    setAnswersCountdownReady(true);
  }, []);

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

  useEffect(() => {
    if (phase !== "next_question") {
      setRanking(null);
      return;
    }

    let cancelled = false;

    async function loadRanking() {
      try {
        const res = await fetch(
          `/api/events/${encodeURIComponent(eventSlug)}/quiz/ranking`,
        );
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as {
          pairs?: PreviewPairRow[];
          questionCount?: number;
        };
        if (!cancelled) {
          setRanking({
            pairs: data.pairs ?? [],
            questionCount: data.questionCount ?? 0,
          });
        }
      } catch {
        if (!cancelled) setRanking({ pairs: [], questionCount: 0 });
      }
    }

    void loadRanking();
    return () => {
      cancelled = true;
    };
  }, [eventSlug, phase, quizState.currentIndex]);

  const theme = resolveThemeForQuizIndex(
    quizState.questionIds,
    quizState.currentIndex,
    quizState.manche,
    currentQuestion?.category,
  );

  const footerCountdown =
    phase === "answers" && answersCountdownReady
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
          <ThemeHeaderPanel progressLabel={progressLabel} />
        }
        center={
          <ThemeCenter
            title={theme.title}
            subtitle={theme.subtitle}
            category={currentQuestion?.category}
          />
        }
        footerCountdown={null}
        heartProgress={heartProgress}
      />
    );
  }

  if (phase === "question" && currentQuestion) {
    return (
      <DisplayQuizGameLayout
        centerKey={`question-stem-${quizState.currentIndex}`}
        instantCenter
        header={
          <QuestionHeaderPanel
            body={currentQuestion.body}
            progressLabel={progressLabel}
            slideIn
            motionKey={`q-${quizState.currentIndex}`}
          />
        }
        center={<QuestionPhaseCenter />}
        footerCountdown={null}
        heartProgress={heartProgress}
      />
    );
  }

  if (phase === "answers" && currentQuestion) {
    const locked = remaining <= 0;
    return (
      <DisplayQuizGameLayout
        centerKey={`answers-${quizState.currentIndex}`}
        instantCenter
        header={
          <QuestionHeaderPanel
            body={currentQuestion.body}
            progressLabel={progressLabel}
            motionKey={`q-${quizState.currentIndex}`}
          />
        }
        center={
          <div className="relative h-full min-h-0">
            <div className={locked ? "h-full min-h-0 opacity-40" : "h-full min-h-0"}>
              <AnswerOptions
                options={currentQuestion.options}
                onRevealComplete={handleAnswersRevealed}
              />
            </div>
            {locked ? <AnswersStopOverlay /> : null}
          </div>
        }
        footerCountdown={footerCountdown}
        heartProgress={heartProgress}
      />
    );
  }

  if (phase === "next_question") {
    return (
      <DisplayQuizGameLayout
        centerKey={`ranking-${quizState.currentIndex}`}
        header={
          <ThemeHeaderPanel
            progressLabel={progressLabel}
            subtitle="Classifica di accoppiamento temporaneo"
          />
        }
        center={
          ranking ? (
            <PairingRanking
              pairs={ranking.pairs}
              questionCount={ranking.questionCount}
            />
          ) : (
            <NextQuestionCenter progressLabel={progressLabel} />
          )
        }
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
