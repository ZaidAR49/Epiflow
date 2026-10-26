import "server-only";
import { sql } from "drizzle-orm";
import { db } from "../client";

export interface KeepAliveResult {
  ok: boolean;
  databaseTime: string;
  durationMs: number;
}

/**
 * Executes a lightweight SQL query against the database to keep Supabase active
 * and prevent project pausing on the free tier.
 */
export async function pingDatabase(): Promise<KeepAliveResult> {
  const start = performance.now();
  const result = await db.execute<{ now: string }>(
    sql`SELECT NOW()::text AS now;`
  );
  const durationMs = Math.round(performance.now() - start);

  const databaseTime = result[0]?.now ?? new Date().toISOString();

  return {
    ok: true,
    databaseTime,
    durationMs,
  };
}
