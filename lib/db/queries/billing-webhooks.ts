import "server-only";

import { sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from "../client";
import { logger } from "@/lib/logger";

export interface SyncSubscriptionParams {
  providerSubscriptionId: string;
  status: string;
  currentPeriodStart?: Date | null;
  currentPeriodEnd?: Date | null;
  cancelAtPeriodEnd?: boolean;
  userId?: string | null;
  planId?: string | null;
}

export interface RecordPaymentParams {
  userId: string;
  planId?: string | null;
  subscriptionId?: string | null;
  providerPaymentId: string;
  amountMinor: number;
  currency: string;
  status: string;
  receiptUrl?: string | null;
  paidAt?: Date | null;
}

/**
 * Syncs Lemon Squeezy subscription state into database and applies/revokes entitlements.
 */
export async function syncLemonSqueezySubscription(
  params: SyncSubscriptionParams
): Promise<{ subscriptionId: string } | null> {
  const provider = "lemonsqueezy";

  // Check if subscription exists
  const existing = await db.execute<{
    id: string;
    user_id: string;
    plan_id: string;
  }>(sql`
    SELECT id, user_id, plan_id
    FROM public.subscriptions
    WHERE provider = ${provider}
      AND provider_subscription_id = ${params.providerSubscriptionId}
    LIMIT 1;
  `);

  let subId: string;
  let userId: string;
  let planId: string;

  if (existing[0]) {
    subId = existing[0].id;
    userId = existing[0].user_id;
    planId = existing[0].plan_id;

    // Update existing subscription
    await db.execute(sql`
      UPDATE public.subscriptions
      SET
        status = ${params.status},
        current_period_start = ${params.currentPeriodStart ? params.currentPeriodStart.toISOString() : null}::timestamptz,
        current_period_end = ${params.currentPeriodEnd ? params.currentPeriodEnd.toISOString() : null}::timestamptz,
        cancel_at_period_end = ${Boolean(params.cancelAtPeriodEnd)},
        canceled_at = CASE WHEN ${params.status} = 'canceled' THEN now() ELSE canceled_at END,
        updated_at = now()
      WHERE id = ${subId}::uuid;
    `);
  } else {
    // New subscription: must have userId and planId from custom_data
    if (!params.userId || !params.planId) {
      logger.warn(
        { providerSubscriptionId: params.providerSubscriptionId },
        "[BillingWebhook] Missing userId or planId for new Lemon Squeezy subscription"
      );
      return null;
    }

    subId = randomUUID();
    userId = params.userId;
    planId = params.planId;

    await db.execute(sql`
      INSERT INTO public.subscriptions (
        id, user_id, plan_id, status,
        current_period_start, current_period_end,
        cancel_at_period_end, provider, provider_subscription_id
      )
      VALUES (
        ${subId}::uuid,
        ${userId}::uuid,
        ${planId}::uuid,
        ${params.status},
        ${params.currentPeriodStart ? params.currentPeriodStart.toISOString() : null}::timestamptz,
        ${params.currentPeriodEnd ? params.currentPeriodEnd.toISOString() : null}::timestamptz,
        ${Boolean(params.cancelAtPeriodEnd)},
        ${provider},
        ${params.providerSubscriptionId}
      )
      ON CONFLICT (provider, provider_subscription_id) DO UPDATE
      SET
        status = EXCLUDED.status,
        current_period_start = EXCLUDED.current_period_start,
        current_period_end = EXCLUDED.current_period_end,
        cancel_at_period_end = EXCLUDED.cancel_at_period_end,
        updated_at = now();
    `);
  }

  // Enforce workflow access via stored RPCs
  if (params.status === "active" || params.status === "trialing") {
    try {
      const expiresAt = params.currentPeriodEnd
        ? params.currentPeriodEnd.toISOString()
        : null;

      await db.execute(sql`
        SELECT public.apply_plan_entitlements(
          ${userId}::uuid,
          ${planId}::uuid,
          ${subId}::uuid,
          ${expiresAt}::timestamptz
        );
      `);
      logger.info(
        { userId, planId, subId, status: params.status },
        "[BillingWebhook] Applied plan entitlements successfully"
      );
    } catch (rpcErr) {
      logger.error(
        { err: rpcErr, userId, planId, subId },
        "[BillingWebhook] Failed to execute apply_plan_entitlements"
      );
    }
  } else if (params.status === "canceled" || params.status === "expired") {
    try {
      await db.execute(sql`
        SELECT public.revoke_subscription_access(${subId}::uuid);
      `);
      logger.info(
        { subId, status: params.status },
        "[BillingWebhook] Revoked subscription access successfully"
      );
    } catch (rpcErr) {
      logger.error(
        { err: rpcErr, subId },
        "[BillingWebhook] Failed to execute revoke_subscription_access"
      );
    }
  }

  return { subscriptionId: subId };
}

/**
 * Inserts or updates a payment transaction in the ledger from Lemon Squeezy webhook.
 */
export async function recordLemonSqueezyPayment(
  params: RecordPaymentParams
): Promise<string> {
  const provider = "lemonsqueezy";
  const paymentId = randomUUID();

  await db.execute(sql`
    INSERT INTO public.payments (
      id, user_id, plan_id, subscription_id,
      provider, provider_payment_id,
      amount_minor, currency, status,
      receipt_url, paid_at
    )
    VALUES (
      ${paymentId}::uuid,
      ${params.userId}::uuid,
      ${params.planId ? params.planId : null}::uuid,
      ${params.subscriptionId ? params.subscriptionId : null}::uuid,
      ${provider},
      ${params.providerPaymentId},
      ${params.amountMinor},
      ${params.currency},
      ${params.status},
      ${params.receiptUrl || null},
      ${params.paidAt ? params.paidAt.toISOString() : null}::timestamptz
    )
    ON CONFLICT (provider, provider_payment_id) DO UPDATE
    SET
      status = EXCLUDED.status,
      receipt_url = COALESCE(EXCLUDED.receipt_url, public.payments.receipt_url),
      paid_at = COALESCE(EXCLUDED.paid_at, public.payments.paid_at);
  `);

  return paymentId;
}
