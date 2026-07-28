// Path: apps/web/src/lib/jobs/types.ts
import { z } from "zod";

export const JobImageSchema = z.object({
  id: z.string(),
  imagePath: z.string().optional().nullable(),
  sortOrder: z.number().int().optional().nullable(),
  createdAt: z.string().optional().nullable(),
});

export const JobSchema = z.object({
  id: z.string(),

  skillCategory: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  lga: z.string().optional().nullable(),
  area: z.string().optional().nullable(),

  status: z.string().optional().nullable(),

  priceMilliFec: z.number().int().optional().nullable(),
  lockedPriceMilliFec: z.number().int().optional().nullable(),

  createdAt: z.string().optional().nullable(),

  images: z.array(JobImageSchema).optional().default([]),
});

export type JobImage = z.infer<typeof JobImageSchema>;
export type Job = z.infer<typeof JobSchema>;
export const JobsListSchema = z.array(JobSchema);
export type JobsList = z.infer<typeof JobsListSchema>;

export const CreateJobSchema = z.object({
  skillCategory: z.string().min(2, "Skill category is required"),
  state: z.string().min(2, "State is required"),
  city: z.string().min(2, "City is required"),
  lga: z.string().optional(),
  area: z.string().optional(),
  priceFec: z
    .string()
    .min(1, "Price is required")
    .refine((v) => !Number.isNaN(Number(v)), "Price must be a number")
    .refine((v) => Number(v) > 0, "Price must be > 0"),
});

export type CreateJobFormValues = z.infer<typeof CreateJobSchema>;

export const MarketplaceStatsSchema = z.object({
  openJobs: z.number().int(),
  inProgressJobs: z.number().int(),
  completedJobs: z.number().int(),
});

export type MarketplaceStats = z.infer<typeof MarketplaceStatsSchema>;