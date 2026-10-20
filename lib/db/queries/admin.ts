import "server-only";
import { sql } from "drizzle-orm";
import { db } from "../client";

export interface AdminStats {
  totalUsers: number;
  pendingUsers: number;
  totalWorkflows: number;
  activeWorkflows: number;
  totalRuns: number;
  totalQuotaConsumed: number;
}

export interface AdminWorkflowItem {
  id: string;
  slug: string;
  name: string;
  isActive: boolean;
  imageUrl: string | null;
  requirements: Record<string, unknown>;
  usersCount: number;
  totalRuns: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminUserItem {
  id: string;
  email: string | null;
  fullName: string;
  role: "admin" | "user" | "guest";
  status: "pending" | "approved" | "rejected" | "locked";
  telegramId: number | null;
  username: string | null;
  image: string | null;
  usageCount: number;
  usageLimit: number | null;
  expiresAt: Date | null;
  createdAt: Date;
}

export async function getAdminStats(): Promise<AdminStats> {
  const result = await db.execute<{
    total_users: string;
    pending_users: string;
    total_workflows: string;
    active_workflows: string;
    total_runs: string;
    total_quota_consumed: string;
  }>(sql`
    SELECT
      (SELECT COUNT(*)::text FROM public.users) AS total_users,
      (SELECT COUNT(*)::text FROM public.users WHERE status = 'pending') AS pending_users,
      (SELECT COUNT(*)::text FROM public.workflows) AS total_workflows,
      (SELECT COUNT(*)::text FROM public.workflows WHERE is_active = true) AS active_workflows,
      (SELECT COUNT(*)::text FROM public.job_runs) AS total_runs,
      (SELECT COALESCE(SUM(usage_count), 0)::text FROM public.user_workflow_access) AS total_quota_consumed;
  `);

  const row = result[0];
  return {
    totalUsers: Number(row?.total_users || 0),
    pendingUsers: Number(row?.pending_users || 0),
    totalWorkflows: Number(row?.total_workflows || 0),
    activeWorkflows: Number(row?.active_workflows || 0),
    totalRuns: Number(row?.total_runs || 0),
    totalQuotaConsumed: Number(row?.total_quota_consumed || 0),
  };
}

export async function getAdminWorkflows(): Promise<AdminWorkflowItem[]> {
  const result = await db.execute<{
    id: string;
    slug: string;
    name: string;
    is_active: boolean;
    image_url: string | null;
    requirements: Record<string, unknown>;
    users_count: string;
    total_runs: string;
    created_at: string;
    updated_at: string;
  }>(sql`
    SELECT 
      w.id,
      w.slug,
      w.name,
      w.is_active,
      w.image_url,
      w.requirements,
      (SELECT COUNT(*)::text FROM public.user_workflow_access uwa WHERE uwa.workflow_id = w.id) AS users_count,
      (SELECT COUNT(*)::text FROM public.job_runs jr WHERE jr.channel = 'web' OR jr.channel = 'telegram') AS total_runs,
      w.created_at,
      w.updated_at
    FROM public.workflows w
    ORDER BY w.name ASC;
  `);

  return result.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    isActive: Boolean(row.is_active),
    imageUrl: row.image_url,
    requirements: row.requirements || {},
    usersCount: Number(row.users_count || 0),
    totalRuns: Number(row.total_runs || 0),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }));
}

export async function updateWorkflowDetails(
  workflowId: string,
  patch: {
    isActive?: boolean;
    imageUrl?: string | null;
    name?: string;
  }
): Promise<boolean> {
  const result = await db.execute<{ updated: boolean }>(sql`
    UPDATE public.workflows
    SET 
      is_active = CASE WHEN ${patch.isActive !== undefined} THEN ${patch.isActive ?? null} ELSE is_active END,
      image_url = CASE WHEN ${patch.imageUrl !== undefined} THEN ${patch.imageUrl ?? null} ELSE image_url END,
      name = CASE WHEN ${patch.name !== undefined} THEN ${patch.name ?? null} ELSE name END,
      updated_at = NOW()
    WHERE id = ${workflowId}::uuid
    RETURNING true AS updated;
  `);

  return Boolean(result[0]?.updated);
}

