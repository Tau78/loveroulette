"use client";

import type { ChallengePresentation } from "@/lib/game/finals-challenges";
import { FINALS_COPY } from "@/lib/game/late-game-copy";
import type { FinalsShowState } from "@/lib/musicpro/finals-show";
import type { VotingSessionState } from "@/lib/musicpro/voting";
import {
  DisplayFinalsCoupleCard,
  FINALS_CARD_ACCENTS,
} from "@/components/display/DisplayFinalsCoupleCard";
import {
  DisplayFinalsHeaderBand,
  DisplayFinalsZoneLayout,
} from "@/components/display/DisplayFinalsZoneLayout";

interface DisplayFinalsResultsStageProps {
  show: FinalsShowState;
  session: VotingSessionState;
  presentation: ChallengePresentation | null;
}

export function DisplayFinalsResultsStage({
  show,
  session,
  presentation,
}: DisplayFinalsResultsStageProps) {
  const maxCount = Math.max(
    1,
    ...show.finalists.map((f) => session.counts[f.pairId] ?? 0),
  );
  const topCount = maxCount;

  return (
    <DisplayFinalsZoneLayout
      header={
        <DisplayFinalsHeaderBand
          kicker={FINALS_COPY.displayChallengePrefix}
          title={presentation?.displayTitle ?? "Risultati prova"}
          subtitle={FINALS_COPY.displayVoteClosed}
        />
      }
    >
      <div className="grid h-full min-h-0 w-full max-w-[1680px] mx-auto grid-cols-3 gap-5 md:gap-6">
        {show.finalists.slice(0, 3).map((finalist, index) => {
          const count = session.counts[finalist.pairId] ?? 0;
          const barPct = (count / maxCount) * 100;
          const isLeader = count === topCount && count > 0;

          return (
            <DisplayFinalsCoupleCard
              key={finalist.pairId}
              index={index}
              maleNick={finalist.maleNick}
              femaleNick={finalist.femaleNick}
              votes={count}
              votesLabel="voti"
              barPct={barPct}
              accentClass={FINALS_CARD_ACCENTS[index % FINALS_CARD_ACCENTS.length]}
              isLeader={isLeader}
              barAnimateInitial
            />
          );
        })}
      </div>
    </DisplayFinalsZoneLayout>
  );
}
