import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";
import { users } from "./users";

export const userNotifications = pgTable(
  "user_notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    type: text("type").notNull(),
    title: text("title").notNull(),
    body: text("body"),
    link: text("link"),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_user_notifications_user_created").on(table.userId, table.createdAt.desc()),
  ]
);

export type UserNotification = typeof userNotifications.$inferSelect;
export type NewUserNotification = typeof userNotifications.$inferInsert;
