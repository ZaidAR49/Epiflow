import { pgTable, uuid, bigint, text, timestamp, boolean, index } from "drizzle-orm/pg-core";
import { userRoleEnum, accessStatusEnum } from "./enums";

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    telegramId: bigint("telegram_id", { mode: "number" }).unique(),
    username: text("username"),
    fullName: text("full_name").notNull(),
    email: text("email").unique(),
    emailVerified: boolean("email_verified").default(false).notNull(),
    image: text("image"),
    reasonForAccess: text("reason_for_access"),
    role: userRoleEnum("role").default("user").notNull(),
    status: accessStatusEnum("status").default("pending").notNull(),
    preferredLanguage: text("preferred_language").default("ar"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_users_status").on(table.status),
    index("idx_users_username").on(table.username),
    index("idx_users_email").on(table.email),
  ]
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
