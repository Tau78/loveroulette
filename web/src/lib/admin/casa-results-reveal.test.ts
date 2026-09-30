import { afterEach, describe, expect, it, vi } from "vitest";
import {
  consumeCasaResultsRevealCue,
  playCasaResultsRevealHit,
  resetCasaResultsRevealHit,
} from "./casa-results-reveal";
import { resetQuizGongGate } from "@/lib/audio/quiz-gong-results-gate";

describe("casa results reveal hit", () => {
  afterEach(() => {
    resetCasaResultsRevealHit();
    resetQuizGongGate();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("does not play after consumeCasaResultsRevealCue for the same cue", () => {
    const play = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal(
      "Audio",
      vi.fn(function MockAudio(this: {
        play: typeof play;
        pause: () => void;
        loop: boolean;
        addEventListener: ReturnType<typeof vi.fn>;
      }) {
        this.play = play;
        this.pause = vi.fn();
        this.loop = false;
        this.addEventListener = vi.fn();
      }),
    );

    consumeCasaResultsRevealCue("0:ts");
    playCasaResultsRevealHit({ cueKey: "0:ts" });
    expect(play).not.toHaveBeenCalled();

    playCasaResultsRevealHit({ cueKey: "1:ts" });
    expect(play).toHaveBeenCalledTimes(1);
  });
});
