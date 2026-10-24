import {
  pgTable,
  uuid,
  timestamp,
  jsonb,
  primaryKey,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { workflows } from "./workflows";
import { accessGrantSourceEnum } from "./enums";

export const userWorkflowAccess = pgTable(
  "user_workflow_access",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    workflowId: uuid("workflow_id")
      .notNull()
      .references(() => workflows.id, { onDelete: "cascade" }),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    grantedAt: timestamp("granted_at", { withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    metadata: jsonb("metadata").default({}),
    grantedVia: accessGrantSourceEnum("granted_via").default("admin").notNull(),
    subscriptionId: uuid("subscription_id"),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.workflowId] }),
    index("idx_user_workflow_access_workflow_id").on(table.workflowId),
    index("idx_user_workflow_access_expires_at").on(table.expiresAt),
    index("idx_user_workflow_access_subscription_id").on(table.subscriptionId),
  ]
);

export type UserWorkflowAccess = typeof userWorkflowAccess.$inferSelect;
export type NewUserWorkflowAccess = typeof userWorkflowAccess.$inferInsert;
