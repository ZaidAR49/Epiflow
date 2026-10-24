import { z } from "zod";

export const assignPlanSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  planId: z.string().uuid("Invalid plan ID"),
  periodDays: z.number().int().min(1).default(30),
});

export const cancelSubscriptionSchema = z.object({
  subscriptionId: z.string().uuid("Invalid subscription ID"),
});

export type AssignPlanInput = z.infer<typeof assignPlanSchema>;
export type CancelSubscriptionInput = z.infer<typeof cancelSubscriptionSchema>;
