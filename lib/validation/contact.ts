import { z } from "zod";

export const contactCategories = [
  "general",
  "support",
  "partnership",
  "feedback",
  "billing",
] as const;

export type ContactCategory = (typeof contactCategories)[number];

export const contactFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Please provide a valid email address")
    .max(120, "Email cannot exceed 120 characters"),
  subject: z
    .string()
    .trim()
    .min(3, "Subject must be at least 3 characters")
    .max(150, "Subject cannot exceed 150 characters"),
  category: z
    .enum(contactCategories)
    .default("general"),
  message: z
    .string()
    .trim()
    .min(10, "Message must be at least 10 characters")
    .max(3000, "Message cannot exceed 3000 characters"),
  website: z.string().optional().default(""), // Honeypot anti-spam field
});

export type ContactFormInput = z.infer<typeof contactFormSchema>;
