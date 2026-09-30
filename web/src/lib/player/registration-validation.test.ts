import { describe, expect, it } from "vitest";
import { invalidRegistrationContactFields } from "./registration-validation";

describe("invalidRegistrationContactFields", () => {
  const valid = {
    firstName: "Tau",
    lastName: "Rossi",
    phone: "3331234567",
    email: "tau@example.com",
  };

  it.each([
    ["firstName", { firstName: "" }],
    ["lastName", { lastName: " " }],
    ["phone", { phone: "123" }],
    ["email", { email: "tau@" }],
  ] as const)("reports only the invalid %s field", (field, patch) => {
    expect(invalidRegistrationContactFields({ ...valid, ...patch })).toEqual([
      field,
    ]);
  });

  it("reports every invalid field together", () => {
    expect(
      invalidRegistrationContactFields({
        firstName: "",
        lastName: "",
        phone: "",
        email: "",
      }),
    ).toEqual(["firstName", "lastName", "phone", "email"]);
  });
});
