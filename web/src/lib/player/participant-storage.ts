export interface StoredParticipantProfile {
  id: string;
  nickname: string;
  gender: "male" | "female";
  badgeCode: string;
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

    const profile = JSON.parse(raw) as StoredParticipantProfile;
    if (!profile.id || !UUID_RE.test(profile.id) || !profile.nickname) {
      storage.removeItem(profileKey(eventSlug));
      storage.removeItem(idKey(eventSlug));
      return null;
    }

    return {
      id: profile.id,
      nickname: profile.nickname,
      gender: profile.gender === "female" ? "female" : "male",
      badgeCode: profile.badgeCode ?? "",
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
  const payload = JSON.stringify(profile);
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
