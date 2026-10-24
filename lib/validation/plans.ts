import { z } from "zod";

export const entitlementsSchema = z.record(
  z.string().min(1, "Workflow slug is required"),
  z.record(
    z.string().min(1, "Meter key is required"),
    z.number().int().min(0).nullable()
  )
);

export const planFormSchema = z.object({
  code: z
    .string()
    .min(2, "Code must be at least 2 characters")
    .max(50, "Code cannot exceed 50 characters")
    .regex(/^[a-z0-9_-]+$/, "Code must be lowercase alphanumeric, hyphens or underscores"),
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters"),
  priceMinor: z
    .number()
    .int("Price must be an integer (in cents/minor units)")
    .min(0, "Price cannot be negative"),
  currency: z
    .string()
    .length(3, "Currency must be a 3-letter code")
    .default("USD")
    .transform((c) => c.toUpperCase()),
  billingInterval: z
    .enum(["month", "year", "lifetime", "one_time"])
    .default("month"),
  trialDays: z
    .number()
    .int("Trial days must be an integer")
    .min(0, "Trial days cannot be negative")
    .default(0),
  provider: z.string().optional().nullable(),
  providerPriceId: z.string().optional().nullable(),
  entitlements: entitlementsSchema.default({
    "job-xray": { runs: 50 },
  }),
  isActive: z.boolean().default(true),
});

export const updatePlanFormSchema = planFormSchema.partial().extend({
  id: z.string().uuid("Invalid plan ID"),
});

export type PlanFormValues = z.infer<typeof planFormSchema>;
export type UpdatePlanFormValues = z.infer<typeof updatePlanFormSchema>;
export type PlanEntitlements = z.infer<typeof entitlementsSchema>;
