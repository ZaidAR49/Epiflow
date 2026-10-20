import { pgTable, uuid, text, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { users } from "./users";
import { runStatusEnum } from "./enums";

export const jobRuns = pgTable(
  "job_runs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    channel: text("channel").notNull().default("web"), // 'web' | 'telegram'
    url: text("url").notNull(),
    normalizedUrl: text("normalized_url").notNull(),
    status: runStatusEnum("status").default("pending").notNull(),
    postData: jsonb("post_data"),
    authorData: jsonb("author_data"),
    companyData: jsonb("company_data"),
    report: jsonb("report"),
    telegramReport: text("telegram_report"),
    errorCode: text("error_code"),
    errorMessage: text("error_message"),
    usageConsumedAt: timestamp("usage_consumed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_job_runs_user_id").on(table.userId),
    index("idx_job_runs_status").on(table.status),
    index("idx_job_runs_normalized_url").on(table.normalizedUrl),
    index("idx_job_runs_created_at").on(table.createdAt),
  ]
);

export type JobRun = typeof jobRuns.$inferSelect;
export type NewJobRun = typeof jobRuns.$inferInsert;
