import { z } from "zod";

export const flagItemSchema = z.object({
  type: z.enum(["warning", "info"]),
  label: z.string(),
  observation: z.string(),
});

export const roleDetailsSchema = z.object({
  title: z.string(),
  company: z.string(),
  location: z.string().default("Not specified"),
  jobType: z.string().default("Not specified"),
  experienceLevel: z.string().default("Not specified"),
  summary: z.string(),
  responsibilities: z.array(z.string()),
  requirements: z.array(z.string()),
  preferredSkills: z.array(z.string()).default([]),
  howToApply: z.string().default("Apply on LinkedIn"),
});

export const posterDetailsSchema = z.object({
  isCompanyPost: z.boolean().default(false),
  name: z.string().nullable().default(null),
  title: z.string().nullable().default(null),
  location: z.string().nullable().default(null),
  education: z.string().nullable().default(null),
  experienceSummary: z.string().nullable().default(null),
});

export const companyDetailsSchema = z.object({
  name: z.string(),
  industry: z.string().default("Not available"),
  size: z.string().default("Not available"),
  geographicPresence: z.string().default("Not available"),
  website: z.string().nullable().default(null),
  bio: z.string().default("Not available"),
});

export const structuredReportSchema = z.object({
  role: roleDetailsSchema,
  poster: posterDetailsSchema,
  company: companyDetailsSchema,
  flags: z.array(flagItemSchema).default([]),
});

export const opportunityMetadataSchema = z.object({
  role: z.string(),
  company: z.string(),
  hrName: z.string().nullable().default(null),
  hrEmail: z.string().nullable().default(null),
});

export const analysisReportOutputSchema = z.object({
  telegramReport: z.string(),
  report: structuredReportSchema,
  metadata: opportunityMetadataSchema,
});

export type StructuredReport = z.infer<typeof structuredReportSchema>;
export type AnalysisReportOutput = z.infer<typeof analysisReportOutputSchema>;
export type OpportunityMetadata = z.infer<typeof opportunityMetadataSchema>;

/**
 * Enforces Hard Rule 10 & Domain Rule 6.3 IN CODE:
 * Discards any HR email not present literally in the original source post text.
 */
export function sanitizeHrEmail(
  extractedEmail: string | null | undefined,
  sourcePostText: string
): string | null {
  if (!extractedEmail || typeof extractedEmail !== "string") {
    return null;
  }

  const cleanEmail = extractedEmail.trim().toLowerCase();
  if (!cleanEmail.includes("@")) {
    return null;
  }

  // Escape special regex characters in the email
  const escaped = cleanEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`\\b${escaped}\\b`, "i");

  if (!regex.test(sourcePostText)) {
    return null;
  }

  return cleanEmail;
}
