import { describe, expect, it } from "vitest";
import {
  legacySeekingFor,
  mutuallyCompatible,
  parseLoveRouletteSeeking,
  type PreferencePerson,
} from "./identity";

function person(
  gender: PreferencePerson["gender"],
  seeking: PreferencePerson["seeking"],
): PreferencePerson {
  return { gender, seeking };
}

describe("mutuallyCompatible", () => {
  it("accoppia uomo e donna quando il cerco è reciproco", () => {
    expect(
      mutuallyCompatible(person("male", "female"), person("female", "male")),
    ).toBe(true);
  });

  it("accoppia due uomini se ognuno cerca uomini o tutti", () => {
    expect(
      mutuallyCompatible(person("male", "male"), person("male", "both")),
    ).toBe(true);
  });

  it("accoppia due donne", () => {
    expect(
      mutuallyCompatible(person("female", "both"), person("female", "female")),
    ).toBe(true);
  });

  it("non accoppia se uno non cerca il genere dell’altro", () => {
    expect(
      mutuallyCompatible(person("male", "female"), person("female", "female")),
    ).toBe(false);
  });

  it("tratta Entrambi come aperto anche al non binary", () => {
    expect(
      mutuallyCompatible(
        person("nonbinary", "both"),
        person("male", "both"),
      ),
    ).toBe(true);
  });

  it("non fa matchare un non binary con chi cerca solo donne", () => {
    expect(
      mutuallyCompatible(
        person("nonbinary", "both"),
        person("female", "female"),
      ),
    ).toBe(false);
  });

  it("accoppia non binary e uomo se l’uomo è nel cerco e l’uomo è aperto a tutti", () => {
    expect(
      mutuallyCompatible(
        person("nonbinary", "male"),
        person("male", "both"),
      ),
    ).toBe(true);
  });
});

describe("legacySeekingFor", () => {
  it("tiene i giocatori già in sala sul match uomo↔donna", () => {
    expect(legacySeekingFor("male")).toBe("female");
    expect(legacySeekingFor("female")).toBe("male");
    expect(legacySeekingFor("nonbinary")).toBe("both");
    expect(parseLoveRouletteSeeking(null, "male")).toBe("female");
  });
});
