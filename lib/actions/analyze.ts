"use server";

import { z } from "zod";
import { inngest } from "@/lib/jobs/client";
import { linkedinUrlSchema } from "@/lib/validation/url";
import { createJobRun } from "@/lib/db/queries/job-runs";
import { ErrorCodes } from "@/lib/errors";

const analyzeInputSchema = z.object({
  url: linkedinUrlSchema,
  language: z.enum(["ar", "en"]).default("ar"),
  userId: z.string().uuid("Invalid user ID"),
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
  const parsed = analyzeInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message || "Invalid input";
    return {
      success: false,
      errorCode: ErrorCodes.INVALID_URL,
      message,
    };
  }

  const { url, language, userId } = parsed.data;

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
