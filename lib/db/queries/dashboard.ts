import "server-only";
import { sql } from "drizzle-orm";
import { db } from "../client";

export interface DashboardWorkflowItem {
  id: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  isActive: boolean;
  usageCount: number;
  usageLimit: number | null;
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  isSubscribed: boolean;
  planName: string | null;
  recentRunCount: number;
}

export interface DashboardRunItem {
  id: string;
  workflowSlug: string;
  workflowName: string;
  workflowImageUrl: string | null;
  status: string;
  createdAt: Date;
  inputPreview: string | null;
}

export interface DashboardSubscription {
  planName: string;
  planCode: string;
  status: string;
  currentPeriodEnd: Date | null;
}

export interface DashboardSummary {
  workflows: DashboardWorkflowItem[];
  recentRuns: DashboardRunItem[];
  totalRunsToday: number;
  totalRunsThisMonth: number;
  subscription: DashboardSubscription | null;
}

/**
 * Fetches the complete dashboard summary for a user:
 * all subscribed workflows with usage, recent runs, and subscription.
 */
export async function getDashboardSummary(
  userId: string
): Promise<DashboardSummary> {
  const [workflows, recentRuns, runCounts, subscription] =
    await Promise.all([
      fetchUserWorkflows(userId),
      fetchRecentRuns(userId, 10),
      fetchRunCounts(userId),
      fetchSubscription(userId),
    ]);

  return {
    workflows,
    recentRuns,
    totalRunsToday: runCounts.today,
    totalRunsThisMonth: runCounts.thisMonth,
    subscription,
  };
}

async function fetchUserWorkflows(
  userId: string
): Promise<DashboardWorkflowItem[]> {
  const result = await db.execute<{
    id: string;
    slug: string;
    name: string;
    image_url: string | null;
    is_active: boolean;
    usage_count: string;
    usage_limit: string | null;
    last_used_at: string | null;
    expires_at: string | null;
    is_subscribed: boolean;
    plan_name: string | null;
    recent_run_count: string;
  }>(sql`
    SELECT 
      w.id,
      w.slug,
      w.name,
      w.image_url,
      w.is_active,
      COALESCE(au.used, 0)::text AS usage_count,
      au.limit_value::text AS usage_limit,
      uwa.last_used_at,
      uwa.expires_at,
      (s.id IS NOT NULL
        AND s.status IN ('active', 'trialing')
        AND COALESCE(p.price_minor, 0) > 0
      ) AS is_subscribed,
      p.name AS plan_name,
      COALESCE(rc.cnt, 0)::text AS recent_run_count
    FROM public.workflows w
    JOIN public.user_workflow_access uwa
      ON uwa.workflow_id = w.id
    LEFT JOIN public.subscriptions s
      ON s.id = uwa.subscription_id
    LEFT JOIN public.plans p
      ON p.id = s.plan_id
    LEFT JOIN public.usage_meters m
      ON m.key = 'runs'
    LEFT JOIN public.access_usage au
      ON au.user_id = uwa.user_id
      AND au.workflow_id = w.id
      AND au.meter_id = m.id
    LEFT JOIN LATERAL (
      SELECT COUNT(*)::bigint AS cnt
      FROM public.job_runs jr
      WHERE jr.user_id = ${userId}::uuid
        AND jr.workflow_id = w.id
        AND jr.created_at >= now() - interval '7 days'
    ) rc ON true
    WHERE uwa.user_id = ${userId}::uuid
    ORDER BY uwa.last_used_at DESC NULLS LAST, w.name ASC;
  `);

  return result.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    imageUrl: row.image_url,
    isActive: Boolean(row.is_active),
    usageCount: Number(row.usage_count || 0),
    usageLimit:
      row.usage_limit !== null ? Number(row.usage_limit) : null,
    lastUsedAt: row.last_used_at
      ? new Date(row.last_used_at)
      : null,
    expiresAt: row.expires_at ? new Date(row.expires_at) : null,
    isSubscribed: Boolean(row.is_subscribed),
    planName: row.plan_name || null,
    recentRunCount: Number(row.recent_run_count || 0),
  }));
}

async function fetchRecentRuns(
  userId: string,
  limit: number
): Promise<DashboardRunItem[]> {
  const result = await db.execute<{
    id: string;
    workflow_slug: string;
    workflow_name: string;
    workflow_image_url: string | null;
    status: string;
    created_at: string;
    input_preview: string | null;
  }>(sql`
    SELECT
      jr.id,
      w.slug AS workflow_slug,
      w.name AS workflow_name,
      w.image_url AS workflow_image_url,
      jr.status,
      jr.created_at,
      jr.input->>'url' AS input_preview
    FROM public.job_runs jr
    JOIN public.workflows w ON w.id = jr.workflow_id
    WHERE jr.user_id = ${userId}::uuid
    ORDER BY jr.created_at DESC
    LIMIT ${limit};
  `);

  return result.map((row) => ({
    id: row.id,
    workflowSlug: row.workflow_slug,
    workflowName: row.workflow_name,
    workflowImageUrl: row.workflow_image_url,
    status: row.status,
    createdAt: new Date(row.created_at),
    inputPreview: row.input_preview || null,
  }));
}

async function fetchRunCounts(
  userId: string
): Promise<{ today: number; thisMonth: number }> {
  const result = await db.execute<{
    today: string;
    this_month: string;
  }>(sql`
    SELECT
      COUNT(*) FILTER (
        WHERE jr.created_at >= date_trunc('day', now())
      )::text AS today,
      COUNT(*) FILTER (
        WHERE jr.created_at >= date_trunc('month', now())
      )::text AS this_month
    FROM public.job_runs jr
    WHERE jr.user_id = ${userId}::uuid;
  `);

  const row = result[0];
  return {
    today: Number(row?.today || 0),
    thisMonth: Number(row?.this_month || 0),
  };
}

async function fetchSubscription(
  userId: string
): Promise<DashboardSubscription | null> {
  const result = await db.execute<{
    plan_name: string;
    plan_code: string;
    status: string;
    current_period_end: string | null;
  }>(sql`
    SELECT
      p.name AS plan_name,
      p.code AS plan_code,
      s.status,
      s.current_period_end
    FROM public.subscriptions s
    JOIN public.plans p ON p.id = s.plan_id
    WHERE s.user_id = ${userId}::uuid
      AND s.status IN ('active', 'trialing')
    ORDER BY s.created_at DESC
    LIMIT 1;
  `);

  const row = result[0];
  if (!row) return null;

  return {
    planName: row.plan_name,
    planCode: row.plan_code,
    status: row.status,
    currentPeriodEnd: row.current_period_end
      ? new Date(row.current_period_end)
      : null,
  };
}
