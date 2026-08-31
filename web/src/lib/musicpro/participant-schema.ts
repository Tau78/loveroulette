/** PostgREST / Supabase quando la colonna non esiste ancora in DB remoto. */
export function isDataVisibilitySchemaError(error: {
  message?: string;
  code?: string;
}): boolean {
  return isMissingColumnSchemaError(error, "data_visibility");
}

export function isRealNameSchemaError(error: {
  message?: string;
  code?: string;
}): boolean {
  return isMissingColumnSchemaError(error, "real_name");
}

function isMissingColumnSchemaError(
  error: { message?: string; code?: string },
  column: string,
): boolean {
  const msg = (error.message ?? "").toLowerCase();
  const code = error.code ?? "";
  const col = column.toLowerCase();

  if (!msg.includes(col)) return false;

  return (
    msg.includes("does not exist") ||
    msg.includes("schema cache") ||
    msg.includes("could not find") ||
    code === "PGRST204"
  );
}
