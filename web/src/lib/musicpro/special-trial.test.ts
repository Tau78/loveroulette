import { describe, expect, it } from "vitest";
import {
  formatSpecialTrialClock,
  getSpecialTrialState,
  isSpecialTrialBlockingQuiz,
  isSpecialTrialRunningExpired,
  mergeSpecialTrialState,
  specialTrialRemainingSeconds,
  specialTrialVoteRanking,
} from "./special-trial";

describe("special-trial state", () => {
  it("normalizes booked trial from metadata", () => {
    const trial = getSpecialTrialState({
      love_roulette_special_trial: {
        status: "booked",
        updatedAt: "2026-01-01T00:00:00.000Z",
        durationSec: 60,
        challengeId: null,
        mode: null,
        participants: [],
        phaseStartedAt: null,
      },
    });
    expect(trial?.status).toBe("booked");
    expect(trial?.votes).toEqual({});
  });

  it("blocks quiz during setup/running/closing/results", () => {
    expect(isSpecialTrialBlockingQuiz({ status: "booked" } as never)).toBe(
      false,
    );
    expect(isSpecialTrialBlockingQuiz({ status: "setup" } as never)).toBe(true);
    expect(isSpecialTrialBlockingQuiz({ status: "running" } as never)).toBe(
      true,
    );
    expect(isSpecialTrialBlockingQuiz({ status: "results" } as never)).toBe(
      true,
    );
  });

  it("merge prefers newer updatedAt", () => {
    const prev = {
      status: "booked" as const,
      updatedAt: "2026-01-01T00:00:00.000Z",
      durationSec: 60,
      challengeId: null,
      mode: null,
      participants: [],
      phaseStartedAt: null,
      votes: {},
      ballots: {},
    };
    const incoming = {
      ...prev,
      status: "setup" as const,
      updatedAt: "2026-01-02T00:00:00.000Z",
    };
    expect(mergeSpecialTrialState(prev, incoming)?.status).toBe("setup");
  });

  it("running timer expires", () => {
    const started = new Date(Date.now() - 61_000).toISOString();
    const trial = {
      status: "running" as const,
      updatedAt: started,
      durationSec: 60,
      challengeId: "dance" as const,
      mode: "scegli" as const,
      participants: [],
      phaseStartedAt: started,
      votes: {},
      ballots: {},
    };
    expect(specialTrialRemainingSeconds(trial)).toBe(0);
    expect(isSpecialTrialRunningExpired(trial)).toBe(true);
  });

  it("formats countdown from minutes", () => {
    expect(formatSpecialTrialClock(300)).toBe("5:00");
    expect(formatSpecialTrialClock(65)).toBe("1:05");
    expect(formatSpecialTrialClock(9)).toBe("0:09");
    expect(formatSpecialTrialClock(0)).toBe("0:00");
  });

  it("ranks vote results", () => {
    const ranking = specialTrialVoteRanking({
      status: "results",
      updatedAt: "2026-01-01T00:00:00.000Z",
      durationSec: 120,
      challengeId: "dance",
      mode: "scegli",
      participants: [
        { id: "a", nickname: "Ada" },
        { id: "b", nickname: "Bea" },
      ],
      phaseStartedAt: null,
      votes: { a: 3, b: 7 },
      ballots: {},
    });
    expect(ranking[0].nickname).toBe("Bea");
    expect(ranking[0].votes).toBe(7);
  });
});
