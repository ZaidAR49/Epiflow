import { pgTable, uuid, text, boolean, timestamp, unique } from "drizzle-orm/pg-core";
import { workflows } from "./workflows";

export const workflowChannels = pgTable(
  "workflow_channels",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workflowId: uuid("workflow_id")
      .notNull()
      .references(() => workflows.id, { onDelete: "cascade" }),
    channel: text("channel").notNull(),
    handle: text("handle").notNull(),
    url: text("url"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    unique("uq_workflow_channel").on(table.workflowId, table.channel),
  ]
);

export type WorkflowChannel = typeof workflowChannels.$inferSelect;
export type NewWorkflowChannel = typeof workflowChannels.$inferInsert;
