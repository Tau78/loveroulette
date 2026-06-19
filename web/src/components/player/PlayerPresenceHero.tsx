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
  subtitle: string;
  className?: string;
}

export function PlayerPresenceHero({
  nickname,
  gender,
  runtimeState,
  quizPhase,
  subtitle,
  className,
}: PlayerPresenceHeroProps) {
  const reduceMotion = useReducedMotion();
  const urgent =
    runtimeState === "quiz" &&
    (quizPhase === "answers" || quizPhase === "start_countdown");
  const showSubtitle = Boolean(subtitle.trim());

  return (
    <motion.div
      className={cn("space-y-1 text-center", className)}
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
    >
      <motion.h1
        className="font-display text-[2rem] font-bold uppercase leading-tight tracking-tight text-foreground"
        animate={
          urgent && !reduceMotion
            ? {
                textShadow: [
                  "0 0 0px rgba(236,72,153,0)",
                  "0 0 24px rgba(236,72,153,0.55)",
                  "0 0 0px rgba(236,72,153,0)",
                ],
              }
            : undefined
        }
        transition={{ duration: 1.2, repeat: urgent ? Infinity : 0 }}
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
      {showSubtitle ? (
        <motion.p
          key={subtitle}
          className={cn(
            "pt-2 text-sm leading-relaxed",
            urgent ? "font-semibold text-primary" : "text-muted-foreground",
          )}
          initial={reduceMotion ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          {subtitle}
        </motion.p>
      ) : null}
    </motion.div>
  );
}
