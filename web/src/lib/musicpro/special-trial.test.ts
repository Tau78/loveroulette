import { describe, expect, it } from "vitest";
import {
  getSpecialTrialState,
  isSpecialTrialBlockingQuiz,
  isSpecialTrialRunningExpired,
  mergeSpecialTrialState,
  specialTrialRemainingSeconds,
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
  });

  it("blocks quiz during setup/running/closing", () => {
    expect(isSpecialTrialBlockingQuiz({ status: "booked" } as never)).toBe(
      false,
    );
    expect(isSpecialTrialBlockingQuiz({ status: "setup" } as never)).toBe(true);
    expect(isSpecialTrialBlockingQuiz({ status: "running" } as never)).toBe(
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
    };
    const incoming = { ...prev, status: "setup" as const, updatedAt: "2026-01-02T00:00:00.000Z" };
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
    };
    expect(specialTrialRemainingSeconds(trial)).toBe(0);
    expect(isSpecialTrialRunningExpired(trial)).toBe(true);
  });
});
