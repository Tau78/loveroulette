import { describe, expect, it } from "vitest";
import {
  DATA_VISIBILITY_OPTIONS,
  DEFAULT_PARTICIPANT_DATA_VISIBILITY,
  dataVisibilityLabel,
  normalizeParticipantDataVisibility,
  participantDataVisibilitySchema,
} from "@/lib/player/data-visibility";
import { joinParticipantBodySchema } from "@/lib/player/join-body-schema";

describe("normalizeParticipantDataVisibility", () => {
  it("returns matched for invalid or missing values", () => {
    expect(normalizeParticipantDataVisibility(undefined)).toBe("matched");
    expect(normalizeParticipantDataVisibility("invalid")).toBe("matched");
    expect(normalizeParticipantDataVisibility(null)).toBe("matched");
  });

  it("preserves valid values", () => {
    expect(normalizeParticipantDataVisibility("everyone")).toBe("everyone");
    expect(normalizeParticipantDataVisibility("matched")).toBe("matched");
    expect(normalizeParticipantDataVisibility("none")).toBe("none");
  });
});

describe("dataVisibilityLabel", () => {
  it("maps values to Italian labels", () => {
    expect(dataVisibilityLabel("everyone")).toBe("Tutti");
    expect(dataVisibilityLabel("matched")).toBe("Solo match");
    expect(dataVisibilityLabel("none")).toBe("Nessuno");
  });
});

describe("DATA_VISIBILITY_OPTIONS", () => {
  it("lists all three choices", () => {
    expect(DATA_VISIBILITY_OPTIONS.map((option) => option.value)).toEqual([
      "everyone",
      "matched",
      "none",
    ]);
  });
});

describe("joinParticipantBodySchema", () => {
  it("defaults dataVisibility to matched", () => {
    const parsed = joinParticipantBodySchema.parse({
      nickname: "Alex",
      gender: "male",
    });
    expect(parsed.dataVisibility).toBe(DEFAULT_PARTICIPANT_DATA_VISIBILITY);
  });

  it("accepts explicit visibility choices", () => {
    for (const dataVisibility of participantDataVisibilitySchema.options) {
      const parsed = joinParticipantBodySchema.parse({
        nickname: "Alex",
        gender: "female",
        dataVisibility,
      });
      expect(parsed.dataVisibility).toBe(dataVisibility);
    }
  });

  it("rejects invalid visibility values", () => {
    const parsed = joinParticipantBodySchema.safeParse({
      nickname: "Alex",
      gender: "male",
      dataVisibility: "friends",
    });
    expect(parsed.success).toBe(false);
  });
});
