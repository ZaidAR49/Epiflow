import "server-only";
import { sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from "../client";
import { getPlanByCode, createPlan, type Plan } from "./plans";
import { getUserSubscription } from "./subscriptions";

/**
 * Retrieves the system default Free plan.
 * Auto-heals and seeds the free plan if it is ever missing.
 */
export async function getDefaultFreePlan(): Promise<Plan> {
  const existing = await getPlanByCode("free");
  if (existing) {
    return existing;
  }

  // Auto-heal seed if deleted or in a fresh database
  return createPlan({
    code: "free",
    name: "Free",
    priceMinor: 0,
    currency: "USD",
    billingInterval: "month",
    trialDays: 0,
    provider: "system",
    providerPriceId: null,
    entitlements: { "job-xray": { runs: 5, ai_tokens: null } },
    isActive: true,
  });
}

/**
 * Ensures a user is enrolled in the default Free plan.
 * Idempotent: does nothing if the user already holds an active/trialing subscription.
 * Preserves any existing usage counters via ON CONFLICT DO NOTHING.
 */
export async function ensureUserFreeSubscription(userId: string): Promise<string> {
  // 1. Return immediately if user already has an active subscription
  const existingSub = await getUserSubscription(userId);
  if (existingSub) {
    return existingSub.id;
  }

  // 2. Resolve default Free plan
  const freePlan = await getDefaultFreePlan();
  const subId = randomUUID();
  const providerSubId = `system_free_${userId}`;

  // 3. Upsert system subscription
  await db.execute(sql`
    INSERT INTO public.subscriptions (
      id, user_id, plan_id, status,
      current_period_start, current_period_end,
      provider, provider_subscription_id
    )
    VALUES (
      ${subId}::uuid,
      ${userId}::uuid,
      ${freePlan.id}::uuid,
      'active',
      now(),
      now() + interval '100 years',
      'system',
      ${providerSubId}
    )
    ON CONFLICT (provider, provider_subscription_id) DO NOTHING;
  `);

  const activeSubRows = await db.execute<{ id: string }>(sql`
    SELECT id FROM public.subscriptions
    WHERE user_id = ${userId}::uuid AND plan_id = ${freePlan.id}::uuid
      AND status IN ('active', 'trialing')
    LIMIT 1;
  `);
  const effectiveSubId = activeSubRows[0]?.id ?? subId;

  // 4. Provision workflow access and meter entitlements from the Free plan definition
  const entitlements = (freePlan.entitlements || {}) as Record<string, Record<string, number | null>>;

  for (const [wfSlug, meters] of Object.entries(entitlements)) {
    await db.execute(sql`
      INSERT INTO public.user_workflow_access (
        user_id, workflow_id, granted_via, subscription_id, expires_at, metadata
      )
      SELECT
        ${userId}::uuid,
        w.id,
        'payment',
        ${effectiveSubId}::uuid,
        now() + interval '100 years',
        jsonb_build_object('sendEmail', true, 'preferred_language', 'ar')
      FROM public.workflows w
      WHERE w.slug = ${wfSlug}::text
      ON CONFLICT (user_id, workflow_id) DO UPDATE
        SET subscription_id = COALESCE(public.user_workflow_access.subscription_id, EXCLUDED.subscription_id);
    `);

    const period = freePlan.billingInterval === "month" ? "monthly" : "lifetime";

    for (const [meterKey, limitVal] of Object.entries(meters)) {
      await db.execute(sql`
        INSERT INTO public.access_usage (
          user_id, workflow_id, meter_id, used, limit_value, period, period_start
        )
        SELECT
          ${userId}::uuid,
          w.id,
          m.id,
          0,
          ${limitVal},
          ${period},
          now()
        FROM public.workflows w
        CROSS JOIN public.usage_meters m
        WHERE w.slug = ${wfSlug}::text AND m.key = ${meterKey}::text
        ON CONFLICT (user_id, workflow_id, meter_id) DO NOTHING;
      `);
    }
  }

  return effectiveSubId;
}

/**
 * Backfills active free plan subscriptions for any existing users without one.
 */
export async function backfillFreeSubscriptionsForAllUsers(): Promise<number> {
  const unassigned = await db.execute<{ id: string }>(sql`
    SELECT u.id
    FROM public.users u
    WHERE NOT EXISTS (
      SELECT 1 FROM public.subscriptions s
      WHERE s.user_id = u.id AND s.status IN ('active', 'trialing')
    );
  `);

  let count = 0;
  for (const row of unassigned) {
    await ensureUserFreeSubscription(row.id);
    count++;
  }
  return count;
}
