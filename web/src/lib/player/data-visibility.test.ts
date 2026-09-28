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
  const photoUrl = `data:image/jpeg;base64,${"a".repeat(32)}`;
  const profile = {
    firstName: "Alex",
    lastName: "Riva",
    phone: "3331234567",
    email: "alex@example.com",
    photoUrl,
    publicNameMode: "nick" as const,
    seeking: "female" as const,
    ageBand: "18_29" as const,
  };

  it("defaults dataVisibility to matched", () => {
    const parsed = joinParticipantBodySchema.parse({
      ...profile,
      gender: "male",
    });
    expect(parsed.dataVisibility).toBe(DEFAULT_PARTICIPANT_DATA_VISIBILITY);
  });

  it("accepts explicit visibility choices", () => {
    for (const dataVisibility of participantDataVisibilitySchema.options) {
      const parsed = joinParticipantBodySchema.parse({
        ...profile,
        gender: "female",
        dataVisibility,
      });
      expect(parsed.dataVisibility).toBe(dataVisibility);
    }
  });

  it("rejects invalid visibility values", () => {
    const parsed = joinParticipantBodySchema.safeParse({
      ...profile,
      gender: "male",
      dataVisibility: "friends",
    });
    expect(parsed.success).toBe(false);
  });

  it("rifiuta l'ingresso senza cerco", () => {
    const parsed = joinParticipantBodySchema.safeParse({
      ...profile,
      gender: "male",
      seeking: undefined,
    });
    expect(parsed.success).toBe(false);
  });
});
