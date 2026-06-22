"use client";

import type { ChallengeId } from "@/lib/types";
import type { FinalsShowState } from "@/lib/musicpro/finals-show";
import { coupleLabel } from "@/lib/musicpro/finals-show";
import {
  CHALLENGE_PRESENTATIONS,
  FINALS_INTRO,
} from "@/lib/game/finals-challenges";
import { FINALS_COPY } from "@/lib/game/late-game-copy";
import { DisplayChallengeIntroStage } from "@/components/display/DisplayChallengeIntroStage";
import { DisplayCoupleCallout } from "@/components/display/DisplayCoupleCallout";
import { DisplayFinalsResultsStage } from "@/components/display/DisplayFinalsResultsStage";
import { DisplayFinalsVotePrepStage } from "@/components/display/DisplayFinalsVotePrepStage";
import { DisplayFinalsVotingStage } from "@/components/display/DisplayFinalsVotingStage";
import { DisplayPhaseHero } from "@/components/display/DisplayShowText";
import type { VotingSessionState } from "@/lib/musicpro/voting";
import { DisplayWinnerSpectacle } from "@/components/display/DisplayWinnerSpectacle";

interface DisplayFinalsShowStageProps {
  show: FinalsShowState;
  session: VotingSessionState | null;
  remaining: number;
  runtimeState: "finals" | "winner";
}

export function DisplayFinalsShowStage({
  show,
  session,
  remaining,
  runtimeState,
}: DisplayFinalsShowStageProps) {
  if (show.phase === "winner_spectacle" || show.phase === "winner_podium") {
    return (
      <DisplayWinnerSpectacle
        show={show}
        runtimeState={runtimeState}
        phase={show.phase}
      />
    );
  }

  if (show.phase === "tie_blocked") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 pb-20">
        <DisplayPhaseHero
          kicker="Parimerito"
          headline="Decisione sospesa"
          subline="Ripetete una prova per sbloccare il vincitore — l'animatore sceglie quale."
          uppercase
          pulse
        />
      </div>
    );
  }

  if (show.phase === "intro") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 pb-20">
        <DisplayPhaseHero
          kicker={FINALS_INTRO.kicker}
          headline={FINALS_INTRO.headline}
          subline={FINALS_INTRO.subline}
          uppercase
        />
      </div>
    );
  }

  if (show.phase === "idle") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 pb-20 gap-6">
        <DisplayPhaseHero
          kicker={FINALS_COPY.displayKicker}
          headline={FINALS_COPY.displayHeadline}
          subline="In attesa della prossima prova…"
          uppercase
        />
        {show.finalists.length > 0 ? (
          <div className="flex flex-wrap justify-center gap-3 max-w-3xl">
            {show.finalists.map((f, i) => (
              <span
                key={f.pairId}
                className="rounded-full border border-white/20 bg-black/40 px-4 py-2 text-sm font-semibold text-white/90"
              >
                #{i + 1} {coupleLabel(f)}
                <span className="ml-2 text-primary tabular-nums">
                  {show.cumulativeScores[f.pairId] ?? 0} pt
                </span>
              </span>
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  const challengeId = show.challengeId as ChallengeId | null;
  const presentation = challengeId
    ? CHALLENGE_PRESENTATIONS[challengeId]
    : null;

  if (show.phase === "challenge_intro" && presentation) {
    return <DisplayChallengeIntroStage presentation={presentation} />;
  }

  if (show.phase === "couple_reveal" && presentation) {
    const finalist = show.finalists[show.coupleIndex - 1];
    if (!finalist) return null;
    return (
      <div className="relative z-40 flex min-h-0 flex-1 flex-col items-center justify-center px-6 py-4">
        <DisplayCoupleCallout
          kicker={presentation.displayTitle.toUpperCase()}
          maleNick={finalist.maleNick}
          femaleNick={finalist.femaleNick}
          actionLabel={presentation.coupleAction.toUpperCase()}
          footerLabel={`Finalista ${show.coupleIndex} di ${show.finalists.length}`}
        />
      </div>
    );
  }

  if (show.phase === "voting_prep") {
    return <DisplayFinalsVotePrepStage remaining={remaining} />;
  }

  if (show.phase === "voting" && session) {
    return (
      <DisplayFinalsVotingStage
        session={session}
        remaining={remaining}
        challengeLabel={
          presentation
            ? `${FINALS_COPY.displayChallengePrefix}: ${presentation.title}`
            : undefined
        }
      />
    );
  }

  if (show.phase === "results" && session) {
    return (
      <DisplayFinalsResultsStage
        show={show}
        session={session}
        presentation={presentation}
      />
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center">
      <p className="text-white/60">{FINALS_COPY.displayWaitingSubline}</p>
    </div>
  );
}
