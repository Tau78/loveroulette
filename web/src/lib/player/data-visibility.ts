import { z } from "zod";
import type { ParticipantDataVisibility } from "@/lib/musicpro/types";

export const DEFAULT_PARTICIPANT_DATA_VISIBILITY: ParticipantDataVisibility =
  "matched";

export const PARTICIPANT_DATA_VISIBILITY_VALUES = [
  "everyone",
  "matched",
  "none",
] as const satisfies readonly ParticipantDataVisibility[];

export const participantDataVisibilitySchema = z.enum(
  PARTICIPANT_DATA_VISIBILITY_VALUES,
);

export interface DataVisibilityOption {
  value: ParticipantDataVisibility;
  label: string;
  description: string;
}

export const DATA_VISIBILITY_OPTIONS: readonly DataVisibilityOption[] = [
  {
    value: "everyone",
    label: "Tutti",
    description: "Visibile a tutti i partecipanti in sala.",
  },
  {
    value: "matched",
    label: "Solo match",
    description: "Visibile solo al tuo partner di coppia.",
  },
  {
    value: "none",
    label: "Nessuno",
    description: "I tuoi dati restano privati durante la serata.",
  },
] as const;

export function normalizeParticipantDataVisibility(
  value: unknown,
): ParticipantDataVisibility {
  const parsed = participantDataVisibilitySchema.safeParse(value);
  return parsed.success ? parsed.data : DEFAULT_PARTICIPANT_DATA_VISIBILITY;
}

export function dataVisibilityLabel(
  value: ParticipantDataVisibility,
): string {
  return (
    DATA_VISIBILITY_OPTIONS.find((option) => option.value === value)?.label ??
    DATA_VISIBILITY_OPTIONS[1].label
  );
}
