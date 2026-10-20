import "server-only";
import { sql } from "drizzle-orm";
import { db } from "../client";

export interface WorkflowCredentialStatus {
  id: string;
  provider: string;
  status: "active" | "expired" | "revoked" | "needs_reauth";
  scopes: string[];
  accountEmail: string | null;
  lastUsedAt: Date | null;
  updatedAt: Date;
}

/**
 * Retrieves public non-sensitive credential status for a user's workflow.
 * Never decrypts or exposes raw secret tokens.
 */
export async function getWorkflowCredentialStatus(
  userId: string,
  workflowSlug: string,
  provider: string = "google"
): Promise<WorkflowCredentialStatus | null> {
  const result = await db.execute<{
    id: string;
    provider: string;
    status: "active" | "expired" | "revoked" | "needs_reauth";
    scopes: string[];
    public_info: { account_email?: string } | null;
    last_used_at: string | null;
    updated_at: string;
  }>(sql`
    SELECT 
      c.id,
      c.provider,
      c.status,
      c.scopes,
      c.public_info,
      c.last_used_at,
      c.updated_at
    FROM public.workflow_credentials c
    JOIN public.workflows w ON w.id = c.workflow_id
    WHERE c.user_id = ${userId}::uuid
      AND w.slug = ${workflowSlug}::text
      AND c.provider = ${provider}::text
    LIMIT 1;
  `);

  const row = result[0];
  if (!row) return null;

  return {
    id: row.id,
    provider: row.provider,
    status: row.status,
    scopes: Array.isArray(row.scopes) ? row.scopes : [],
    accountEmail: row.public_info?.account_email ?? null,
    lastUsedAt: row.last_used_at ? new Date(row.last_used_at) : null,
    updatedAt: new Date(row.updated_at),
  };
}

/**
 * Saves or updates a Google OAuth refresh token for a user and workflow.
 * Uses PostgreSQL set_credential function (Supabase Vault encrypted storage).
 */
export async function saveWorkflowGoogleCredential(params: {
  userId: string;
  workflowSlug: string;
  refreshToken: string;
  accountEmail: string;
  scopes?: string[];
}): Promise<string> {
  const {
    userId,
    workflowSlug,
    refreshToken,
    accountEmail,
    scopes = ["https://www.googleapis.com/auth/gmail.compose"],
  } = params;

  const payloadJson = JSON.stringify({ refresh_token: refreshToken });
  const publicInfoJson = JSON.stringify({ account_email: accountEmail });
  const scopesSql = sql`ARRAY[${sql.join(
    scopes.map((s) => sql`${s}::text`),
    sql`, `
  )}]::text[]`;

  const result = await db.execute<{ credential_id: string }>(sql`
    WITH target_workflow AS (
      SELECT id FROM public.workflows WHERE slug = ${workflowSlug}::text LIMIT 1
    )
    SELECT public.set_credential(
      ${userId}::uuid,
      tw.id,
      'google'::text,
      'oauth_refresh_token'::public.credential_auth_type,
      ${payloadJson}::jsonb,
      ${scopesSql},
      ${publicInfoJson}::jsonb,
      NULL::timestamptz
    ) AS credential_id
    FROM target_workflow tw;
  `);

  const credentialId = result[0]?.credential_id;
  if (!credentialId) {
    throw new Error(`Failed to store credential for workflow ${workflowSlug}`);
  }
  return credentialId;
}

/**
 * Retrieves the decrypted refresh token for server-side Gmail operations.
 * Calls PostgreSQL get_credential function.
 */
export async function getWorkflowDecryptedRefreshToken(
  userId: string,
  workflowSlug: string,
  provider: string = "google"
): Promise<string | null> {
  const result = await db.execute<{
    credential_data: {
      auth_type?: string;
      payload?: { refresh_token?: string };
    } | null;
  }>(sql`
    WITH target_workflow AS (
      SELECT id FROM public.workflows WHERE slug = ${workflowSlug}::text LIMIT 1
    )
    SELECT public.get_credential(
      ${userId}::uuid,
      tw.id,
      ${provider}::text
    ) AS credential_data
    FROM target_workflow tw;
  `);

  const payload = result[0]?.credential_data?.payload;
  return payload?.refresh_token ?? null;
}

/**
 * Revokes and deletes a workflow credential for a user.
 */
export async function deleteWorkflowCredential(
  userId: string,
  workflowSlug: string,
  provider: string = "google"
): Promise<boolean> {
  const result = await db.execute<{ deleted: boolean }>(sql`
    WITH target_workflow AS (
      SELECT id FROM public.workflows WHERE slug = ${workflowSlug}::text LIMIT 1
    )
    DELETE FROM public.workflow_credentials c
    USING target_workflow tw
    WHERE c.user_id = ${userId}::uuid
      AND c.workflow_id = tw.id
      AND c.provider = ${provider}::text
    RETURNING true AS deleted;
  `);

  return Boolean(result[0]?.deleted);
}

/**
 * Updates the last_used_at timestamp of a workflow credential.
 */
export async function touchWorkflowCredential(
  userId: string,
  workflowSlug: string,
  provider: string = "google"
): Promise<void> {
  await db.execute(sql`
    WITH target_workflow AS (
      SELECT id FROM public.workflows WHERE slug = ${workflowSlug}::text LIMIT 1
    )
    UPDATE public.workflow_credentials c
    SET last_used_at = NOW()
    FROM target_workflow tw
    WHERE c.user_id = ${userId}::uuid
      AND c.workflow_id = tw.id
      AND c.provider = ${provider}::text;
  `);
}
