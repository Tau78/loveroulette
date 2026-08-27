import { afterEach, describe, expect, it, vi } from "vitest";
import {
  classifyPlayerActionResponse,
  enqueueAndSendPlayerAction,
  enqueuePlayerAction,
  flushPlayerActionQueue,
  playerActionId,
  readPlayerActionQueue,
  removePlayerAction,
} from "./player-action-queue";

const memory = new Map<string, string>();

function installStorage() {
  memory.clear();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => {
      memory.set(key, value);
    },
    removeItem: (key: string) => {
      memory.delete(key);
    },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  memory.clear();
});

describe("classifyPlayerActionResponse", () => {
  it("acks successful posts and already-submitted answers", () => {
    expect(classifyPlayerActionResponse("vote", 200)).toBe("acked");
    expect(classifyPlayerActionResponse("answer", 409)).toBe("acked");
  });

  it("drops a vote when the window is already closed", () => {
    expect(classifyPlayerActionResponse("vote", 409)).toBe("dropped");
    expect(classifyPlayerActionResponse("vote", 400)).toBe("dropped");
  });

  it("retries network and server failures", () => {
    expect(classifyPlayerActionResponse("answer", 503)).toBe("retry");
    expect(classifyPlayerActionResponse("vote", 0)).toBe("retry");
  });
});

describe("player action queue", () => {
  it("replaces the latest vote for the same player", () => {
    installStorage();
    const first = {
      id: playerActionId({ kind: "vote", participantId: "p1" }),
      kind: "vote" as const,
      eventSlug: "DEMO01",
      participantId: "p1",
      pairId: "pair-a",
      createdAt: 1,
    };
    const second = { ...first, pairId: "pair-b", createdAt: 2 };

    enqueuePlayerAction(first);
    enqueuePlayerAction(second);

    const queued = readPlayerActionQueue("DEMO01");
    expect(queued).toHaveLength(1);
    expect(queued[0]).toMatchObject({ pairId: "pair-b" });
  });

  it("keeps the action when the first send fails", async () => {
    installStorage();
    const fetchImpl = vi.fn().mockRejectedValue(new Error("offline"));

    const result = await enqueueAndSendPlayerAction(
      {
        kind: "answer",
        eventSlug: "DEMO01",
        participantId: "11111111-1111-1111-1111-111111111111",
        questionId: "22222222-2222-2222-2222-222222222222",
        optionId: "33333333-3333-3333-3333-333333333333",
      },
      fetchImpl,
    );

    expect(result).toEqual({ ok: true, queued: true });
    expect(readPlayerActionQueue("DEMO01")).toHaveLength(1);
  });

  it("removes the action after a successful flush", async () => {
    installStorage();
    enqueuePlayerAction({
      id: playerActionId({ kind: "vote", participantId: "p1" }),
      kind: "vote",
      eventSlug: "DEMO01",
      participantId: "p1",
      pairId: "pair-a",
      createdAt: 1,
    });

    const fetchImpl = vi.fn().mockResolvedValue({
      status: 200,
      json: async () => ({}),
    });

    await flushPlayerActionQueue("DEMO01", fetchImpl as unknown as typeof fetch);
    expect(readPlayerActionQueue("DEMO01")).toHaveLength(0);
  });

  it("drops a closed voting window instead of retrying forever", async () => {
    installStorage();
    enqueuePlayerAction({
      id: playerActionId({ kind: "vote", participantId: "p1" }),
      kind: "vote",
      eventSlug: "DEMO01",
      participantId: "p1",
      pairId: "pair-a",
      createdAt: 1,
    });

    const fetchImpl = vi.fn().mockResolvedValue({
      status: 409,
      json: async () => ({ error: "La votazione non è attiva." }),
    });

    await flushPlayerActionQueue("DEMO01", fetchImpl as unknown as typeof fetch);
    expect(readPlayerActionQueue("DEMO01")).toHaveLength(0);
    removePlayerAction("DEMO01", "missing");
  });
});
