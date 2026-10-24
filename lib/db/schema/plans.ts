import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  char,
  index,
} from "drizzle-orm/pg-core";

export const plans = pgTable(
  "plans",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    code: text("code").notNull().unique(),
    name: text("name").notNull(),
    priceMinor: integer("price_minor").notNull(),
    currency: char("currency", { length: 3 }).default("USD").notNull(),
    billingInterval: text("billing_interval").notNull(),
    trialDays: integer("trial_days").default(0).notNull(),
    provider: text("provider"),
    providerPriceId: text("provider_price_id"),
    entitlements: jsonb("entitlements").default({}).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_plans_is_active").on(table.isActive),
  ]
);

export type Plan = typeof plans.$inferSelect;
export type NewPlan = typeof plans.$inferInsert;
