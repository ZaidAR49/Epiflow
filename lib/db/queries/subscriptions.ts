import "server-only";
import { sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from "../client";
import { getPlanById } from "./plans";

export interface SubscriptionWithDetails {
  id: string;
  userId: string;
  userName: string;
  userEmail: string | null;
  planId: string;
  planCode: string;
  planName: string;
  planPriceMinor: number;
  planCurrency: string;
  billingInterval: string;
  status: string;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  canceledAt: Date | null;
  provider: string;
  providerSubscriptionId: string;
  createdAt: Date;
}

export interface SubscriptionStats {
  activeCount: number;
  trialingCount: number;
  canceledCount: number;
  mrrMinor: number;
}

type RawSubscriptionRow = {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string | null;
  plan_id: string;
  plan_code: string;
  plan_name: string;
  price_minor: number;
  currency: string;
  billing_interval: string;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  provider: string;
  provider_subscription_id: string;
  created_at: string;
};

function mapSubscriptionRow(row: RawSubscriptionRow): SubscriptionWithDetails {
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name,
    userEmail: row.user_email,
    planId: row.plan_id,
    planCode: row.plan_code,
    planName: row.plan_name,
    planPriceMinor: Number(row.price_minor),
    planCurrency: row.currency,
    billingInterval: row.billing_interval,
    status: row.status,
    currentPeriodStart: row.current_period_start ? new Date(row.current_period_start) : null,
    currentPeriodEnd: row.current_period_end ? new Date(row.current_period_end) : null,
    cancelAtPeriodEnd: Boolean(row.cancel_at_period_end),
    canceledAt: row.canceled_at ? new Date(row.canceled_at) : null,
    provider: row.provider,
    providerSubscriptionId: row.provider_subscription_id,
    createdAt: new Date(row.created_at),
  };
}

/**
 * Retrieves all subscriptions with user and plan details for admin view.
 */
export async function getAllSubscriptions(): Promise<SubscriptionWithDetails[]> {
  const result = await db.execute<RawSubscriptionRow>(sql`
    SELECT
      s.id, s.user_id, u.full_name AS user_name, u.email AS user_email,
      s.plan_id, p.code AS plan_code, p.name AS plan_name,
      p.price_minor, p.currency, p.billing_interval, s.status,
      s.current_period_start, s.current_period_end, s.cancel_at_period_end,
      s.canceled_at, s.provider, s.provider_subscription_id, s.created_at
    FROM public.subscriptions s
    JOIN public.users u ON u.id = s.user_id
    JOIN public.plans p ON p.id = s.plan_id
    ORDER BY s.created_at DESC;
  `);

  return result.map(mapSubscriptionRow);
}

/**
 * Retrieves the current active or trialing subscription for a specific user.
 */
export async function getUserSubscription(
  userId: string
): Promise<SubscriptionWithDetails | null> {
  const result = await db.execute<RawSubscriptionRow>(sql`
    SELECT
      s.id, s.user_id, u.full_name AS user_name, u.email AS user_email,
      s.plan_id, p.code AS plan_code, p.name AS plan_name,
      p.price_minor, p.currency, p.billing_interval, s.status,
      s.current_period_start, s.current_period_end, s.cancel_at_period_end,
      s.canceled_at, s.provider, s.provider_subscription_id, s.created_at
    FROM public.subscriptions s
    JOIN public.users u ON u.id = s.user_id
    JOIN public.plans p ON p.id = s.plan_id
    WHERE s.user_id = ${userId}::uuid
      AND s.status IN ('active', 'trialing')
    ORDER BY s.created_at DESC
    LIMIT 1;
  `);

  const row = result[0];
  if (!row) return null;
  return mapSubscriptionRow(row);
}

/**
 * Creates a mock subscription and activates plan entitlements via DB RPC.
 */
export async function createMockSubscription(
  userId: string,
  planId: string,
  periodDays = 30
): Promise<{ subscriptionId: string }> {
  const plan = await getPlanById(planId);
  if (!plan) throw new Error("Plan not found");

  const subId = randomUUID();
  const providerSubId = `mock_sub_${randomUUID()}`;
  const paymentId = `mock_pay_${randomUUID()}`;

  const periodInterval = `${periodDays} days`;

  // 1. Insert subscription
  await db.execute(sql`
    INSERT INTO public.subscriptions (
      id, user_id, plan_id, status,
      current_period_start, current_period_end,
      provider, provider_subscription_id
    )
    VALUES (
      ${subId}::uuid,
      ${userId}::uuid,
      ${planId}::uuid,
      'active',
      now(),
      now() + ${periodInterval}::interval,
      'mock',
      ${providerSubId}
    );
  `);

  // 2. Insert mock payment into immutable ledger
  await db.execute(sql`
    INSERT INTO public.payments (
      user_id, plan_id, subscription_id,
      provider, provider_payment_id,
      amount_minor, currency
    )
    VALUES (
      ${userId}::uuid,
      ${planId}::uuid,
      ${subId}::uuid,
      'mock',
      ${paymentId},
      ${plan.priceMinor},
      ${plan.currency}
    );
  `);

  // 3. Apply entitlements via DB RPC
  await db.execute(sql`
    SELECT public.apply_plan_entitlements(
      ${userId}::uuid,
      ${planId}::uuid,
      ${subId}::uuid,
      (now() + ${periodInterval}::interval)
    );
  `);

  return { subscriptionId: subId };
}

/**
 * Cancels a subscription and revokes workflow entitlements via DB RPC.
 */
export async function cancelSubscription(subscriptionId: string): Promise<boolean> {
  const result = await db.execute<{ updated: boolean }>(sql`
    UPDATE public.subscriptions
    SET status = 'canceled',
        canceled_at = now(),
        updated_at = now()
    WHERE id = ${subscriptionId}::uuid
    RETURNING true AS updated;
  `);

  if (!result[0]?.updated) return false;

  await db.execute(sql`
    SELECT public.revoke_subscription_access(${subscriptionId}::uuid);
  `);

  return true;
}

/**
 * Aggregates subscription statistics for admin overview.
 */
export async function getSubscriptionStats(): Promise<SubscriptionStats> {
  const result = await db.execute<{
    active_count: string;
    trialing_count: string;
    canceled_count: string;
    mrr_minor: string;
  }>(sql`
    SELECT
      COUNT(*) FILTER (WHERE s.status = 'active')::text AS active_count,
      COUNT(*) FILTER (WHERE s.status = 'trialing')::text AS trialing_count,
      COUNT(*) FILTER (WHERE s.status = 'canceled')::text AS canceled_count,
      COALESCE(SUM(p.price_minor) FILTER (WHERE s.status = 'active'), 0)::text AS mrr_minor
    FROM public.subscriptions s
    JOIN public.plans p ON p.id = s.plan_id;
  `);

  const row = result[0];
  return {
    activeCount: Number(row?.active_count || 0),
    trialingCount: Number(row?.trialing_count || 0),
    canceledCount: Number(row?.canceled_count || 0),
    mrrMinor: Number(row?.mrr_minor || 0),
  };
}
