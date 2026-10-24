import {
  pgTable,
  uuid,
  text,
  integer,
  char,
  timestamp,
  index,
  unique,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { plans } from "./plans";
import { subscriptions } from "./subscriptions";

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    planId: uuid("plan_id").references(() => plans.id),
    subscriptionId: uuid("subscription_id").references(() => subscriptions.id),
    provider: text("provider").notNull(),
    providerPaymentId: text("provider_payment_id").notNull(),
    amountMinor: integer("amount_minor").notNull(),
    currency: char("currency", { length: 3 }).notNull(),
    status: text("status").notNull(),
    refundedMinor: integer("refunded_minor").default(0).notNull(),
    failureCode: text("failure_code"),
    failureMessage: text("failure_message"),
    receiptUrl: text("receipt_url"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    unique("payments_provider_provider_payment_id_key").on(
      table.provider,
      table.providerPaymentId
    ),
    index("idx_payments_user_created").on(table.userId, table.createdAt),
    index("idx_payments_plan_id").on(table.planId),
    index("idx_payments_subscription_id").on(table.subscriptionId),
  ]
);

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
