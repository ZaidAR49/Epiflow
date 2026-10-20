import "server-only";
import { sql } from "drizzle-orm";
import { db } from "../client";
import type { ErrorCode } from "../../errors";

export interface GatekeeperAuthResult {
  isAuthorized: boolean;
  statusCode: number;
  errorCode: ErrorCode | "AUTHORIZED";
  userId: string | null;
  workflowId: string | null;
  firstName: string | null;
  userRole: "admin" | "user" | "guest" | null;
  remainingQuota: number | null;
  preferredLanguage?: "ar" | "en";
  cvUrl?: string | null;
  fullName?: string | null;
  sendEmail?: boolean;
}

export interface UsageConsumptionResult {
  consumed: boolean;
  remainingQuota: number | null;
}

/**
 * Authenticates user via PostgreSQL gatekeeper function (read-only access check)
 * and retrieves user workflow preferences (cv, language, sendEmail) matching job-xray.json.
 */
interface RawGatekeeperRow extends Record<string, unknown> {
  is_authorized: boolean;
  status_code: number;
  error_code: string;
  user_id: string | null;
  workflow_id: string | null;
  first_name: string | null;
  user_role: "admin" | "user" | "guest" | null;
  remaining_quota: number | null;
  preferred_language: string | null;
  cv: string | null;
  full_name: string | null;
  send_email: boolean | null;
}

export async function authenticateGatekeeper(
  telegramId: number,
  workflowSlug: string,
  username?: string | null
): Promise<GatekeeperAuthResult> {
  const result = await db.execute<RawGatekeeperRow>(sql`
    WITH auth AS (
      SELECT * FROM public.authenticate_gatekeeper(${telegramId}::bigint, ${workflowSlug}::text, ${username ?? null}::text)
    )
    SELECT 
      auth.is_authorized, auth.status_code, auth.error_code, auth.user_id, auth.workflow_id,
      auth.first_name, auth.user_role, auth.remaining_quota,
      uwa.metadata->>'preferred_language' AS preferred_language,
      uwa.metadata->>'cv' AS cv,
      uwa.metadata->>'fullName' AS full_name,
      COALESCE((uwa.metadata->>'sendEmail')::boolean, false) AS send_email
    FROM auth
    LEFT JOIN public.users u ON u.id = auth.user_id
    LEFT JOIN public.workflows w ON w.slug = ${workflowSlug}::text
    LEFT JOIN public.user_workflow_access uwa ON uwa.user_id = auth.user_id AND uwa.workflow_id = w.id
  `);

  const row = result[0];
  if (!row) {
    return {
      isAuthorized: false, statusCode: 401, errorCode: "UNREGISTERED",
      userId: null, workflowId: null, firstName: null, userRole: null, remainingQuota: null, sendEmail: false,
    };
  }

  const preferredLanguage =
    row.preferred_language === "en" ? "en" : "ar";

  return {
    isAuthorized: Boolean(row.is_authorized),
    statusCode: Number(row.status_code),
    errorCode: row.error_code as ErrorCode | "AUTHORIZED",
    userId: row.user_id,
    workflowId: row.workflow_id,
    firstName: row.first_name,
    userRole: row.user_role,
    remainingQuota: row.remaining_quota !== null ? Number(row.remaining_quota) : null,
    preferredLanguage,
    cvUrl: row.cv,
    fullName: row.full_name,
    sendEmail: Boolean(row.send_email),
  };
}

/**
 * Atomically consumes 1 usage unit after report delivery succeeds.
 * Guarded against double-consumption or expired/exhausted quotas.
 */
export async function consumeWorkflowUsage(
  userId: string,
  workflowSlug: string
): Promise<UsageConsumptionResult> {
  const result = await db.execute<{
    consumed: boolean;
    remaining_quota: number | null;
  }>(sql`
    SELECT * FROM public.consume_workflow_usage(
      ${userId}::uuid,
      ${workflowSlug}::text
    )
  `);

  const row = result[0];
  if (!row) {
    return { consumed: false, remainingQuota: null };
  }

  return {
    consumed: Boolean(row.consumed),
    remainingQuota: row.remaining_quota !== null ? Number(row.remaining_quota) : null,
  };
}

