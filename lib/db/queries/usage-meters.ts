import "server-only";
import { sql } from "drizzle-orm";
import { db } from "../client";

export interface UsageMeterWithDetails {
  id: string;
  key: string;
  name: string;
  unit: string;
  workflowsCount: number;
  createdAt: Date;
}

type RawUsageMeterRow = {
  id: string;
  key: string;
  name: string;
  unit: string;
  workflows_count: string;
  created_at: string;
};

/**
 * Retrieves all registered usage meters along with the number of workflows tracking each meter.
 */
export async function getAllUsageMeters(): Promise<UsageMeterWithDetails[]> {
  const rows = await db.execute<RawUsageMeterRow>(sql`
    SELECT
      m.id,
      m.key,
      m.name,
      m.unit,
      COUNT(DISTINCT au.workflow_id)::text AS workflows_count,
      m.created_at
    FROM public.usage_meters m
    LEFT JOIN public.access_usage au ON au.meter_id = m.id
    GROUP BY m.id, m.key, m.name, m.unit, m.created_at
    ORDER BY m.created_at ASC;
  `);

  return rows.map((row) => ({
    id: row.id,
    key: row.key,
    name: row.name,
    unit: row.unit,
    workflowsCount: Number(row.workflows_count || 0),
    createdAt: new Date(row.created_at),
  }));
}

/**
 * Registers a new usage meter into the catalog.
 */
export async function createUsageMeter(data: {
  key: string;
  name: string;
  unit: string;
}): Promise<UsageMeterWithDetails> {
  const rows = await db.execute<RawUsageMeterRow>(sql`
    INSERT INTO public.usage_meters (key, name, unit)
    VALUES (${data.key}, ${data.name}, ${data.unit})
    RETURNING id, key, name, unit, '0' AS workflows_count, created_at;
  `);

  const created = rows[0];
  if (!created) {
    throw new Error("Failed to register usage meter");
  }

  return {
    id: created.id,
    key: created.key,
    name: created.name,
    unit: created.unit,
    workflowsCount: 0,
    createdAt: new Date(created.created_at),
  };
}
