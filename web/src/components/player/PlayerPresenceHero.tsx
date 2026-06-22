"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { EventState } from "@/lib/types";
import type { QuizDisplayPhase } from "@/lib/musicpro/quiz-display";
import { playerWelcomeLabel } from "@/lib/player/presence-copy";
import { cn } from "@/lib/utils";

interface PlayerPresenceHeroProps {
  nickname: string;
  gender: "male" | "female";
  runtimeState: EventState;
  quizPhase?: QuizDisplayPhase | null;
  votingOpen?: boolean;
  answersRemaining?: number;
  subtitle: string;
  className?: string;
}

export function PlayerPresenceHero({
  nickname,
  gender,
  runtimeState,
  quizPhase,
  answersRemaining,
  subtitle,
  className,
}: PlayerPresenceHeroProps) {
  const reduceMotion = useReducedMotion();
  const showWelcome = runtimeState === "lobby";
  const urgent =
    runtimeState === "quiz" &&
    (quizPhase === "start_countdown" ||
      (quizPhase === "answers" &&
        (answersRemaining === undefined || answersRemaining > 0)));
  const showSubtitle = Boolean(subtitle.trim());

  return (
    <motion.div
      className={cn("space-y-1 text-center", className)}
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
    >
      {showWelcome ? (
        <>
          <motion.h1
            className="font-display text-[2rem] font-bold uppercase leading-tight tracking-tight text-foreground"
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            Ciao {nickname}!
          </motion.h1>
          <motion.p
            className="font-display text-xl font-bold uppercase tracking-[0.22em] text-primary"
            initial={reduceMotion ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.06 }}
          >
            {playerWelcomeLabel(gender)}
          </motion.p>
        </>
      ) : null}
      {showSubtitle ? (
        <motion.p
          key={subtitle}
          className={cn(
            showWelcome ? "pt-2" : "pt-0",
            "text-sm leading-relaxed",
            urgent ? "font-semibold text-primary" : "text-muted-foreground",
            !showWelcome && "text-base",
          )}
          initial={reduceMotion ? false : { opacity: 0, y: 6 }}
          animate={
            urgent && !reduceMotion && !showWelcome
              ? {
                  opacity: 1,
                  y: 0,
                  textShadow: [
                    "0 0 0px rgba(236,72,153,0)",
                    "0 0 20px rgba(236,72,153,0.45)",
                    "0 0 0px rgba(236,72,153,0)",
                  ],
                }
              : { opacity: 1, y: 0 }
          }
          transition={
            urgent && !showWelcome
              ? { duration: 1.2, repeat: Infinity }
              : { duration: 0.35 }
          }
        >
          {subtitle}
        </motion.p>
      ) : null}
    </motion.div>
  );
}
