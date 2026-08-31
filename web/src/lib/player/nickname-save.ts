/**
 * Nickname obbligatorio a schermo; può coincidere col nome vero.
 */

export const NICKNAME_FROM_REAL_NAME_PROMPT =
  "Vuoi usare il tuo vero nome come Nickname? Verrà mostrato a schermo";

export type NicknameSaveInput = {
  realName: string;
  nickname: string;
  /** true dopo conferma positiva al dialog. */
  confirmUseRealName?: boolean;
};

export type NicknameSaveResult =
  | { ok: true; nickname: string; realName: string }
  | { ok: false; reason: "NEED_REAL_NAME" | "NEED_NICKNAME" | "NEED_CONFIRM" };

/**
 * Risolve nickname al Salva / Entra.
 * - nick compilato → ok
 * - nick vuoto + nome → chiede conferma (o usa il nome se già confermato)
 * - entrambi vuoti → errore
 */
export function resolveNicknameOnSave(
  input: NicknameSaveInput,
): NicknameSaveResult {
  const realName = input.realName.trim();
  const nickname = input.nickname.trim();

  if (nickname) {
    return { ok: true, nickname, realName };
  }

  if (!realName) {
    return { ok: false, reason: "NEED_REAL_NAME" };
  }

  if (!input.confirmUseRealName) {
    return { ok: false, reason: "NEED_CONFIRM" };
  }

  return { ok: true, nickname: realName, realName };
}

export function nicknameSaveErrorMessage(
  reason: Extract<NicknameSaveResult, { ok: false }>["reason"],
): string {
  switch (reason) {
    case "NEED_REAL_NAME":
      return "Scrivi almeno il tuo nome (o un nickname).";
    case "NEED_NICKNAME":
      return "Il nickname è obbligatorio: verrà mostrato a schermo.";
    case "NEED_CONFIRM":
      return NICKNAME_FROM_REAL_NAME_PROMPT;
  }
}
