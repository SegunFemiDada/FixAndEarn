// Path: apps/web/src/lib/verification/types.ts
import { z } from "zod";

export const VerificationStatusSchema = z.enum(["PENDING", "APPROVED", "REJECTED"]);

export const VerificationSubmittedDataSchema = z.object({
  bio: z.string().optional().default(""),
  skills: z.array(z.string()).optional().default([]),
  addressHouse: z.string().optional().default(""),
  addressStreet: z.string().optional().default(""),
  addressArea: z.string().optional().default(""),
  nearestBusStop: z.string().optional().default(""),
  lga: z.string().optional().default(""),
  city: z.string().optional().default(""),
  state: z.string().optional().default(""),
  instagram: z.string().optional().default(""),
  tiktok: z.string().optional().default(""),
  hasNinImage: z.boolean().optional().default(false),
  hasSelfieImage: z.boolean().optional().default(false),
  hasUtilityBill: z.boolean().optional().default(false),
});

export const VerificationMeResponseSchema = z
  .object({
    status: VerificationStatusSchema,
    reviewReason: z.string().nullable().optional(),
    reuploadFields: z.array(z.string()).optional().default([]),
    forceReverify: z.boolean().optional().default(false),
    submittedData: VerificationSubmittedDataSchema.optional(),
  })
  .nullable();

export type VerificationMeResponse = z.infer<typeof VerificationMeResponseSchema>;

export const VerificationSubmitFormSchema = z.object({
  bvn: z.string().optional().default(""),
  bio: z.string().optional().default(""),
  skills: z.array(z.string()).optional().default([]),

  addressHouse: z.string().optional().default(""),
  addressStreet: z.string().optional().default(""),
  addressArea: z.string().optional().default(""),
  nearestBusStop: z.string().optional().default(""),
  lga: z.string().optional().default(""),
  city: z.string().optional().default(""),
  state: z.string().optional().default(""),

  instagram: z.string().optional().default(""),
  tiktok: z.string().optional().default(""),

  ninImage: z.any().optional(),
  selfieImage: z.any().optional(),
  utilityBill: z.any().optional(),
});

export type VerificationSubmitFormValues = z.input<typeof VerificationSubmitFormSchema>;