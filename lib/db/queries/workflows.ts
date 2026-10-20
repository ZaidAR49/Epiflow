import "server-only";
import { sql } from "drizzle-orm";
import { db } from "../client";

export interface WorkflowSummary {
  id: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  isActive: boolean;
}

/**
 * Retrieves a workflow by its unique slug.
 */
export async function getWorkflowBySlug(
  slug: string
): Promise<WorkflowSummary | null> {
  const result = await db.execute<{
    id: string;
    slug: string;
    name: string;
    image_url: string | null;
    is_active: boolean;
  }>(sql`
    SELECT id, slug, name, image_url, is_active
    FROM public.workflows
    WHERE slug = ${slug}::text
    LIMIT 1;
  `);

  const row = result[0];
  if (!row) return null;

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    imageUrl: row.image_url,
    isActive: Boolean(row.is_active),
  };
}

/**
 * Retrieves the primary SaaS workflow ('job-xray') summary.
 */
export async function getPrimaryWorkflow(): Promise<WorkflowSummary | null> {
  return getWorkflowBySlug("job-xray");
}

export interface RegisteredWorkflowItem {
  id: string;
  slug: string;
  name: string;
  isActive: boolean;
  imageUrl?: string | null;
  usageCount: number;
  usageLimit: number | null;
  expiresAt: Date | null;
}

/**
 * Returns all workflows that the user has an access grant for.
 */
export async function getUserWorkflowsList(
  userId: string
): Promise<RegisteredWorkflowItem[]> {
  const result = await db.execute<{
    id: string;
    slug: string;
    name: string;
    is_active: boolean;
    image_url: string | null;
    usage_count: number;
    usage_limit: number | null;
    expires_at: string | null;
  }>(sql`
    SELECT 
      w.id,
      w.slug,
      w.name,
      w.is_active,
      w.image_url,
      uwa.usage_count,
      uwa.usage_limit,
      uwa.expires_at
    FROM public.workflows w
    JOIN public.user_workflow_access uwa ON uwa.workflow_id = w.id
    WHERE uwa.user_id = ${userId}::uuid
    ORDER BY w.name ASC;
  `);

  return result.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    isActive: Boolean(row.is_active),
    imageUrl: row.image_url,
    usageCount: Number(row.usage_count || 0),
    usageLimit: row.usage_limit !== null ? Number(row.usage_limit) : null,
    expiresAt: row.expires_at ? new Date(row.expires_at) : null,
  }));
}
