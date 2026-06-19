"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import type { PlayerEventInfo } from "@/hooks/usePlayerEventInfo";
import { formatPlayerEventDateTime } from "@/lib/player/format-event-datetime";
import { cn } from "@/lib/utils";

const LOGO_SRC = "/grafiche/logo-transparent.png";

interface PlayerMobileHeaderProps {
  event: PlayerEventInfo | null;
  loading?: boolean;
  /** Dopo il saluto iniziale — nickname fisso in header. */
  nickname?: string | null;
  className?: string;
}

export function PlayerMobileHeader({
  event,
  loading = false,
  nickname = null,
  className,
}: PlayerMobileHeaderProps) {
  const nickLabel = nickname?.trim() || null;
  const venueLabel = event?.venueName ?? event?.title ?? null;
  const dateTime =
    event?.eventDate != null
      ? formatPlayerEventDateTime(event.eventDate, event.eventTime)
      : null;

  return (
    <header
      className={cn(
        "relative shrink-0 overflow-hidden border-b border-primary/20 bg-gradient-to-b from-primary/10 via-background/80 to-background/40 px-4 pb-4 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-md",
        className,
      )}
    >
      <motion.div
        className="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full bg-primary/25 blur-3xl"
        animate={{ opacity: [0.35, 0.7, 0.35], scale: [0.9, 1.1, 0.9] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        aria-hidden
      />
      <motion.div
        className="pointer-events-none absolute -left-6 bottom-0 size-24 rounded-full bg-fuchsia-500/15 blur-2xl"
        animate={{ opacity: [0.2, 0.5, 0.2] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        aria-hidden
      />

      <div className="relative flex items-start gap-3">
        <motion.div
          className="relative shrink-0"
          animate={{ filter: ["drop-shadow(0 0 8px rgba(236,72,153,0.4))", "drop-shadow(0 0 18px rgba(236,72,153,0.75))", "drop-shadow(0 0 8px rgba(236,72,153,0.4))"] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
        >
          <Image
            src={LOGO_SRC}
            alt=""
            width={180}
            height={78}
            priority
            className="h-[4.125rem] w-auto object-contain"
          />
        </motion.div>

        <div className="min-w-0 flex-1 pt-0.5 text-left">
          {nickLabel ? (
            <p className="truncate font-display text-xl font-bold uppercase leading-tight text-foreground">
              {nickLabel}
            </p>
          ) : null}
          {loading ? (
            <div className="mt-1.5 h-4 w-32 animate-pulse rounded bg-muted/40" />
          ) : venueLabel ? (
            <p className="mt-0.5 truncate font-display text-lg font-bold leading-tight text-foreground">
              {venueLabel}
            </p>
          ) : null}
          {loading ? (
            <div className="mt-1 h-3 w-40 animate-pulse rounded bg-muted/30" />
          ) : dateTime ? (
            <p className="mt-0.5 text-[11px] capitalize leading-snug text-muted-foreground">
              {dateTime}
            </p>
          ) : null}
        </div>
      </div>
    </header>
  );
}