export async function getAdminUsers(): Promise<AdminUserItem[]> {
  const result = await db.execute<{
    id: string;
    email: string | null;
    full_name: string;
    role: "admin" | "user" | "guest";
    status: "pending" | "approved" | "rejected" | "locked";
    telegram_id: string | null;
    username: string | null;
    image: string | null;
    usage_count: string | null;
    usage_limit: string | null;
    expires_at: string | null;
    created_at: string;
  }>(sql`
    SELECT 
      u.id,
      u.email,
      u.full_name,
      u.role,
      u.status,
      u.telegram_id::text,
      u.username,
      u.image,
      uwa.usage_count::text,
      uwa.usage_limit::text,
      uwa.expires_at,
      u.created_at
    FROM public.users u
    LEFT JOIN public.workflows w ON w.slug = 'job-xray'
    LEFT JOIN public.user_workflow_access uwa ON uwa.user_id = u.id AND uwa.workflow_id = w.id
    ORDER BY u.created_at DESC;
  `);

  return result.map((row) => ({
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    role: row.role,
    status: row.status,
    telegramId: row.telegram_id ? Number(row.telegram_id) : null,
    username: row.username,
    image: row.image,
    usageCount: Number(row.usage_count || 0),
    usageLimit: row.usage_limit !== null ? Number(row.usage_limit) : null,
    expiresAt: row.expires_at ? new Date(row.expires_at) : null,
    createdAt: new Date(row.created_at),
  }));
}

export async function updateUserRoleAndStatus(
  userId: string,
  data: {
    role?: "admin" | "user" | "guest";
    status?: "pending" | "approved" | "rejected" | "locked";
  }
): Promise<boolean> {
  const result = await db.execute<{ updated: boolean }>(sql`
    UPDATE public.users
    SET 
      role = COALESCE(${data.role ?? null}::public.user_role, role),
      status = COALESCE(${data.status ?? null}::public.access_status, status),
      updated_at = NOW()
    WHERE id = ${userId}::uuid
    RETURNING true AS updated;
  `);

  return Boolean(result[0]?.updated);
}

export async function updateUserWorkflowQuota(
  userId: string,
  workflowSlug: string,
  data: {
    usageLimit?: number | null;
    resetCount?: boolean;
  }
): Promise<boolean> {
  const result = await db.execute<{ updated: boolean }>(sql`
    WITH target_workflow AS (
      SELECT id FROM public.workflows WHERE slug = ${workflowSlug}::text LIMIT 1
    )
    UPDATE public.user_workflow_access uwa
    SET 
      usage_limit = ${data.usageLimit !== undefined ? data.usageLimit : sql`uwa.usage_limit`},
      usage_count = CASE WHEN ${Boolean(data.resetCount)} THEN 0 ELSE uwa.usage_count END
    FROM target_workflow tw
    WHERE uwa.user_id = ${userId}::uuid
      AND uwa.workflow_id = tw.id
    RETURNING true AS updated;
  `);

  return Boolean(result[0]?.updated);
}

export async function getActiveAdminCount(): Promise<number> {
  const result = await db.execute<{ count: string }>(sql`
    SELECT COUNT(*)::text AS count 
    FROM public.users 
    WHERE role = 'admin' AND status = 'approved';
  `);
  return Number(result[0]?.count || 0);
}

export async function deleteUserById(userId: string): Promise<boolean> {
  const result = await db.execute<{ deleted: boolean }>(sql`
    DELETE FROM public.users
    WHERE id = ${userId}::uuid
    RETURNING true AS deleted;
  `);
  return Boolean(result[0]?.deleted);
}

