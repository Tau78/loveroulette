import { describe, expect, it } from "vitest";
import { shouldEarlyCloseAnswers } from "./quiz-all-answered";

describe("shouldEarlyCloseAnswers", () => {
  it("keeps countdown when nobody is online", () => {
    expect(
      shouldEarlyCloseAnswers({
        onlinePlayerIds: [],
        answeredParticipantIds: ["a"],
      }),
    ).toBe(false);
  });

  it("keeps countdown when some online players are missing", () => {
    expect(
      shouldEarlyCloseAnswers({
        onlinePlayerIds: ["a", "b", "c"],
        answeredParticipantIds: ["a", "b"],
      }),
    ).toBe(false);
  });

  it("closes when every online player answered", () => {
    expect(
      shouldEarlyCloseAnswers({
        onlinePlayerIds: ["a", "b"],
        answeredParticipantIds: ["a", "b", "offline-extra"],
      }),
    ).toBe(true);
  });

  it("closes with a single online player who answered", () => {
    expect(
      shouldEarlyCloseAnswers({
        onlinePlayerIds: ["solo"],
        answeredParticipantIds: ["solo"],
      }),
    ).toBe(true);
  });
});
