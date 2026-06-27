import { describe, expect, it } from "vitest";
import {
  finalsNeedsServerCatchUp,
  mergeFinalsShow,
  mergeLastReveal,
  mergeVotingMetadata,
  quizNeedsServerCatchUp,
} from "./session-sync";
import type { FinalsShowState } from "./finals-show";
import type { QuizSessionState } from "./quiz-state";

const baseQuiz = (): QuizSessionState => ({
  currentIndex: 0,
  total: 3,
  questionIds: ["q1", "q2", "q3"],
  source: "event",
  displayPhase: "answers",
  phaseStartedAt: new Date(Date.now() - 20_000).toISOString(),
  updatedAt: "2026-06-20T10:00:00.000Z",
  timing: {
    startCountdownSeconds: 5,
    themeIntroSeconds: 4,
    questionStemSeconds: 4,
    questionSeconds: 15,
    resultsSeconds: 6,
    nextQuestionSeconds: 3,
  },
  autoplayEnabled: true,
  autoplaySeconds: 15,
});

describe("session-sync", () => {
  it("detects expired quiz phase for catch-up", () => {
    expect(quizNeedsServerCatchUp(baseQuiz())).toBe(true);
  });

  it("keeps newer finals show on merge", () => {
    const older: FinalsShowState = {
      phase: "voting",
      phaseStartedAt: "2026-06-20T10:00:00.000Z",
      updatedAt: "2026-06-20T10:00:00.000Z",
      challengeId: "dance",
      coupleIndex: 1,
      cumulativeScores: {},
      completedChallenges: [],
      tieDetected: false,
      finalists: [],
    };
    const newer = {
      ...older,
      phase: "results" as const,
      updatedAt: "2026-06-20T10:00:10.000Z",
    };

    expect(mergeFinalsShow(older, newer)?.phase).toBe("results");
    expect(mergeFinalsShow(newer, older)?.phase).toBe("results");
  });

  it("keeps newer last reveal on merge", () => {
    const a = {
      maleNick: "A",
      femaleNick: "B",
      maleId: "1",
      femaleId: "2",
      pairId: "p1",
      affinityScore: 80,
      updatedAt: "2026-06-20T10:00:00.000Z",
    };
    const b = { ...a, updatedAt: "2026-06-20T10:00:05.000Z", maleNick: "C" };

    expect(mergeLastReveal(a, b)?.maleNick).toBe("C");
    expect(mergeLastReveal(b, a)?.maleNick).toBe("C");
  });

  it("keeps newer voting session on merge", () => {
    const prev = {
      current: {
        status: "open" as const,
        challengeId: "dance" as const,
        startedAt: "2026-06-20T10:00:00.000Z",
        updatedAt: "2026-06-20T10:00:10.000Z",
        finalists: [],
        counts: {},
        ballots: {},
      },
      completed: {},
    };
    const incoming = {
      current: {
        ...prev.current!,
        updatedAt: "2026-06-20T10:00:00.000Z",
        status: "closed" as const,
      },
      completed: {},
    };

    expect(mergeVotingMetadata(prev, incoming).current?.status).toBe("open");
  });

  it("detects finals catch-up when phase expired", () => {
    const show: FinalsShowState = {
      phase: "voting",
      phaseStartedAt: new Date(Date.now() - 25_000).toISOString(),
      updatedAt: "2026-06-20T10:00:00.000Z",
      challengeId: "dance",
      coupleIndex: 1,
      cumulativeScores: {},
      completedChallenges: [],
      tieDetected: false,
      finalists: [],
    };

    expect(finalsNeedsServerCatchUp(show)).toBe(true);
  });
});
