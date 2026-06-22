/** PostgREST / Supabase quando la colonna non esiste ancora in DB remoto. */
export function isDataVisibilitySchemaError(error: {
  message?: string;
  code?: string;
}): boolean {
  const msg = (error.message ?? "").toLowerCase();
  const code = error.code ?? "";

  if (!msg.includes("data_visibility")) return false;

  return (
    msg.includes("does not exist") ||
    msg.includes("schema cache") ||
    msg.includes("could not find") ||
    code === "PGRST204"
  );
}
