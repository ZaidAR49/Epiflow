import "server-only";
import { sql } from "drizzle-orm";
import { db } from "../client";

export interface UserUsageItem {
  meterKey: string;
  meterName: string;
  unit: string;
  used: number;
  limitValue: number | null;
  period: string;
  periodStart: Date;
}

/**
 * Retrieves all usage meters for a user's workflow access.
 * Returns per-meter usage with period-aware current values.
 */
export async function getUserUsage(
  userId: string,
  workflowSlug: string
): Promise<UserUsageItem[]> {
  const result = await db.execute<{
    meter_key: string;
    meter_name: string;
    unit: string;
    used: string;
    limit_value: string | null;
    period: string;
    period_start: string;
  }>(sql`
    SELECT
      m.key AS meter_key,
      m.name AS meter_name,
      m.unit,
      (CASE WHEN au.period = 'monthly'
                 AND au.period_start + interval '1 month' <= now()
            THEN 0 ELSE au.used END)::text AS used,
      au.limit_value::text,
      au.period,
      au.period_start
    FROM public.access_usage au
    JOIN public.usage_meters m ON m.id = au.meter_id
    JOIN public.workflows w ON w.id = au.workflow_id
    WHERE au.user_id = ${userId}::uuid
      AND w.slug = ${workflowSlug}::text
    ORDER BY m.key ASC;
  `);

  return result.map((row) => ({
    meterKey: row.meter_key,
    meterName: row.meter_name,
    unit: row.unit,
    used: Number(row.used || 0),
    limitValue: row.limit_value !== null ? Number(row.limit_value) : null,
    period: row.period,
    periodStart: new Date(row.period_start),
  }));
}

/**
 * Returns remaining 'runs' for a user's workflow.
 * null = unlimited, 0 = exhausted.
 */
export async function getRunsRemaining(
  userId: string,
  workflowSlug: string
): Promise<number | null> {
  const result = await db.execute<{
    remaining: string | null;
  }>(sql`
    SELECT
      CASE WHEN au.limit_value IS NULL THEN NULL
           ELSE GREATEST(
             au.limit_value - (
               CASE WHEN au.period = 'monthly'
                         AND au.period_start + interval '1 month' <= now()
                    THEN 0 ELSE au.used END
             ), 0
           )
      END::text AS remaining
    FROM public.access_usage au
    JOIN public.usage_meters m ON m.id = au.meter_id
    JOIN public.workflows w ON w.id = au.workflow_id
    WHERE au.user_id = ${userId}::uuid
      AND w.slug = ${workflowSlug}::text
      AND m.key = 'runs'
    LIMIT 1;
  `);

  const row = result[0];
  if (!row) return null;
  return row.remaining !== null ? Number(row.remaining) : null;
}

/**
 * Admin: resets a specific usage meter for a user's workflow.
 */
export async function resetUsage(
  userId: string,
  workflowSlug: string,
  meterKey: string = "runs"
): Promise<boolean> {
  const result = await db.execute<{ updated: boolean }>(sql`
    WITH target AS (
      SELECT au.user_id, au.workflow_id, au.meter_id
      FROM public.access_usage au
      JOIN public.usage_meters m ON m.id = au.meter_id
      JOIN public.workflows w ON w.id = au.workflow_id
      WHERE au.user_id = ${userId}::uuid
        AND w.slug = ${workflowSlug}::text
        AND m.key = ${meterKey}::text
    )
    UPDATE public.access_usage au
    SET used = 0, period_start = now()
    FROM target t
    WHERE au.user_id = t.user_id
      AND au.workflow_id = t.workflow_id
      AND au.meter_id = t.meter_id
    RETURNING true AS updated;
  `);

  return Boolean(result[0]?.updated);
}

/**
 * Admin: sets the limit_value for a specific usage meter.
 * Pass null for unlimited.
 */
export async function setUsageLimit(
  userId: string,
  workflowSlug: string,
  meterKey: string,
  limit: number | null
): Promise<boolean> {
  const result = await db.execute<{ updated: boolean }>(sql`
    WITH target AS (
      SELECT au.user_id, au.workflow_id, au.meter_id
      FROM public.access_usage au
      JOIN public.usage_meters m ON m.id = au.meter_id
      JOIN public.workflows w ON w.id = au.workflow_id
      WHERE au.user_id = ${userId}::uuid
        AND w.slug = ${workflowSlug}::text
        AND m.key = ${meterKey}::text
    )
    UPDATE public.access_usage au
    SET limit_value = ${limit}
    FROM target t
    WHERE au.user_id = t.user_id
      AND au.workflow_id = t.workflow_id
      AND au.meter_id = t.meter_id
    RETURNING true AS updated;
  `);

  return Boolean(result[0]?.updated);
}

/**
 * Ensures an access_usage row exists for a user, workflow, and meter.
 * Used when granting access to seed initial usage tracking.
 */
export async function ensureAccessUsageRow(
  userId: string,
  workflowSlug: string,
  meterKey: string = "runs",
  defaultLimit: number | null = null
): Promise<void> {
  await db.execute(sql`
    INSERT INTO public.access_usage (user_id, workflow_id, meter_id, used, limit_value, period)
    SELECT
      ${userId}::uuid,
      w.id,
      m.id,
      0,
      ${defaultLimit},
      'lifetime'
    FROM public.workflows w
    CROSS JOIN public.usage_meters m
    WHERE w.slug = ${workflowSlug}::text
      AND m.key = ${meterKey}::text
    ON CONFLICT (user_id, workflow_id, meter_id) DO NOTHING;
  `);
}
