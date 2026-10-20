import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { workflows } from "./workflows";
import { credentialAuthTypeEnum, credentialStatusEnum } from "./enums";

export const workflowCredentials = pgTable(
  "workflow_credentials",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    workflowId: uuid("workflow_id")
      .notNull()
      .references(() => workflows.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    authType: credentialAuthTypeEnum("auth_type").notNull(),
    secretId: uuid("secret_id").notNull().unique(),
    scopes: text("scopes").array().notNull().default([]),
    publicInfo: jsonb("public_info").default({}),
    status: credentialStatusEnum("status").default("active").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    lastRefreshedAt: timestamp("last_refreshed_at", { withTimezone: true }),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("idx_workflow_credentials_unique").on(
      table.userId,
      table.workflowId,
      table.provider
    ),
  ]
);

export type WorkflowCredential = typeof workflowCredentials.$inferSelect;
export type NewWorkflowCredential = typeof workflowCredentials.$inferInsert;
