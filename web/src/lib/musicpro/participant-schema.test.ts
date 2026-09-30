import { describe, expect, it } from "vitest";
import {
  isDataVisibilitySchemaError,
  missingOptionalParticipantColumn,
} from "./participant-schema";

describe("isDataVisibilitySchemaError", () => {
  it("detects schema cache message from PostgREST", () => {
    expect(
      isDataVisibilitySchemaError({
        message:
          "Could not find the 'data_visibility' column of 'love_roulette_participants' in the schema cache",
      }),
    ).toBe(true);
  });

  it("detects does not exist", () => {
    expect(
      isDataVisibilitySchemaError({
        message: 'column "data_visibility" does not exist',
      }),
    ).toBe(true);
  });

  it("detects PGRST204 code with column hint", () => {
    expect(
      isDataVisibilitySchemaError({
        code: "PGRST204",
        message: "Could not find the 'data_visibility' column",
      }),
    ).toBe(true);
  });

  it("ignores unrelated errors", () => {
    expect(
      isDataVisibilitySchemaError({ message: "duplicate key nickname" }),
    ).toBe(false);
  });
});

describe("missingOptionalParticipantColumn", () => {
  it("detects missing email in schema cache", () => {
    expect(
      missingOptionalParticipantColumn(
        {
          message:
            "Could not find the 'email' column of 'love_roulette_participants' in the schema cache",
        },
        { email: "a@b.c", nickname: "Tau" },
      ),
    ).toBe("email");
  });
});
