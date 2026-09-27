import { z } from "zod";
import {
  loveRouletteAgeBandSchema,
  loveRouletteGenderSchema,
  loveRouletteSeekingSchema,
} from "@/lib/player/identity";
import {
  DEFAULT_PARTICIPANT_DATA_VISIBILITY,
  participantDataVisibilitySchema,
} from "@/lib/player/data-visibility";

export const joinParticipantBodySchema = z.object({
  nickname: z.string().trim().min(1).max(24),
  realName: z.string().trim().max(80).optional().nullable(),
  gender: loveRouletteGenderSchema,
  seeking: loveRouletteSeekingSchema.optional(),
  ageBand: loveRouletteAgeBandSchema.optional().nullable(),
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
