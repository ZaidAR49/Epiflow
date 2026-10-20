import "server-only";
import { sql } from "drizzle-orm";
import { db } from "../client";

export interface WorkflowChannelItem {
  id: string;
  workflowId: string;
  channel: string;
  handle: string;
  url: string | null;
  isActive: boolean;
  createdAt: Date;
}

interface RawChannelRow extends Record<string, unknown> {
  id: string;
  workflow_id: string;
  channel: string;
  handle: string;
  url: string | null;
  is_active: boolean;
  created_at: string | Date;
}

function mapRow(row: RawChannelRow): WorkflowChannelItem {
  return {
    id: row.id,
    workflowId: row.workflow_id,
    channel: row.channel,
    handle: row.handle,
    url: row.url,
    isActive: Boolean(row.is_active),
    createdAt: new Date(row.created_at),
  };
}

/**
 * Retrieves all configured channels for a specific workflow.
 */
export async function getWorkflowChannels(
  workflowId: string
): Promise<WorkflowChannelItem[]> {
  const result = await db.execute<RawChannelRow>(sql`
    SELECT id, workflow_id, channel, handle, url, is_active, created_at
    FROM public.workflow_channels
    WHERE workflow_id = ${workflowId}::uuid
    ORDER BY created_at ASC;
  `);

  return result.map(mapRow);
}

/**
 * Retrieves all channels across all workflows (useful for admin overview).
 */
export async function getAllWorkflowChannels(): Promise<WorkflowChannelItem[]> {
  const result = await db.execute<RawChannelRow>(sql`
    SELECT id, workflow_id, channel, handle, url, is_active, created_at
    FROM public.workflow_channels
    ORDER BY created_at ASC;
  `);

  return result.map(mapRow);
}

/**
 * Upserts a channel for a workflow (insert or update on conflict by [workflow_id, channel]).
 */
export async function upsertWorkflowChannel(params: {
  workflowId: string;
  channel: string;
  handle: string;
  url?: string | null;
  isActive?: boolean;
}): Promise<WorkflowChannelItem | null> {
  const result = await db.execute<RawChannelRow>(sql`
    INSERT INTO public.workflow_channels (
      workflow_id,
      channel,
      handle,
      url,
      is_active
    ) VALUES (
      ${params.workflowId}::uuid,
      ${params.channel}::text,
      ${params.handle}::text,
      ${params.url ?? null}::text,
      ${params.isActive ?? true}::boolean
    )
    ON CONFLICT (workflow_id, channel)
    DO UPDATE SET
      handle = EXCLUDED.handle,
      url = EXCLUDED.url,
      is_active = EXCLUDED.is_active
    RETURNING id, workflow_id, channel, handle, url, is_active, created_at;
  `);

  const row = result[0];
  return row ? mapRow(row) : null;
}

/**
 * Deletes a channel from a workflow.
 */
export async function deleteWorkflowChannel(
  channelId: string,
  workflowId: string
): Promise<boolean> {
  const result = await db.execute<{ id: string }>(sql`
    DELETE FROM public.workflow_channels
    WHERE id = ${channelId}::uuid AND workflow_id = ${workflowId}::uuid
    RETURNING id;
  `);

  return result.length > 0;
}

/**
 * Finds a channel configuration by workflow slug and channel name (e.g. ('job-xray', 'telegram')).
 */
export async function getWorkflowChannelBySlug(
  workflowSlug: string,
  channel: string
): Promise<WorkflowChannelItem | null> {
  const result = await db.execute<RawChannelRow>(sql`
    SELECT wc.id, wc.workflow_id, wc.channel, wc.handle, wc.url, wc.is_active, wc.created_at
    FROM public.workflow_channels wc
    JOIN public.workflows w ON w.id = wc.workflow_id
    WHERE w.slug = ${workflowSlug}::text AND wc.channel = ${channel}::text
    LIMIT 1;
  `);

  const row = result[0];
  return row ? mapRow(row) : null;
}
