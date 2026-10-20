"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { getJobRunById } from "@/lib/db/queries/job-runs";
import { ErrorCodes } from "@/lib/errors";

const getStatusInputSchema = z.object({
  runId: z.string().uuid("Invalid run ID"),
  userId: z.string().uuid("Invalid user ID").optional(),
});

export type JobRunStatusResult = {
  success: boolean;
  status?: string;
  report?: unknown;
  errorCode?: string | null;
  errorMessage?: string | null;
  message?: string;
};

/**
 * Thin Server Action for client streaming/polling of job progress.
 * Enforces strict resource ownership: a user can only read their own runs.
 */
export async function getRunStatusAction(
  rawInput: unknown
): Promise<JobRunStatusResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      success: false,
      errorCode: ErrorCodes.UNAUTHORIZED,
      message: "You must be signed in to access run status",
    };
  }

  const parsed = getStatusInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      message: "Invalid input parameters",
    };
  }

  const { runId } = parsed.data;

  try {
    // Strictly enforce session user ownership
    const run = await getJobRunById(runId, session.user.id);
    if (!run) {
      return {
        success: false,
        errorCode: ErrorCodes.UNAUTHORIZED,
        message: "Analysis run not found or unauthorized",
      };
    }

    return {
      success: true,
      status: run.status,
      report: run.report,
      errorCode: run.errorCode,
      errorMessage: run.errorMessage,
    };
  } catch {
    return {
      success: false,
      errorCode: ErrorCodes.INTERNAL_ERROR,
      message: "Failed to fetch run status",
    };
  }
}
