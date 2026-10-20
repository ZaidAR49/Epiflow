import { z } from "zod";

export const profileUpdateSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(80, "Name must be at most 80 characters"),
  preferredLanguage: z.enum(["ar", "en"]),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

export const workflowMetadataSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Applicant name must be at least 2 characters")
    .max(80, "Applicant name must be at most 80 characters")
    .optional(),
  cv: z
    .string()
    .trim()
    .url("CV link must be a valid URL (e.g. Google Drive link)")
    .or(z.literal(""))
    .optional(),
  sendEmail: z.boolean().default(true),
  preferred_language: z.enum(["ar", "en"]).optional(),
});

export type WorkflowMetadataInput = z.infer<typeof workflowMetadataSchema>;
