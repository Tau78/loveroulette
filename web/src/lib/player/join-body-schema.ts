import { z } from "zod";
import {
  DEFAULT_PARTICIPANT_DATA_VISIBILITY,
  participantDataVisibilitySchema,
} from "@/lib/player/data-visibility";

export const joinParticipantBodySchema = z.object({
  nickname: z.string().trim().min(1).max(24),
  gender: z.enum(["male", "female"]),
  badgeCode: z.string().trim().max(32).optional().nullable(),
  dataVisibility: participantDataVisibilitySchema
    .optional()
    .default(DEFAULT_PARTICIPANT_DATA_VISIBILITY),
  participantId: z
    .union([z.string().uuid(), z.literal(""), z.null()])
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
});

export type JoinParticipantBody = z.infer<typeof joinParticipantBodySchema>;
