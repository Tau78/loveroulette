import type { ParticipantDataVisibility } from "@/lib/musicpro/types";
import { normalizeParticipantDataVisibility } from "@/lib/player/data-visibility";
import {
  explicitSeeking,
  parseLoveRouletteAgeBand,
  parseLoveRouletteGender,
  parsePublicNameMode,
  type LoveRouletteAgeBand,
  type LoveRouletteGender,
  type LoveRouletteSeeking,
  type PublicNameMode,
} from "@/lib/player/identity";

export interface StoredParticipantProfile {
  id: string;
  /** Nome mostrato in sala. */
  nickname: string;
  nick: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  photoUrl: string;
  publicNameMode: PublicNameMode;
  gender: LoveRouletteGender;
  seeking: LoveRouletteSeeking | null;
  ageBand: LoveRouletteAgeBand | null;
  badgeCode: string;
  dataVisibility: ParticipantDataVisibility;
}

export function storedProfileCanReconnect(
  profile: StoredParticipantProfile,
): boolean {
  return Boolean(
    profile.firstName.trim() &&
      profile.lastName.trim() &&
      profile.phone.trim() &&
      profile.email.trim() &&
      profile.photoUrl.trim() &&
      profile.seeking &&
      profile.ageBand,
  );
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function idKey(eventSlug: string): string {
  return `lr_participant_${eventSlug}`;
}

function profileKey(eventSlug: string): string {
  return `lr_participant_profile_${eventSlug}`;
}

function readFromStorage(
  storage: Storage,
  eventSlug: string,
): StoredParticipantProfile | null {
  try {
    const raw = storage.getItem(profileKey(eventSlug));
    if (!raw) return null;

    const profile = JSON.parse(raw) as Partial<StoredParticipantProfile>;
    if (!profile.id || !UUID_RE.test(profile.id) || !profile.nickname) {
      storage.removeItem(profileKey(eventSlug));
      storage.removeItem(idKey(eventSlug));
      return null;
    }

    const gender = parseLoveRouletteGender(profile.gender);

    return {
      id: profile.id,
      nickname: profile.nickname,
      nick: profile.nick ?? "",
      firstName: profile.firstName ?? "",
      lastName: profile.lastName ?? "",
      phone: profile.phone ?? "",
      email: profile.email ?? "",
      photoUrl: profile.photoUrl ?? "",
      publicNameMode: parsePublicNameMode(profile.publicNameMode),
      gender,
      seeking: explicitSeeking(profile.seeking),
      ageBand: parseLoveRouletteAgeBand(profile.ageBand),
      badgeCode: profile.badgeCode ?? "",
      dataVisibility: normalizeParticipantDataVisibility(profile.dataVisibility),
    };
  } catch {
    storage.removeItem(profileKey(eventSlug));
    storage.removeItem(idKey(eventSlug));
    return null;
  }
}

/** Profilo persistito sul dispositivo (sopravvive a chiusura tab / riavvio browser). */
export function readStoredParticipantProfile(
  eventSlug: string,
): StoredParticipantProfile | null {
  if (typeof window === "undefined") return null;

  const fromLocal = readFromStorage(localStorage, eventSlug);
  if (fromLocal) return fromLocal;

  const fromSession = readFromStorage(sessionStorage, eventSlug);
  if (!fromSession) return null;

  persistParticipantProfile(eventSlug, fromSession);
  return fromSession;
}

export function readStoredParticipantId(eventSlug: string): string | null {
  return readStoredParticipantProfile(eventSlug)?.id ?? null;
}

export function persistParticipantProfile(
  eventSlug: string,
  profile: StoredParticipantProfile,
): void {
  const payload = JSON.stringify({
    ...profile,
    dataVisibility: normalizeParticipantDataVisibility(profile.dataVisibility),
  });
  localStorage.setItem(idKey(eventSlug), profile.id);
  localStorage.setItem(profileKey(eventSlug), payload);
  sessionStorage.removeItem(idKey(eventSlug));
  sessionStorage.removeItem(profileKey(eventSlug));
}

export function clearStoredParticipant(eventSlug: string): void {
  localStorage.removeItem(idKey(eventSlug));
  localStorage.removeItem(profileKey(eventSlug));
  sessionStorage.removeItem(idKey(eventSlug));
  sessionStorage.removeItem(profileKey(eventSlug));
}