export interface UserWorkflowProfile {
  workflowId: string;
  workflowName: string;
  imageUrl?: string | null;
  usageCount: number;
  usageLimit: number | null;
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  metadata: {
    fullName?: string;
    cv?: string;
    sendEmail?: boolean;
    preferred_language?: "ar" | "en";
  };
}

/**
 * Retrieves access record, usage meters, and workflow metadata for a user.
 */
export async function getUserWorkflowDetails(
  userId: string,
  workflowSlug: string
): Promise<UserWorkflowProfile | null> {
  const result = await db.execute<{
    workflow_id: string;
    workflow_name: string;
    image_url: string | null;
    usage_count: number;
    usage_limit: number | null;
    last_used_at: string | null;
    expires_at: string | null;
    metadata: {
      fullName?: string;
      cv?: string;
      sendEmail?: boolean;
      preferred_language?: "ar" | "en";
    } | null;
  }>(sql`
    SELECT 
      w.id AS workflow_id,
      w.name AS workflow_name,
      w.image_url,
      uwa.usage_count,
      uwa.usage_limit,
      uwa.last_used_at,
      uwa.expires_at,
      uwa.metadata
    FROM public.workflows w
    JOIN public.user_workflow_access uwa 
      ON uwa.workflow_id = w.id
    WHERE uwa.user_id = ${userId}::uuid
      AND w.slug = ${workflowSlug}::text
    LIMIT 1;
  `);

  const row = result[0];
  if (!row) return null;

  return {
    workflowId: row.workflow_id,
    workflowName: row.workflow_name,
    imageUrl: row.image_url,
    usageCount: Number(row.usage_count || 0),
    usageLimit: row.usage_limit !== null ? Number(row.usage_limit) : null,
    lastUsedAt: row.last_used_at ? new Date(row.last_used_at) : null,
    expiresAt: row.expires_at ? new Date(row.expires_at) : null,
    metadata: row.metadata || {},
  };
}

/**
 * Ensures user has an active access record for a workflow.
 */
export async function ensureUserWorkflowAccess(
  userId: string,
  workflowSlug: string,
  defaultLimit: number = 10
): Promise<void> {
  await db.execute(sql`
    INSERT INTO public.user_workflow_access (user_id, workflow_id, usage_limit, metadata)
    SELECT 
      ${userId}::uuid,
      w.id,
      ${defaultLimit},
      jsonb_build_object('sendEmail', true, 'preferred_language', 'ar')
    FROM public.workflows w
    WHERE w.slug = ${workflowSlug}::text
    ON CONFLICT (user_id, workflow_id) DO NOTHING;
  `);
}

/**
 * Updates the user's workflow metadata preferences (fullName, cv, sendEmail).
 */
export async function updateUserWorkflowMetadata(
  userId: string,
  workflowSlug: string,
  metadataPatch: {
    fullName?: string;
    cv?: string;
    sendEmail?: boolean;
    preferred_language?: "ar" | "en";
  }
): Promise<boolean> {
  const patchJson = JSON.stringify(metadataPatch);
  const result = await db.execute<{ updated: boolean }>(sql`
    WITH target_workflow AS (
      SELECT id FROM public.workflows WHERE slug = ${workflowSlug}::text LIMIT 1
    )
    UPDATE public.user_workflow_access uwa
    SET 
      metadata = COALESCE(uwa.metadata, '{}'::jsonb) || ${patchJson}::jsonb
    FROM target_workflow tw
    WHERE uwa.user_id = ${userId}::uuid
      AND uwa.workflow_id = tw.id
    RETURNING true AS updated;
  `);

  return Boolean(result[0]?.updated);
}

export { getUserWorkflowsList, type RegisteredWorkflowItem } from "./workflows";

