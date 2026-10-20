import { z } from "zod";

export const rawPostSchema = z
  .object({
    text: z.string().optional().default(""),
    post: z
      .object({
        id: z.string().optional(),
        url: z.string().optional(),
        text: z.string().optional(),
      })
      .optional(),
    post_text: z.string().optional(),
    job_description: z.string().optional(),
    author: z
      .object({
        name: z.string().default(""),
        profile_url: z.string().default(""),
        headline: z.string().optional(),
        company_id: z.union([z.string(), z.number()]).nullable().optional(),
      })
      .default({ name: "", profile_url: "" }),
    company_id: z.union([z.string(), z.number()]).nullable().optional(),
    company_url: z.string().optional(),
    companyLinkedinUrl: z.string().optional(),
  })
  .passthrough();

export const rawAuthorSchema = z
  .object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    name: z.string().optional(),
    headline: z.string().optional(),
    location: z
      .union([
        z.string(),
        z.object({ linkedinText: z.string().optional() }).passthrough(),
      ])
      .optional(),
    about: z.string().optional(),
    approx_experience_years: z.union([z.number(), z.string()]).optional(),
    degree: z.string().optional(),
    education: z.array(z.record(z.string(), z.unknown())).optional(),
    experience: z.array(z.record(z.string(), z.unknown())).optional(),
    currentPosition: z
      .array(
        z
          .object({
            companyName: z.string().optional(),
            companyLinkedinUrl: z.string().optional(),
            companyId: z.union([z.string(), z.number()]).optional(),
            position: z.string().optional(),
          })
          .passthrough()
      )
      .optional(),
  })
  .passthrough();

export const rawCompanySchema = z
  .object({
    name: z.string().optional(),
    industry: z.string().optional(),
    industries: z.array(z.object({ name: z.string().optional() }).passthrough()).optional(),
    company_size: z.union([z.string(), z.number()]).optional(),
    employeeCountRange: z
      .object({
        start: z.union([z.string(), z.number()]).optional(),
        end: z.union([z.string(), z.number()]).optional(),
      })
      .passthrough()
      .optional(),
    employee_count: z.union([z.string(), z.number()]).optional(),
    locations: z.union([z.array(z.string()), z.string()]).optional(),
    peopleStats: z.array(z.record(z.string(), z.unknown())).optional(),
    website: z.string().optional(),
    description: z.string().optional(),
  })
  .passthrough();

export type RawPostData = z.infer<typeof rawPostSchema>;
export type RawAuthorData = z.infer<typeof rawAuthorSchema>;
export type RawCompanyData = z.infer<typeof rawCompanySchema>;

export interface NormalizedScrapedPayload {
  post: {
    text: string;
    url: string;
    isCompanyAuthor: boolean;
  };
  hr: {
    name: string;
    headline: string;
    location: string;
    degree: string;
    approx_experience_years: string;
    about: string;
  };
  company: {
    name: string;
    industry: string;
    company_size: string;
    geographic_presence: string;
    website: string;
    description: string;
  };
}
