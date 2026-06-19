"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Maximize } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useFullscreen } from "@/hooks/useFullscreen";
import { cn } from "@/lib/utils";

const DISMISS_KEY = "lr_player_fullscreen_prompt";

interface PlayerMobileShellProps {
  eventSlug: string;
  children: ReactNode;
  className?: string;
}

export function PlayerMobileShell({
  eventSlug,
  children,
  className,
}: PlayerMobileShellProps) {
  const { containerRef, isFullscreen, supported, enter } = useFullscreen({
    storageKey: `lr_player_fullscreen_${eventSlug}`,
    enableShortcut: false,
  });

  const [promptVisible, setPromptVisible] = useState(false);

  useEffect(() => {
    if (!supported || isFullscreen) {
      setPromptVisible(false);
      return;
    }
    try {
      setPromptVisible(sessionStorage.getItem(DISMISS_KEY) !== "1");
    } catch {
      setPromptVisible(true);
    }
  }, [isFullscreen, supported]);

  const handleEnter = useCallback(async () => {
    await enter();
    setPromptVisible(false);
  }, [enter]);

  const handleDismiss = useCallback(() => {
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // ignore
    }
    setPromptVisible(false);
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn("flex min-h-dvh flex-col bg-background", className)}
    >
      {children}

      <AnimatePresence>
        {promptVisible ? (
          <motion.div
            className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-md overflow-hidden rounded-2xl border border-primary/35 bg-gradient-to-b from-primary/20 via-card to-card p-5 shadow-[0_0_48px_rgba(236,72,153,0.35)]"
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
            >
              <div className="mb-4 flex justify-center">
                <motion.div
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ duration: 1.6, repeat: Infinity }}
                  className="flex size-14 items-center justify-center rounded-full bg-primary/20 ring-2 ring-primary/50"
                >
                  <Maximize className="size-7 text-primary" />
                </motion.div>
              </div>
              <h2 className="text-center font-display text-xl font-bold">
                Schermo intero
              </h2>
              <p className="mt-2 text-center text-sm text-muted-foreground">
                Per un&apos;esperienza immersiva in sala, espandi il gioco a
                tutto schermo.
              </p>
              <div className="mt-5 flex flex-col gap-2">
                <Button
                  type="button"
                  size="lg"
                  className="w-full shadow-[0_0_24px_rgba(236,72,153,0.45)]"
                  onClick={() => void handleEnter()}
                >
                  <Maximize className="size-4" />
                  Vai a schermo intero
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full text-muted-foreground"
                  onClick={handleDismiss}
                >
                  Continua così
                </Button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
