import {
  CREDIT_DURATION_MS,
  type StaffSession,
} from "./auth";

export type CreditStatus =
  | { kind: "unlimited" }
  | { kind: "inactive" }
  | { kind: "active"; activatedAt: number; expiresAt: number; remainingMs: number };

export function creditStatus(
  session: StaffSession | null,
  activatedAtIso: string | null,
  nowMs: number = Date.now(),
): CreditStatus {
  if (!session) return { kind: "inactive" };
  if (session.unlimitedCredits) return { kind: "unlimited" };

  if (!activatedAtIso) return { kind: "inactive" };
  const activatedAt = Date.parse(activatedAtIso);
  if (!Number.isFinite(activatedAt)) return { kind: "inactive" };

  const expiresAt = activatedAt + CREDIT_DURATION_MS;
  const remainingMs = expiresAt - nowMs;
  if (remainingMs <= 0) return { kind: "inactive" };

  return { kind: "active", activatedAt, expiresAt, remainingMs };
}

export function canRunPlancia(status: CreditStatus): boolean {
  return status.kind === "unlimited" || status.kind === "active";
}

export function formatRemaining(ms: number): string {
  const totalMin = Math.max(0, Math.ceil(ms / 60_000));
  const hours = Math.floor(totalMin / 60);
  const minutes = totalMin % 60;
  if (hours <= 0) return `${minutes} min`;
  return `${hours} h ${minutes.toString().padStart(2, "0")} min`;
}

export function formatExpiry(expiresAt: number): string {
  try {
    return new Date(expiresAt).toLocaleTimeString("it-IT", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}
