import { describe, expect, it } from "vitest";
import {
  NICKNAME_FROM_REAL_NAME_PROMPT,
  resolveNicknameOnSave,
} from "@/lib/player/nickname-save";

describe("resolveNicknameOnSave", () => {
  it("keeps an explicit nickname", () => {
    expect(
      resolveNicknameOnSave({ realName: "Mario Rossi", nickname: "Mastro" }),
    ).toEqual({
      ok: true,
      nickname: "Mastro",
      realName: "Mario Rossi",
    });
  });

  it("asks confirmation when nickname is empty but real name exists", () => {
    expect(
      resolveNicknameOnSave({ realName: "Mario Rossi", nickname: "  " }),
    ).toEqual({ ok: false, reason: "NEED_CONFIRM" });
  });

  it("uses real name after confirmation", () => {
    expect(
      resolveNicknameOnSave({
        realName: "Mario Rossi",
        nickname: "",
        confirmUseRealName: true,
      }),
    ).toEqual({
      ok: true,
      nickname: "Mario Rossi",
      realName: "Mario Rossi",
    });
  });

  it("requires at least a real name when both empty", () => {
    expect(resolveNicknameOnSave({ realName: "", nickname: "" })).toEqual({
      ok: false,
      reason: "NEED_REAL_NAME",
    });
  });

  it("exposes the confirm copy for the UI", () => {
    expect(NICKNAME_FROM_REAL_NAME_PROMPT).toContain("Nickname");
    expect(NICKNAME_FROM_REAL_NAME_PROMPT).toContain("schermo");
  });
});
