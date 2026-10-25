import "server-only";
import { sql, eq } from "drizzle-orm";
import { db } from "../client";
import { plans, type Plan, type NewPlan } from "../schema/plans";

export type { Plan, NewPlan };

export interface PlanWithSubscriberCount extends Plan {
  activeSubscriptionsCount: number;
}

/**
 * Retrieves all plans ordered by creation date (for admin).
 */
export async function getAllPlans(): Promise<PlanWithSubscriberCount[]> {
  const result = await db.execute<{
    id: string;
    code: string;
    name: string;
    price_minor: number;
    currency: string;
    billing_interval: string;
    trial_days: number;
    provider: string | null;
    provider_price_id: string | null;
    entitlements: Record<string, Record<string, number | null>>;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    subscribers_count: string;
  }>(sql`
    SELECT
      p.id,
      p.code,
      p.name,
      p.price_minor,
      p.currency,
      p.billing_interval,
      p.trial_days,
      p.provider,
      p.provider_price_id,
      p.entitlements,
      p.is_active,
      p.created_at,
      p.updated_at,
      (
        SELECT COUNT(*)::text
        FROM public.subscriptions s
        WHERE s.plan_id = p.id AND s.status IN ('active', 'trialing')
      ) AS subscribers_count
    FROM public.plans p
    ORDER BY p.price_minor ASC, p.created_at ASC;
  `);

  return result.map((row) => ({
    id: row.id,
    code: row.code,
    name: row.name,
    priceMinor: Number(row.price_minor),
    currency: row.currency,
    billingInterval: row.billing_interval,
    trialDays: Number(row.trial_days || 0),
    provider: row.provider,
    providerPriceId: row.provider_price_id,
    entitlements: row.entitlements || {},
    isActive: Boolean(row.is_active),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    activeSubscriptionsCount: Number(row.subscribers_count || 0),
  }));
}

/**
 * Retrieves active plans for public pricing display.
 */
export async function getActivePlans(): Promise<Plan[]> {
  return db
    .select()
    .from(plans)
    .where(eq(plans.isActive, true))
    .orderBy(plans.priceMinor);
}

/**
 * Retrieves a single plan by ID.
 */
export async function getPlanById(id: string): Promise<Plan | null> {
  const result = await db
    .select()
    .from(plans)
    .where(eq(plans.id, id))
    .limit(1);
  return result[0] ?? null;
}

/**
 * Retrieves a single plan by code.
 */
export async function getPlanByCode(code: string): Promise<Plan | null> {
  const result = await db
    .select()
    .from(plans)
    .where(eq(plans.code, code))
    .limit(1);
  return result[0] ?? null;
}

/**
 * Creates a new plan.
 */
export async function createPlan(data: NewPlan): Promise<Plan> {
  const result = await db.insert(plans).values(data).returning();
  const created = result[0];
  if (!created) {
    throw new Error("Failed to insert plan");
  }
  return created;
}

/**
 * Updates an existing plan.
 */
export async function updatePlan(
  id: string,
  patch: Partial<Omit<NewPlan, "id" | "createdAt">>
): Promise<Plan | null> {
  const result = await db
    .update(plans)
    .set({
      ...patch,
      updatedAt: new Date(),
    })
    .where(eq(plans.id, id))
    .returning();

  return result[0] ?? null;
}

/**
 * Toggles a plan's active status.
 */
export async function togglePlanActive(id: string): Promise<Plan | null> {
  const existing = await getPlanById(id);
  if (!existing) return null;

  return updatePlan(id, { isActive: !existing.isActive });
}
