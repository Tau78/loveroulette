import { z } from "zod";
import {
  loveRouletteAgeBandSchema,
  loveRouletteGenderSchema,
  loveRouletteSeekingSchema,
  publicNameModeSchema,
} from "@/lib/player/identity";
import {
  DEFAULT_PARTICIPANT_DATA_VISIBILITY,
  participantDataVisibilitySchema,
} from "@/lib/player/data-visibility";

export const joinParticipantBodySchema = z.object({
  firstName: z.string().trim().min(1).max(40),
  lastName: z.string().trim().min(1).max(40),
  phone: z.string().trim().min(6).max(24),
  email: z.string().trim().email().max(80),
  photoUrl: z.string().trim().min(20).max(400_000),
  nick: z.string().trim().max(24).optional().nullable(),
  publicNameMode: publicNameModeSchema,
  gender: loveRouletteGenderSchema,
  seeking: loveRouletteSeekingSchema,
  ageBand: loveRouletteAgeBandSchema,
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
