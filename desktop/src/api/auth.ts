/**
 * Auth plancia locale — bootstrap hardcodato allineato a mobile/src/auth.ts
 * (admin / admin12). Nessuna chiave Supabase nel client desktop.
 */

export type StaffSession = {
  username: string;
  unlimitedCredits: boolean;
};

type BootstrapUser = StaffSession & { password: string };

const BOOTSTRAP_USERS: BootstrapUser[] = [
  {
    username: "admin",
    password: "admin12",
    unlimitedCredits: true,
  },
];

export const STORAGE_SESSION = "lr.desktop.plancia.session";

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

export function readStoredSession(): StaffSession | null {
  if (typeof window === "undefined") return null;
  return parseStoredSession(localStorage.getItem(STORAGE_SESSION));
}

export function persistSession(session: StaffSession): void {
  localStorage.setItem(STORAGE_SESSION, serializeSession(session));
}

export function clearSession(): void {
  localStorage.removeItem(STORAGE_SESSION);
}
