import { z } from "zod";

export const updateWorkflowSchema = z.object({
  workflowId: z.string().uuid(),
  isActive: z.boolean().optional(),
  imageUrl: z.string().url().or(z.literal("")).nullable().optional(),
  name: z.string().min(1).max(100).optional(),
});

export type UpdateWorkflowInput = z.infer<typeof updateWorkflowSchema>;

export const updateUserStatusSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["admin", "user", "guest"]).optional(),
  status: z.enum(["pending", "approved", "rejected", "locked"]).optional(),
});

export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;

export const updateUserQuotaSchema = z.object({
  userId: z.string().uuid(),
  workflowSlug: z.string().default("job-xray"),
  usageLimit: z.number().int().min(0).nullable().optional(),
  resetCount: z.boolean().optional(),
});

export type UpdateUserQuotaInput = z.infer<typeof updateUserQuotaSchema>;

export const deleteUserSchema = z.object({
  userId: z.string().uuid(),
});

export type DeleteUserInput = z.infer<typeof deleteUserSchema>;
