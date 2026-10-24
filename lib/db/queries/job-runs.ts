import "server-only";
import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "../client";
import { jobRuns, type JobRun, type NewJobRun } from "../schema/job-runs";
import type { ErrorCode } from "../../errors";

export type { JobRun, NewJobRun };

export async function createJobRun(data: NewJobRun): Promise<JobRun> {
  const result = await db.insert(jobRuns).values(data).returning();
  const created = result[0];
  if (!created) {
    throw new Error("Failed to insert job run record");
  }
  return created;
}

export async function getJobRunById(id: string, userId: string): Promise<JobRun | null> {
  const result = await db
    .select()
    .from(jobRuns)
    .where(and(eq(jobRuns.id, id), eq(jobRuns.userId, userId)))
    .limit(1);
  return result[0] ?? null;
}

export async function getRecentRunsForUser(userId: string, limit = 20): Promise<JobRun[]> {
  return db
    .select()
    .from(jobRuns)
    .where(eq(jobRuns.userId, userId))
    .orderBy(desc(jobRuns.createdAt))
    .limit(limit);
}

/**
 * Updates the high-level DB status (pending, running, completed, failed, canceled).
 */
export async function updateJobRunStatus(
  id: string,
  status: JobRun["status"]
): Promise<JobRun | null> {
  const result = await db
    .update(jobRuns)
    .set({ status, updatedAt: new Date() })
    .where(eq(jobRuns.id, id))
    .returning();
  return result[0] ?? null;
}

/**
 * Updates the fine-grained pipeline step progress while keeping status as 'running'.
 */
export async function updateJobRunProgress(
  id: string,
  step: string
): Promise<JobRun | null> {
  const result = await db.execute<{
    id: string;
    status: JobRun["status"];
    output: unknown;
  }>(sql`
    UPDATE public.job_runs
    SET status = 'running',
        output = jsonb_set(COALESCE(output, '{}'::jsonb), '{step}', to_jsonb(${step}::text)),
        updated_at = now()
    WHERE id = ${id}::uuid
    RETURNING id, status, output;
  `);

  if (!result[0]) return null;
  return getJobRunById(id, result[0].id) ?? null;
}

export async function markJobRunFailed(
  id: string,
  errorCode: ErrorCode,
  errorMessage: string
): Promise<JobRun | null> {
  const result = await db
    .update(jobRuns)
    .set({
      status: "failed",
      errorCode,
      errorMessage,
      updatedAt: new Date(),
    })
    .where(eq(jobRuns.id, id))
    .returning();
  return result[0] ?? null;
}

export async function markJobRunCompleted(
  id: string,
  report: unknown,
  telegramReport?: string,
  enrichmentData?: Record<string, unknown>
): Promise<JobRun | null> {
  const output = {
    report,
    ...(telegramReport ? { telegramReport } : {}),
    ...(enrichmentData || {}),
    step: "completed",
  };

  const result = await db
    .update(jobRuns)
    .set({
      status: "completed",
      output,
      updatedAt: new Date(),
    })
    .where(eq(jobRuns.id, id))
    .returning();
  return result[0] ?? null;
}

export async function markUsageConsumed(id: string): Promise<JobRun | null> {
  const result = await db
    .update(jobRuns)
    .set({
      usageConsumedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(jobRuns.id, id), eq(jobRuns.status, "completed")))
    .returning();
  return result[0] ?? null;
}

export async function deleteJobRun(id: string, userId: string): Promise<boolean> {
  const result = await db
    .delete(jobRuns)
    .where(and(eq(jobRuns.id, id), eq(jobRuns.userId, userId)))
    .returning({ id: jobRuns.id });
  return result.length > 0;
}
