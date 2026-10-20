"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { inngest } from "@/lib/jobs/client";
import { linkedinUrlSchema } from "@/lib/validation/url";
import { createJobRun, deleteJobRun } from "@/lib/db/queries/job-runs";
import { ErrorCodes } from "@/lib/errors";

const analyzeInputSchema = z.object({
  url: linkedinUrlSchema,
  language: z.enum(["ar", "en"]).default("ar"),
  userId: z.string().uuid("Invalid user ID").optional(),
});

export type AnalyzeInput = z.infer<typeof analyzeInputSchema>;

export type AnalyzeActionResult =
  | { success: true; runId: string }
  | { success: false; errorCode: string; message: string };

/**
 * Thin Server Action: validates input, initializes run record,
 * dispatches background Inngest job, and returns in < 200ms.
 */
export async function analyzePostAction(
  rawInput: unknown
): Promise<AnalyzeActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      success: false,
      errorCode: ErrorCodes.UNAUTHORIZED,
      message: "You must be signed in to perform this action",
    };
  }

  const parsed = analyzeInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message || "Invalid input";
    return {
      success: false,
      errorCode: ErrorCodes.INVALID_URL,
      message,
    };
  }

  // Strictly enforce authenticated user identity
  const userId = session.user.id;
  const { url, language } = parsed.data;

  try {
    // 1. Create initial job run record
    const run = await createJobRun({
      userId,
      channel: "web",
      url,
      normalizedUrl: url,
      status: "pending",
    });

    // 2. Dispatch background job to Inngest
    await inngest.send({
      name: "job/analyze.requested",
      data: {
        runId: run.id,
        userId,
        url,
        language,
      },
    });

    // 3. Return immediately in < 200ms
    return {
      success: true,
      runId: run.id,
    };
  } catch {
    return {
      success: false,
      errorCode: ErrorCodes.INTERNAL_ERROR,
      message: "Failed to schedule analysis job",
    };
  }
}

const deleteRunInputSchema = z.string().uuid("Invalid run ID");

export type DeleteJobRunActionResult =
  | { success: true }
  | { success: false; errorCode: string; message: string };

/**
 * Server Action: Authorizes by session user ownership and permanently
 * deletes a job run record from the database. Returns in < 200ms.
 */
export async function deleteJobRunAction(
  rawRunId: unknown
): Promise<DeleteJobRunActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      success: false,
      errorCode: ErrorCodes.UNAUTHORIZED,
      message: "You must be signed in to perform this action",
    };
  }

  const parsed = deleteRunInputSchema.safeParse(rawRunId);
  if (!parsed.success) {
    return {
      success: false,
      errorCode: ErrorCodes.INVALID_URL,
      message: "Invalid run ID format",
    };
  }

  try {
    const deleted = await deleteJobRun(parsed.data, session.user.id);
    if (!deleted) {
      return {
        success: false,
        errorCode: "NOT_FOUND",
        message: "Report not found or unauthorized",
      };
    }

    return { success: true };
  } catch {
    return {
      success: false,
      errorCode: ErrorCodes.INTERNAL_ERROR,
      message: "Failed to delete report",
    };
  }
}

