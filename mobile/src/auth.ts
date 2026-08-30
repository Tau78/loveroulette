/**
 * Auth plancia — bootstrap hardcodato allineato ad APP Eventi (admin / admin12).
 * Poi: stessa edge `auth-login` / staff_users di MusicPro Eventi.
 */

export const CREDIT_DURATION_MS = 6 * 60 * 60 * 1000;

export type StaffSession = {
  username: string;
  /** Flag Eventi: niente consumo crediti (admin). */
  unlimitedCredits: boolean;
};

type BootstrapUser = StaffSession & { password: string };

/** Stesse credenziali bootstrap di APP Eventi (admin). */
const BOOTSTRAP_USERS: BootstrapUser[] = [
  {
    username: "admin",
    password: "admin12",
    unlimitedCredits: true,
  },
];

export const STORAGE_SESSION = "lr.plancia.session";
export const STORAGE_CREDIT_ACTIVATED_AT = "lr.plancia.credit.activatedAt";

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

export function loginWithPassword(
  username: string,
  password: string,
): { ok: true; session: StaffSession } | { ok: false; error: string } {
  const user = normalizeUsername(username);
  const pass = password.trim();
  if (!user || !pass) {
    return { ok: false, error: "Inserisci utente e password." };
  }

  const match = BOOTSTRAP_USERS.find(
    (row) => row.username === user && row.password === pass,
  );
  if (!match) {
    return { ok: false, error: "Utente o password non validi." };
  }

  return {
    ok: true,
    session: {
      username: match.username,
      unlimitedCredits: match.unlimitedCredits,
    },
  };
}

export function parseStoredSession(raw: string | null): StaffSession | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<StaffSession>;
    if (typeof parsed.username !== "string" || !parsed.username.trim()) {
      return null;
    }
    return {
      username: normalizeUsername(parsed.username),
      unlimitedCredits: Boolean(parsed.unlimitedCredits),
    };
  } catch {
    return null;
  }
}

export function serializeSession(session: StaffSession): string {
  return JSON.stringify({
    username: session.username,
    unlimitedCredits: session.unlimitedCredits,
  });
}
