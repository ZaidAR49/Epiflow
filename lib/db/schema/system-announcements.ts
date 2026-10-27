import { pgTable, uuid, text, timestamp, boolean, primaryKey } from "drizzle-orm/pg-core";
import { users } from "./users";

export type AnnouncementType = "update" | "maintenance" | "message" | "changelog";
export type AnnouncementSeverity = "info" | "warning" | "critical";

export const systemAnnouncements = pgTable(
  "system_announcements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    type: text("type").notNull(),
    titleAr: text("title_ar"),
    titleEn: text("title_en"),
    bodyAr: text("body_ar"),
    bodyEn: text("body_en"),
    severity: text("severity").default("info").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }).defaultNow().notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  }
);

export const systemAnnouncementReads = pgTable(
  "system_announcement_reads",
  {
    announcementId: uuid("announcement_id")
      .notNull()
      .references(() => systemAnnouncements.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    readAt: timestamp("read_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.announcementId, table.userId] }),
  ]
);

export type SystemAnnouncement = typeof systemAnnouncements.$inferSelect;
export type NewSystemAnnouncement = typeof systemAnnouncements.$inferInsert;
export type SystemAnnouncementRead = typeof systemAnnouncementReads.$inferSelect;
