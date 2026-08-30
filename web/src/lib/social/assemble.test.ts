import { describe, expect, it } from "vitest";
import {
  buildFinalsVotePayload,
  buildQuizShockPayload,
  buildTopShipPayload,
  buildWinnerNightPayload,
} from "./assemble";
import type { FinalsShowState } from "@/lib/musicpro/finals-show";
import type { VotingSessionState } from "@/lib/musicpro/voting";

describe("assemble social payloads", () => {
  it("builds quiz shock from polarizing results", () => {
    const payload = buildQuizShockPayload({
      venueName: "Club",
      questionBodies: { q1: "Domanda shock?" },
      results: [
        {
          questionId: "q1",
          totalAnswers: 40,
          options: [
            {
              optionId: "a",
              label: "A",
              sortOrder: 0,
              count: 12,
              percent: 30,
            },
            {
              optionId: "b",
              label: "B",
              sortOrder: 1,
              count: 11,
              percent: 28,
            },
            {
              optionId: "c",
              label: "C",
              sortOrder: 2,
              count: 9,
              percent: 22,
            },
            {
              optionId: "d",
              label: "D",
              sortOrder: 3,
              count: 8,
              percent: 20,
            },
          ],
        },
      ],
    });
    expect(payload?.questionBody).toBe("Domanda shock?");
    expect(payload?.options).toHaveLength(4);
  });

  it("slices top ship to shipTopN", () => {
    const payload = buildTopShipPayload({
      venueName: "X",
      shipTopN: 2,
      couples: [
        {
          rank: 1,
          maleNickname: "A",
          femaleNickname: "B",
          score: 90,
        },
        {
          rank: 2,
          maleNickname: "C",
          femaleNickname: "D",
          score: 80,
        },
        {
          rank: 3,
          maleNickname: "E",
          femaleNickname: "F",
          score: 70,
        },
      ],
    });
    expect(payload?.couples).toHaveLength(2);
  });

  it("maps finals vote bars", () => {
    const voting: VotingSessionState = {
      status: "open",
      challengeId: "dance",
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      finalists: [
        {
          pairId: "p1",
          maleNick: "M",
          femaleNick: "F",
          rank: 1,
        },
        {
          pairId: "p2",
          maleNick: "X",
          femaleNick: "Y",
          rank: 2,
        },
      ],
      counts: { p1: 10, p2: 5 },
      ballots: {},
    };
    const payload = buildFinalsVotePayload({ voting, venueName: "V" });
    expect(payload?.couples[0]?.barPct).toBe(100);
    expect(payload?.couples[1]?.barPct).toBe(50);
    expect(payload?.challengeLabel).toContain("bailar");
  });

  it("builds winner from podium scores", () => {
    const finalsShow: FinalsShowState = {
      phase: "winner_podium",
      phaseStartedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      challengeId: null,
      coupleIndex: 0,
      cumulativeScores: { p1: 3, p2: 1 },
      completedChallenges: ["dance"],
      tieDetected: false,
      finalists: [
        {
          pairId: "p1",
          maleNick: "Marco",
          femaleNick: "Giulia",
          rank: 1,
        },
        {
          pairId: "p2",
          maleNick: "Luca",
          femaleNick: "Sara",
          rank: 2,
        },
      ],
    };
    const payload = buildWinnerNightPayload({
      finalsShow,
      winnerPairId: null,
      premio: { kicker: "Stasera", headline: "IL PREMIO", sub: "Vacanza" },
      venueName: "Bar",
      eventCode: "DEMO",
    });
    expect(payload?.coupleLabel).toBe("Marco & Giulia");
    expect(payload?.prizeSub).toBe("Vacanza");
  });
});
