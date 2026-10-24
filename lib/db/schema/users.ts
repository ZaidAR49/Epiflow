import { pgTable, uuid, text, timestamp, boolean, index } from "drizzle-orm/pg-core";
import { userRoleEnum, accessStatusEnum } from "./enums";

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    fullName: text("full_name").notNull(),
    reasonForAccess: text("reason_for_access"),
    role: userRoleEnum("role").default("user").notNull(),
    status: accessStatusEnum("status").default("pending").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    preferredLanguage: text("preferred_language").default("ar"),
    email: text("email").unique(),
    emailVerified: boolean("email_verified").default(false).notNull(),
  },
  (table) => [
    index("idx_users_pending").on(table.createdAt),
    index("idx_users_email").on(table.email),
  ]
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
