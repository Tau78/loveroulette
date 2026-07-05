import { describe, expect, it } from "vitest";
import {
  getParticipantFragmentView,
  getFragmentExchangeState,
  listDonationTargets,
} from "./fragment-exchange";
import type { FragmentExchangeState } from "./fragment-exchange";

const baseState: FragmentExchangeState = {
  fragmentIds: ["q1", "q2", "q3"],
  finalCode: "AMORE26",
  collected: {
    donor: ["q1", "q2", "q3", "q2"],
    incomplete: ["q1", "q3"],
    complete: ["q1", "q2", "q3"],
  },
  updatedAt: "2026-07-05T12:00:00.000Z",
};

describe("getFragmentExchangeState", () => {
  it("parses metadata payload", () => {
    const state = getFragmentExchangeState({
      love_roulette_fragments: {
        fragmentIds: ["a", "b"],
        finalCode: "XYZ",
        collected: { p1: ["a"] },
        updatedAt: "t",
      },
    });

    expect(state).toEqual({
      fragmentIds: ["a", "b"],
      finalCode: "XYZ",
      collected: { p1: ["a"] },
      updatedAt: "t",
    });
  });
});

describe("getParticipantFragmentView", () => {
  it("reveals final code when complete", () => {
    const view = getParticipantFragmentView(baseState, "complete", true);
    expect(view.isComplete).toBe(true);
    expect(view.finalCode).toBe("AMORE26");
    expect(view.canDonate).toBe(false);
  });

  it("allows donation when donor has duplicate fragment", () => {
    const view = getParticipantFragmentView(baseState, "donor", true);
    expect(view.canDonate).toBe(true);
    expect(view.donateableFragmentIds).toEqual(["q2"]);
    expect(view.finalCode).toBe("AMORE26");
  });
});

describe("listDonationTargets", () => {
  it("lists only incomplete players missing donateable fragments", () => {
    const targets = listDonationTargets(
      baseState,
      [
        { id: "donor", nickname: "Donor" },
        { id: "incomplete", nickname: "Neo" },
        { id: "complete", nickname: "Full" },
      ],
      "donor",
    );

    expect(targets).toHaveLength(1);
    expect(targets[0]?.id).toBe("incomplete");
    expect(targets[0]?.missingFragmentIds).toEqual(["q2"]);
  });
});
