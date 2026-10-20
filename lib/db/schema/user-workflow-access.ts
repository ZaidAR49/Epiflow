import {
  pgTable,
  uuid,
  integer,
  timestamp,
  jsonb,
  primaryKey,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { workflows } from "./workflows";

export const userWorkflowAccess = pgTable(
  "user_workflow_access",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    workflowId: uuid("workflow_id")
      .notNull()
      .references(() => workflows.id, { onDelete: "cascade" }),
    usageCount: integer("usage_count").default(0).notNull(),
    usageLimit: integer("usage_limit"), // null = unlimited
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    grantedAt: timestamp("granted_at", { withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    metadata: jsonb("metadata").default({}),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.workflowId] }),
    index("idx_user_workflow_access_workflow_id").on(table.workflowId),
  ]
);

export type UserWorkflowAccess = typeof userWorkflowAccess.$inferSelect;
export type NewUserWorkflowAccess = typeof userWorkflowAccess.$inferInsert;
