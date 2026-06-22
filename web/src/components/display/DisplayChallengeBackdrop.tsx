"use client";

import Image from "next/image";
import type { ChallengeId } from "@/lib/types";
import type { FinalsShowPhase } from "@/lib/musicpro/finals-show";
import { DECLARATION_BOUQUET_SRC } from "@/lib/display/challenge-regia";
import { cn } from "@/lib/utils";

interface DisplayChallengeBackdropProps {
  challengeId: ChallengeId | null;
  phase: FinalsShowPhase | null;
}

const BACKDROP_PHASES: ReadonlySet<FinalsShowPhase> = new Set([
  "challenge_intro",
  "couple_reveal",
  "voting",
]);

export function DisplayChallengeBackdrop({
  challengeId,
  phase,
}: DisplayChallengeBackdropProps) {
  if (!challengeId || !phase || !BACKDROP_PHASES.has(phase)) {
    return null;
  }

  if (challengeId === "declaration") {
    return (
      <div
        className="pointer-events-none absolute inset-0 z-[18] overflow-hidden"
        aria-hidden
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a0510]/90 via-[#120208]/75 to-black/90" />
        <Image
          src={DECLARATION_BOUQUET_SRC}
          alt=""
          fill
          priority
          className="object-cover opacity-95"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/45" />
      </div>
    );
  }

  if (challengeId === "kiss") {
    return (
      <div
        className={cn(
          "pointer-events-none absolute inset-0 z-[18]",
          "bg-gradient-to-b from-rose-950/80 via-black/60 to-black/85",
        )}
        aria-hidden
      />
    );
  }

  if (challengeId === "kamasutra") {
    return (
      <div
        className={cn(
          "pointer-events-none absolute inset-0 z-[18]",
          "bg-gradient-to-b from-fuchsia-950/70 via-black/65 to-black/90",
        )}
        aria-hidden
      />
    );
  }

  if (challengeId === "dance") {
    return (
      <div
        className={cn(
          "pointer-events-none absolute inset-0 z-[18]",
          "bg-gradient-to-b from-primary/15 via-black/50 to-black/80",
        )}
        aria-hidden
      />
    );
  }

  return null;
}
