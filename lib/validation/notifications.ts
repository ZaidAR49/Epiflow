import { z } from "zod";

export const announcementTypeEnum = z.enum([
  "update",
  "maintenance",
  "message",
  "changelog",
]);

export const announcementSeverityEnum = z.enum(["info", "warning", "critical"]);

export const createAnnouncementSchema = z
  .object({
    type: announcementTypeEnum,
    severity: announcementSeverityEnum.default("info"),
    titleAr: z.string().trim().max(250).nullable().optional(),
    titleEn: z.string().trim().max(250).nullable().optional(),
    bodyAr: z.string().trim().max(2000).nullable().optional(),
    bodyEn: z.string().trim().max(2000).nullable().optional(),
    isActive: z.boolean().default(true),
    startsAt: z
      .string()
      .optional()
      .transform((val) => (val ? new Date(val) : new Date())),
    endsAt: z
      .string()
      .nullable()
      .optional()
      .transform((val) => (val ? new Date(val) : null)),
  })
  .refine(
    (data) => {
      const hasAr = Boolean(data.titleAr && data.titleAr.trim().length > 0);
      const hasEn = Boolean(data.titleEn && data.titleEn.trim().length > 0);
      return hasAr || hasEn;
    },
    {
      message: "At least one headline (Arabic or English) must be provided",
      path: ["titleEn"],
    }
  )
  .refine(
    (data) => {
      if (!data.endsAt || !data.startsAt) return true;
      return data.endsAt.getTime() > data.startsAt.getTime();
    },
    {
      message: "End time must be after start time",
      path: ["endsAt"],
    }
  );

export type CreateAnnouncementInput = z.input<typeof createAnnouncementSchema>;
export type CreateAnnouncementOutput = z.output<typeof createAnnouncementSchema>;

export const updateAnnouncementSchema = z
  .object({
    id: z.string().uuid(),
    type: announcementTypeEnum,
    severity: announcementSeverityEnum,
    titleAr: z.string().trim().max(250).nullable().optional(),
    titleEn: z.string().trim().max(250).nullable().optional(),
    bodyAr: z.string().trim().max(2000).nullable().optional(),
    bodyEn: z.string().trim().max(2000).nullable().optional(),
    isActive: z.boolean(),
    startsAt: z
      .string()
      .optional()
      .transform((val) => (val ? new Date(val) : new Date())),
    endsAt: z
      .string()
      .nullable()
      .optional()
      .transform((val) => (val ? new Date(val) : null)),
  })
  .refine(
    (data) => {
      const hasAr = Boolean(data.titleAr && data.titleAr.trim().length > 0);
      const hasEn = Boolean(data.titleEn && data.titleEn.trim().length > 0);
      return hasAr || hasEn;
    },
    {
      message: "At least one headline (Arabic or English) must be provided",
      path: ["titleEn"],
    }
  );

export type UpdateAnnouncementInput = z.input<typeof updateAnnouncementSchema>;
export type UpdateAnnouncementOutput = z.output<typeof updateAnnouncementSchema>;

export const toggleAnnouncementSchema = z.object({
  id: z.string().uuid(),
  isActive: z.boolean(),
});

export const deleteAnnouncementSchema = z.object({
  id: z.string().uuid(),
});

export const sendNotificationSchema = z
  .object({
    recipientMode: z.enum(["broadcast", "single"]).default("broadcast"),
    userId: z.string().uuid().optional(),
    type: z.string().min(1, "Event type is required").max(50).toLowerCase().trim(),
    title: z.string().trim().min(1, "Title cannot be empty").max(200),
    body: z.string().trim().max(2000).nullable().optional(),
    link: z
      .string()
      .trim()
      .nullable()
      .optional()
      .refine(
        (val) => {
          if (!val) return true;
          return val.startsWith("/") || val.startsWith("https://");
        },
        { message: "Link must start with / or https://" }
      ),
  })
  .refine(
    (data) => {
      if (data.recipientMode === "single" && !data.userId) {
        return false;
      }
      return true;
    },
    {
      message: "Recipient user must be selected for single-user notifications",
      path: ["userId"],
    }
  );

export type SendNotificationInput = z.input<typeof sendNotificationSchema>;
export type SendNotificationOutput = z.output<typeof sendNotificationSchema>;

export const markNotificationReadSchema = z.object({
  notificationId: z.string().uuid(),
});

export const deleteNotificationSchema = z.object({
  notificationId: z.string().uuid(),
});

export type DeleteNotificationInput = z.infer<typeof deleteNotificationSchema>;
