import type { SupabaseClient } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetLoveRouletteEvent } from "./reset-event";

vi.mock("./session", () => ({
  updateSessionRuntimeState: vi.fn().mockResolvedValue({
    sessionId: "session-1",
    runtimeState: "lobby",
  }),
}));

vi.mock("./display-overlay", () => ({
  setDisplayOverlay: vi.fn().mockResolvedValue({ type: "clear", updatedAt: "" }),
}));

function createMockSupabase() {
  const deletedTables: string[] = [];
  let updatedMetadata: Record<string, unknown> | null = null;

  const supabase = {
    from: vi.fn((table: string) => {
      const chain = {
        select: vi.fn(() => chain),
        eq: vi.fn(() => chain),
        in: vi.fn(() => chain),
        delete: vi.fn(() => {
          deletedTables.push(table);
          return {
            in: vi.fn(() => Promise.resolve({ error: null })),
            eq: vi.fn(() => Promise.resolve({ error: null })),
          };
        }),
        update: vi.fn((payload: { metadata?: Record<string, unknown>; is_online?: boolean }) => {
          if (payload.metadata !== undefined) {
            updatedMetadata = payload.metadata;
          }
          return {
            eq: vi.fn(() => Promise.resolve({ error: null })),
          };
        }),
        maybeSingle: vi.fn(() => {
          if (table === "events") {
            return Promise.resolve({
              data: {
                metadata: {
                  love_roulette_quiz: { phase: "question" },
                  love_roulette_display: { type: "custom" },
                  love_roulette_last_reveal: { pairId: "p1" },
                  love_roulette_voting: { round: 1 },
                  other_key: "keep",
                },
              },
              error: null,
            });
          }
          return Promise.resolve({ data: null, error: null });
        }),
      };

      if (table === "love_roulette_participants") {
        const participantChain = {
          eq: vi.fn(() =>
            Promise.resolve({
              data: [{ id: "participant-1" }],
              error: null,
            }),
          ),
        };
        return {
          ...chain,
          select: vi.fn(() => participantChain),
        };
      }

      return chain;
    }),
  };

  return {
    supabase: supabase as unknown as SupabaseClient,
    deletedTables,
    getUpdatedMetadata: () => updatedMetadata,
  };
}

describe("resetLoveRouletteEvent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("clears game state but preserves event questions", async () => {
    const { supabase, deletedTables, getUpdatedMetadata } = createMockSupabase();

    const result = await resetLoveRouletteEvent(supabase, "event-1");

    expect(result).toEqual({ runtimeState: "lobby", clearedParticipants: false });
    expect(deletedTables).toContain("love_roulette_answers");
    expect(deletedTables).toContain("love_roulette_pairs");
    expect(deletedTables).not.toContain("love_roulette_questions");
    expect(deletedTables).not.toContain("love_roulette_question_options");

    const metadata = getUpdatedMetadata();
    expect(metadata).toEqual({ other_key: "keep" });
    expect(metadata).not.toHaveProperty("love_roulette_quiz");
    expect(metadata).not.toHaveProperty("love_roulette_display");
    expect(metadata).not.toHaveProperty("love_roulette_last_reveal");
    expect(metadata).not.toHaveProperty("love_roulette_voting");
  });

  it("can clear participants when requested", async () => {
    const { supabase, deletedTables } = createMockSupabase();

    const result = await resetLoveRouletteEvent(supabase, "event-1", {
      clearParticipants: true,
    });

    expect(result.clearedParticipants).toBe(true);
    expect(deletedTables).toContain("love_roulette_participants");
  });
});
