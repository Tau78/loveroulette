import { describe, expect, it } from "vitest";
import {
  boardPlayerFromRow,
  playerCardDisplayCommand,
  playerDetailDisplayCommand,
  playerFullName,
  playerScreenDetails,
  playerScreenPhoto,
  type BoardPlayer,
} from "@/lib/admin/board-player-screen";

const sara: BoardPlayer = {
  id: "1",
  nick: "Sara",
  gender: "F",
  photo: "https://cdn.example/sara.jpg",
  score: 200,
  firstName: "Sara",
  lastName: "Rossi",
  seeking: "male",
  ageBand: "30_39",
};

describe("board player → schermo", () => {
  it("builds the name+photo card overlay", () => {
    expect(playerCardDisplayCommand(sara)).toEqual({
      type: "slide",
      title: "SARA",
      kicker: "F",
      body: "Lei",
      imageUrl: "https://cdn.example/sara.jpg",
    });
  });

  it("lists only filled details and sends one field without gender kicker", () => {
    const fields = playerScreenDetails(sara).map((d) => d.field);
    expect(fields).toContain("name");
    expect(fields).toContain("seeking");
    expect(fields).toContain("age");
    expect(fields).toContain("score");
    expect(playerFullName(sara)).toBe("Sara Rossi");
    expect(playerDetailDisplayCommand(sara, "seeking")).toEqual({
      type: "slide",
      kicker: "Sara",
      title: "UOMINI",
      body: "Cerca",
      imageUrl: "https://cdn.example/sara.jpg",
    });
  });

  it("falls back to avatar when photo is a local blob", () => {
    expect(
      playerScreenPhoto({ ...sara, photo: "blob:http://localhost/x" }),
    ).toBe("/grafiche/avatar-f.png");
  });

  it("maps admin rows and never lists email or phone", () => {
    const mapped = boardPlayerFromRow({
      id: "9",
      nickname: "Leo",
      gender: "male",
      first_name: "Leo",
      last_name: "Bianchi",
      real_name: "Leo Bianchi",
      seeking: "female",
      age_band: "18_29",
      photo_url: "https://cdn.example/leo.jpg",
    });
    expect(mapped.gender).toBe("M");
    expect(playerFullName(mapped)).toBe("Leo Bianchi");
    const blob = JSON.stringify(playerScreenDetails(mapped));
    expect(blob.toLowerCase()).not.toMatch(/email|telefono|phone|@/);
  });
});
