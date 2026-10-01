import { describe, expect, it } from "vitest";
import { mergeRuntimeStateFromPoll } from "./event-state-order";

describe("mergeRuntimeStateFromPoll", () => {
  it("keeps optimistic extraction when stale poll returns matching", () => {
    expect(
      mergeRuntimeStateFromPoll("extraction", "matching", Date.now() - 200),
    ).toBe("extraction");
  });

  it("accepts forward progress", () => {
    expect(
      mergeRuntimeStateFromPoll("matching", "extraction", Date.now() - 200),
    ).toBe("extraction");
  });

  it("accepts lobby reset always", () => {
    expect(
      mergeRuntimeStateFromPoll("extraction", "lobby", Date.now() - 100),
    ).toBe("lobby");
  });

  it("accepts stale regress after grace", () => {
    expect(
      mergeRuntimeStateFromPoll(
        "extraction",
        "matching",
        Date.now() - 10_000,
      ),
    ).toBe("matching");
  });
});
