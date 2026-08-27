"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

export type CasaSpotlight = {
  key: number;
  id: string;
  nick: string;
  gender: "M" | "F";
  photo?: string;
  score: number;
};

const AVATAR_M = "/grafiche/avatar-m.png";
const AVATAR_F = "/grafiche/avatar-f.png";
const EASE = [0.16, 1, 0.3, 1] as const;

function faceOf(spot: CasaSpotlight) {
  return spot.photo || (spot.gender === "F" ? AVATAR_F : AVATAR_M);
}

function scoreLabel(score: number) {
  if (score > 0) return `+${score}`;
  return String(score);
}

export function CasaPlayerSpotlight({ spot }: { spot: CasaSpotlight | null }) {
  const reduce = useReducedMotion();

  return (
    <AnimatePresence>
      {spot ? (
        <motion.div
          key={spot.key}
          className="casa-spot"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0.15 : 0.35 }}
        >
          {!reduce ? (
            <>
              <motion.i
                className="casa-spot-flash"
                initial={{ opacity: 0.7 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
              />
              {[0, 1, 2].map((ring) => (
                <motion.span
                  key={ring}
                  className="casa-spot-ring"
                  initial={{ scale: 0.2, opacity: 0.85 }}
                  animate={{ scale: 1.7, opacity: 0 }}
                  transition={{
                    duration: 1.6,
                    delay: ring * 0.18,
                    ease: "easeOut",
                  }}
                />
              ))}
            </>
          ) : null}

          <div className="casa-spot-card">
            <motion.span
              className="casa-spot-face"
              initial={reduce ? false : { scale: 0.4, opacity: 0, rotate: -8 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 220, damping: 16, delay: reduce ? 0 : 0.12 }}
            >
              <img src={faceOf(spot)} alt="" />
            </motion.span>

            <motion.p
              className="casa-spot-sex"
              initial={reduce ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reduce ? 0 : 0.32, duration: 0.4, ease: EASE }}
            >
              {spot.gender === "F" ? "Lei" : "Lui"}
            </motion.p>

            <motion.p
              className="casa-spot-nick"
              initial={reduce ? false : { opacity: 0, y: 48, filter: "blur(12px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ delay: reduce ? 0 : 0.4, duration: 0.55, ease: EASE }}
            >
              {spot.nick}
            </motion.p>

            <motion.p
              className="casa-spot-score"
              data-neg={spot.score < 0 ? "1" : undefined}
              data-zero={spot.score === 0 ? "1" : undefined}
              initial={reduce ? false : { opacity: 0, scale: 1.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: reduce ? 0 : 0.62, type: "spring", stiffness: 260, damping: 14 }}
            >
              {scoreLabel(spot.score)}
            </motion.p>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
