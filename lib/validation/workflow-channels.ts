import { z } from "zod";

export const saveWorkflowChannelSchema = z.object({
  workflowId: z.string().uuid(),
  channel: z
    .string()
    .min(1, "Channel type is required")
    .max(50)
    .toLowerCase()
    .trim(),
  handle: z
    .string()
    .transform((val) => {
      let cleaned = val.trim();
      cleaned = cleaned.replace(/^https?:\/\/t\.me\//i, "");
      cleaned = cleaned.replace(/^t\.me\//i, "");
      cleaned = cleaned.replace(/^@/, "");
      cleaned = cleaned.replace(/\/+$/, "");
      return cleaned.trim();
    })
    .pipe(z.string().min(1, "Handle cannot be empty").max(100)),
  url: z
    .string()
    .nullable()
    .optional()
    .transform((val) => {
      if (!val) return null;
      const trimmed = val.trim();
      if (!trimmed) return null;
      if (trimmed.startsWith("@")) {
        return `https://t.me/${trimmed.slice(1)}`;
      }
      if (trimmed.startsWith("t.me/") || trimmed.startsWith("wa.me/")) {
        return `https://${trimmed}`;
      }
      return trimmed;
    })
    .refine(
      (val) => {
        if (!val) return true;
        try {
          const u = new URL(val);
          return u.protocol === "http:" || u.protocol === "https:";
        } catch {
          return false;
        }
      },
      { message: "Must be a valid URL" }
    ),
  isActive: z.boolean().default(true),
});

export type SaveWorkflowChannelInput = z.input<typeof saveWorkflowChannelSchema>;
export type SaveWorkflowChannelOutput = z.output<typeof saveWorkflowChannelSchema>;

export const deleteWorkflowChannelSchema = z.object({
  channelId: z.string().uuid(),
  workflowId: z.string().uuid(),
});

export type DeleteWorkflowChannelInput = z.infer<typeof deleteWorkflowChannelSchema>;
