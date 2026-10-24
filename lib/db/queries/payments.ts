import "server-only";
import { sql } from "drizzle-orm";
import { db } from "../client";

export interface PaymentWithDetails {
  id: string;
  userId: string;
  userName: string;
  userEmail: string | null;
  planId: string | null;
  planName: string | null;
  planCode: string | null;
  subscriptionId: string | null;
  provider: string;
  providerPaymentId: string;
  amountMinor: number;
  currency: string;
  status: string;
  refundedMinor: number;
  failureCode: string | null;
  failureMessage: string | null;
  receiptUrl: string | null;
  paidAt: Date | null;
  createdAt: Date;
}

export interface PaymentStats {
  totalVolumeMinor: number;
  totalCount: number;
  succeededCount: number;
  refundedCount: number;
}

type RawPaymentRow = {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string | null;
  plan_id: string | null;
  plan_code: string | null;
  plan_name: string | null;
  subscription_id: string | null;
  provider: string;
  provider_payment_id: string;
  amount_minor: number;
  currency: string;
  status: string;
  refunded_minor: number;
  failure_code: string | null;
  failure_message: string | null;
  receipt_url: string | null;
  paid_at: string | null;
  created_at: string;
};

function mapPaymentRow(row: RawPaymentRow): PaymentWithDetails {
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name,
    userEmail: row.user_email,
    planId: row.plan_id,
    planName: row.plan_name,
    planCode: row.plan_code,
    subscriptionId: row.subscription_id,
    provider: row.provider,
    providerPaymentId: row.provider_payment_id,
    amountMinor: Number(row.amount_minor),
    currency: row.currency,
    status: row.status,
    refundedMinor: Number(row.refunded_minor || 0),
    failureCode: row.failure_code,
    failureMessage: row.failure_message,
    receiptUrl: row.receipt_url,
    paidAt: row.paid_at ? new Date(row.paid_at) : null,
    createdAt: new Date(row.created_at),
  };
}

/**
 * Retrieves all payments for the admin payment ledger with customer and plan details.
 */
export async function getAllPayments(): Promise<PaymentWithDetails[]> {
  const rows = await db.execute<RawPaymentRow>(sql`
    SELECT
      p.id,
      p.user_id,
      u.full_name AS user_name,
      u.email AS user_email,
      p.plan_id,
      pl.code AS plan_code,
      pl.name AS plan_name,
      p.subscription_id,
      p.provider,
      p.provider_payment_id,
      p.amount_minor,
      p.currency,
      p.status,
      p.refunded_minor,
      p.failure_code,
      p.failure_message,
      p.receipt_url,
      p.paid_at,
      p.created_at
    FROM public.payments p
    JOIN public.users u ON u.id = p.user_id
    LEFT JOIN public.plans pl ON pl.id = p.plan_id
    ORDER BY p.created_at DESC;
  `);

  return rows.map(mapPaymentRow);
}

/**
 * Aggregates high-level payment metrics for the admin ledger header.
 */
export async function getPaymentStats(): Promise<PaymentStats> {
  const result = await db.execute<{
    total_volume_minor: string;
    total_count: string;
    succeeded_count: string;
    refunded_count: string;
  }>(sql`
    SELECT
      COALESCE(SUM(CASE WHEN p.status = 'succeeded' THEN p.amount_minor ELSE 0 END), 0)::text AS total_volume_minor,
      COUNT(*)::text AS total_count,
      COUNT(CASE WHEN p.status = 'succeeded' THEN 1 END)::text AS succeeded_count,
      COUNT(CASE WHEN p.status = 'refunded' THEN 1 END)::text AS refunded_count
    FROM public.payments p;
  `);

  const row = result[0];
  return {
    totalVolumeMinor: Number(row?.total_volume_minor || 0),
    totalCount: Number(row?.total_count || 0),
    succeededCount: Number(row?.succeeded_count || 0),
    refundedCount: Number(row?.refunded_count || 0),
  };
}
