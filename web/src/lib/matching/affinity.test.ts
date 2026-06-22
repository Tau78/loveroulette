import { describe, expect, it } from "vitest";
import {
  calculateSimpleAffinity,
  collectLockedParticipantIds,
  filterPairsAvailableForExtraction,
  filterValidMaleFemalePairs,
  getBottomNonFinalistPairs,
  isValidMaleFemalePair,
  maxAllowedExtractions,
  rankPairs,
  selectNextPair,
} from "./affinity";

describe("calculateSimpleAffinity", () => {
  it("returns 100 when all answers match", () => {
    const answers = { q1: "a", q2: "b" };
    const score = calculateSimpleAffinity(answers, answers, [
      { id: "q1", weight: 1 },
      { id: "q2", weight: 1 },
    ]);
    expect(score).toBe(100);
  });

  it("returns 0 when no answers match", () => {
    const score = calculateSimpleAffinity(
      { q1: "a" },
      { q1: "b" },
      [{ id: "q1", weight: 1 }],
    );
    expect(score).toBe(0);
  });

  it("returns 50 for half match", () => {
    const score = calculateSimpleAffinity(
      { q1: "a", q2: "b" },
      { q1: "a", q2: "c" },
      [
        { id: "q1", weight: 1 },
        { id: "q2", weight: 1 },
      ],
    );
    expect(score).toBe(50);
  });
});

describe("selectNextPair", () => {
  const pairs = [
    {
      id: "1",
      rank: 1,
      was_shown: false,
      is_eliminated: false,
      participant_male_id: "m1",
      participant_female_id: "f1",
    },
    {
      id: "2",
      rank: 2,
      was_shown: false,
      is_eliminated: false,
      participant_male_id: "m1",
      participant_female_id: "f2",
    },
    {
      id: "3",
      rank: 3,
      was_shown: true,
      is_eliminated: false,
      participant_male_id: "m2",
      participant_female_id: "f1",
    },
  ];

  it("ranked picks lowest rank not shown", () => {
    const next = selectNextPair(pairs, "ranked", 3, 0);
    expect(next?.id).toBe("2");
  });

  it("returns null when none available", () => {
    const allShown = pairs.map((p) => ({ ...p, was_shown: true }));
    expect(selectNextPair(allShown, "random", 3, 0)).toBeNull();
  });

  it("locks players already in a shown pair", () => {
    const locked = pairs.map((p) =>
      p.id === "3"
        ? p
        : {
            ...p,
            participant_male_id: "m2",
            participant_female_id: "f3",
          },
    );
    expect(filterPairsAvailableForExtraction(locked)).toHaveLength(0);
    expect(collectLockedParticipantIds(locked)).toEqual(new Set(["m2", "f1"]));
  });

  it("never selects a pair when either player is already locked", () => {
    const withOverlap = [
      {
        id: "a",
        rank: 1,
        was_shown: true,
        is_eliminated: false,
        participant_male_id: "m1",
        participant_female_id: "f1",
      },
      {
        id: "b",
        rank: 2,
        was_shown: false,
        is_eliminated: false,
        participant_male_id: "m1",
        participant_female_id: "f2",
      },
    ];

    expect(selectNextPair(withOverlap, "random", 3, 1)).toBeNull();
  });
});

describe("isValidMaleFemalePair", () => {
  const genderById = new Map([
    ["m1", "male"],
    ["f1", "female"],
    ["f2", "female"],
  ] as const);

  it("accepts 1 male + 1 female", () => {
    expect(isValidMaleFemalePair("m1", "f1", genderById)).toBe(true);
  });

  it("rejects same id or wrong genders", () => {
    expect(isValidMaleFemalePair("m1", "m1", genderById)).toBe(false);
    expect(isValidMaleFemalePair("f1", "f2", genderById)).toBe(false);
    expect(isValidMaleFemalePair("f1", "m1", genderById)).toBe(false);
  });
});

describe("filterValidMaleFemalePairs", () => {
  it("drops rows with invalid gender composition", () => {
    const genderById = new Map([
      ["m1", "male"],
      ["f1", "female"],
      ["x1", "female"],
    ] as const);

    const pairs = [
      {
        id: "ok",
        participant_male_id: "m1",
        participant_female_id: "f1",
      },
      {
        id: "bad",
        participant_male_id: "x1",
        participant_female_id: "f1",
      },
    ];

    expect(filterValidMaleFemalePairs(pairs, genderById).map((p) => p.id)).toEqual(
      ["ok"],
    );
  });
});

describe("maxAllowedExtractions", () => {
  it("caps by min males and females", () => {
    expect(maxAllowedExtractions(5, 3, null)).toBe(3);
    expect(maxAllowedExtractions(2, 8, null)).toBe(2);
  });

  it("respects extraction_count config", () => {
    expect(maxAllowedExtractions(10, 10, 4)).toBe(4);
    expect(maxAllowedExtractions(2, 10, 4)).toBe(2);
  });
});

describe("getBottomNonFinalistPairs", () => {
  it("eliminates bottom pairs keeping top 3", () => {
    const pairs = [1, 2, 3, 4, 5].map((rank) => ({
      id: String(rank),
      rank,
      was_shown: false,
      is_eliminated: false,
      participant_male_id: `m${rank}`,
      participant_female_id: `f${rank}`,
    }));
    const toElim = getBottomNonFinalistPairs(pairs, 3);
    expect(toElim).toHaveLength(2);
    expect(toElim.map((p) => p.rank)).toEqual([5, 4]);
  });
});

describe("rankPairs", () => {
  it("sorts by score descending", () => {
    const ranked = rankPairs([
      { maleId: "a", femaleId: "b", score: 50 },
      { maleId: "c", femaleId: "d", score: 90 },
    ]);
    expect(ranked[0].score).toBe(90);
  });
});
