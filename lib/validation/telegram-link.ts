import { z } from "zod";

export const manualTelegramLinkSchema = z.object({
  telegramId: z.coerce
    .number()
    .int("Telegram ID must be an integer")
    .positive("Telegram ID must be a positive number"),
  username: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((val) => {
      if (!val) return null;
      return val.replace(/^@+/, "").trim() || null;
    }),
});

export type ManualTelegramLinkInput = z.input<typeof manualTelegramLinkSchema>;
export type ManualTelegramLinkOutput = z.infer<typeof manualTelegramLinkSchema>;
