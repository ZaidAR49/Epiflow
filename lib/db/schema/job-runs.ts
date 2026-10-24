import { pgTable, uuid, text, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { users } from "./users";
import { workflows } from "./workflows";
import { runStatusEnum } from "./enums";

export const jobRuns = pgTable(
  "job_runs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    workflowId: uuid("workflow_id")
      .notNull()
      .references(() => workflows.id, { onDelete: "restrict" }),
    channel: text("channel").notNull().default("web"),
    status: runStatusEnum("status").default("pending").notNull(),
    input: jsonb("input").default({}).notNull(),
    output: jsonb("output"),
    usage: jsonb("usage"),
    errorCode: text("error_code"),
    errorMessage: text("error_message"),
    usageConsumedAt: timestamp("usage_consumed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_job_runs_user_created").on(table.userId, table.createdAt),
    index("idx_job_runs_workflow_created").on(table.workflowId, table.createdAt),
    index("idx_job_runs_created_at").on(table.createdAt),
    index("idx_job_runs_active").on(table.createdAt),
  ]
);

export type JobRun = typeof jobRuns.$inferSelect;
export type NewJobRun = typeof jobRuns.$inferInsert;
