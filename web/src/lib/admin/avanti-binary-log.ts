/**
 * Log diagnostici del binario AVANTI.
 * Skip / desync: non bloccanti — solo traccia leggibile in console.
 * Prefisso fisso: `[avanti-binary]`
 */

export type AvantiBinaryLogKind = "skip" | "advance" | "desync" | "info";

export function logAvantiBinary(
  kind: AvantiBinaryLogKind,
  message: string,
  detail?: Record<string, unknown>,
): void {
  const line = `[avanti-binary] ${kind}: ${message}`;
  if (kind === "desync") {
    console.warn(line, detail ?? {});
    return;
  }
  console.info(line, detail ?? {});
}
