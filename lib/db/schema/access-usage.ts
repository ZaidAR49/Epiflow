import {
  pgTable,
  uuid,
  bigint,
  text,
  timestamp,
  primaryKey,
  index,
} from "drizzle-orm/pg-core";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { users } from "./users";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { workflows } from "./workflows";
import { usageMeters } from "./usage-meters";

export const accessUsage = pgTable(
  "access_usage",
  {
    userId: uuid("user_id").notNull(),
    workflowId: uuid("workflow_id").notNull(),
    meterId: uuid("meter_id")
      .notNull()
      .references(() => usageMeters.id),
    used: bigint("used", { mode: "number" }).default(0).notNull(),
    limitValue: bigint("limit_value", { mode: "number" }),
    period: text("period").default("lifetime").notNull(),
    periodStart: timestamp("period_start", { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.workflowId, table.meterId] }),
    index("idx_access_usage_meter_id").on(table.meterId),
  ]
);

export type AccessUsage = typeof accessUsage.$inferSelect;
export type NewAccessUsage = typeof accessUsage.$inferInsert;
