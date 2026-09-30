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

const OPTIONAL_PARTICIPANT_COLUMNS = [
  "age_band",
  "seeking",
  "real_name",
  "data_visibility",
  "first_name",
  "last_name",
  "phone",
  "email",
  "photo_url",
  "nick",
  "public_name_mode",
] as const;

/** Colonna opzionale assente nel DB remoto, se il payload la sta scrivendo. */
export function missingOptionalParticipantColumn(
  error: { message?: string; code?: string },
  payload: Record<string, unknown>,
): (typeof OPTIONAL_PARTICIPANT_COLUMNS)[number] | null {
  for (const column of OPTIONAL_PARTICIPANT_COLUMNS) {
    if (column in payload && isMissingColumnSchemaError(error, column)) {
      return column;
    }
  }
  return null;
}

export function isSeekingSchemaError(error: {
  message?: string;
  code?: string;
}): boolean {
  return isMissingColumnSchemaError(error, "seeking");
}

export function isAgeBandSchemaError(error: {
  message?: string;
  code?: string;
}): boolean {
  return isMissingColumnSchemaError(error, "age_band");
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
