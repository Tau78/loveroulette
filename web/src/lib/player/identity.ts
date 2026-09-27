import { z } from "zod";

/** Chi sei in sala. */
export const LOVE_ROULETTE_GENDERS = ["male", "female", "nonbinary"] as const;
export type LoveRouletteGender = (typeof LOVE_ROULETTE_GENDERS)[number];

/** Chi cerchi. `both` = aperto a tutti, non binary compreso. */
export const LOVE_ROULETTE_SEEKING = ["male", "female", "both"] as const;
export type LoveRouletteSeeking = (typeof LOVE_ROULETTE_SEEKING)[number];

/**
 * Fascia raccolta in ingresso. Il matching non la usa ancora:
 * il filtro età arriva col check-in.
 */
export const LOVE_ROULETTE_AGE_BANDS = [
  "18_29",
  "30_39",
  "40_49",
  "50_plus",
] as const;
export type LoveRouletteAgeBand = (typeof LOVE_ROULETTE_AGE_BANDS)[number];

export type StageGender = "M" | "F" | "N";

export const loveRouletteGenderSchema = z.enum(LOVE_ROULETTE_GENDERS);
export const loveRouletteSeekingSchema = z.enum(LOVE_ROULETTE_SEEKING);
export const loveRouletteAgeBandSchema = z.enum(LOVE_ROULETTE_AGE_BANDS);

export function parseLoveRouletteGender(value: unknown): LoveRouletteGender {
  if (value === "female" || value === "nonbinary") return value;
  return "male";
}

/** Giocatori già in sala senza «cerco»: restano sul match uomo↔donna. */
export function legacySeekingFor(
  gender: LoveRouletteGender,
): LoveRouletteSeeking {
  if (gender === "male") return "female";
  if (gender === "female") return "male";
  return "both";
}

export function parseLoveRouletteSeeking(
  value: unknown,
  gender: LoveRouletteGender,
): LoveRouletteSeeking {
  if (value === "male" || value === "female" || value === "both") return value;
  return legacySeekingFor(gender);
}

export function parseLoveRouletteAgeBand(
  value: unknown,
): LoveRouletteAgeBand | null {
  if (
    value === "18_29" ||
    value === "30_39" ||
    value === "40_49" ||
    value === "50_plus"
  ) {
    return value;
  }
  return null;
}

export function seekingAccepts(
  seeking: LoveRouletteSeeking,
  gender: LoveRouletteGender,
): boolean {
  if (seeking === "both") return true;
  return seeking === gender;
}

export interface PreferencePerson {
  gender: LoveRouletteGender;
  seeking: LoveRouletteSeeking;
}

/** Coppia solo se ognuno rientra in quello che l’altro cerca. */
export function mutuallyCompatible(
  a: PreferencePerson,
  b: PreferencePerson,
): boolean {
  return (
    seekingAccepts(a.seeking, b.gender) && seekingAccepts(b.seeking, a.gender)
  );
}

export function stageLetter(gender: unknown): StageGender {
  if (gender === "female" || gender === "F") return "F";
  if (gender === "nonbinary" || gender === "N") return "N";
  return "M";
}

export function stageSexLabel(gender: unknown): string {
  const letter = stageLetter(gender);
  if (letter === "F") return "Lei";
  if (letter === "N") return "Non binary";
  return "Lui";
}

export function genderChoiceLabel(gender: LoveRouletteGender): string {
  if (gender === "female") return "Donna";
  if (gender === "nonbinary") return "Non binary";
  return "Uomo";
}

export function seekingChoiceLabel(seeking: LoveRouletteSeeking): string {
  if (seeking === "female") return "Donne";
  if (seeking === "both") return "Entrambi";
  return "Uomini";
}

export function ageBandLabel(band: LoveRouletteAgeBand): string {
  if (band === "18_29") return "18–29";
  if (band === "30_39") return "30–39";
  if (band === "40_49") return "40–49";
  return "50+";
}

export function playerWelcomeLabel(gender: LoveRouletteGender): string {
  if (gender === "female") return "BENVENUTA";
  if (gender === "nonbinary") return "SEI IN SALA";
  return "BENVENUTO";
}
