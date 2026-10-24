import { z } from "zod";

export const usageMeterKeyRegex = /^[a-z][a-z0-9_:-]*$/;

export const createUsageMeterSchema = z.object({
  key: z
    .string()
    .min(2, "Meter key must be at least 2 characters")
    .max(50, "Meter key cannot exceed 50 characters")
    .regex(
      usageMeterKeyRegex,
      "Key must start with a lowercase letter and contain only lowercase letters, numbers, underscores, colons, or hyphens"
    ),
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(80, "Name cannot exceed 80 characters"),
  unit: z
    .string()
    .min(1, "Unit of measurement is required")
    .max(30, "Unit cannot exceed 30 characters"),
});

export type CreateUsageMeterInput = z.infer<typeof createUsageMeterSchema>;
