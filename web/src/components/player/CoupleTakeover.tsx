"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface CoupleTakeoverProps {
  partnerNick: string;
  onDismiss?: () => void;
}

export function CoupleTakeover({
  partnerNick,
  onDismiss,
}: CoupleTakeoverProps) {
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence>
      <motion.div
        role="alertdialog"
        aria-live="assertive"
        aria-label={`Sei in coppia con ${partnerNick}`}
        className="fixed inset-0 z-50 flex items-center justify-center p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.4 }}
      >
        <motion.div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, var(--takeover-gold-glow) 0%, var(--takeover-gold) 55%, #b8860b 100%)",
          }}
          initial={reduceMotion ? false : { scale: 1.2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />

        {!reduceMotion && (
          <>
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="absolute inset-0 rounded-full border-4"
                style={{ borderColor: "var(--takeover-gold-light)" }}
                initial={{ scale: 0.5, opacity: 0.8 }}
                animate={{ scale: 2.5, opacity: 0 }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.6,
                  ease: "easeOut",
                }}
              />
            ))}
          </>
        )}

        <motion.div
          className="relative z-10 max-w-sm space-y-4 text-center"
          initial={reduceMotion ? false : { scale: 0.8, y: 30, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={{ delay: reduceMotion ? 0 : 0.3, duration: 0.5, type: "spring" }}
        >
          <motion.p
            className="text-5xl font-black tracking-tight drop-shadow-lg md:text-6xl"
            style={{ color: "var(--takeover-text)" }}
            animate={
              reduceMotion
                ? undefined
                : { scale: [1, 1.05, 1] }
            }
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          >
            ALZATI!
          </motion.p>
          <p
            className="text-xl font-semibold md:text-2xl"
            style={{ color: "var(--takeover-text-muted)" }}
          >
            Sei in coppia con
          </p>
          <motion.p
            className="text-4xl font-bold drop-shadow-md md:text-5xl"
            style={{ color: "var(--takeover-text)" }}
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            {partnerNick}
          </motion.p>
          <p className="pt-2 text-6xl" aria-hidden>
            ♥
          </p>
        </motion.div>

        {onDismiss ? (
          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={onDismiss}
            className="absolute bottom-[max(2rem,env(safe-area-inset-bottom))] left-1/2 min-w-[8rem] -translate-x-1/2 border-0 bg-black/25 text-[var(--takeover-text)] backdrop-blur-sm"
          >
            OK
          </Button>
        ) : null}
      </motion.div>
    </AnimatePresence>
  );
}
