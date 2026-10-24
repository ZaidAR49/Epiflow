import { NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { ErrorCodes } from "@/lib/errors";
import { createJobRun } from "@/lib/db/queries/job-runs";
import { getUserWorkflowDetails } from "@/lib/db/queries/access";
import { executePipeline } from "@/lib/services/pipeline/orchestrator";
import { linkedinUrlSchema } from "@/lib/validation/url";
import { isErr } from "@/lib/result";
import { getUserById } from "@/lib/db/queries/users";

const analyzeStreamSchema = z.object({
  url: linkedinUrlSchema,
  language: z.enum(["ar", "en"]).default("ar"),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response(
      JSON.stringify({ error: "Unauthorized", code: ErrorCodes.UNAUTHORIZED }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  const userId = session.user.id;

  try {
    const body: unknown = await req.json();
    const parsed = analyzeStreamSchema.safeParse(body);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || "Invalid LinkedIn URL";
      return new Response(
        JSON.stringify({ error: message, code: ErrorCodes.INVALID_URL }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { url, language } = parsed.data;

    // Verify user status and workflow quota
    const [user, workflow] = await Promise.all([
      getUserById(userId),
      getUserWorkflowDetails(userId, "job-xray"),
    ]);

    if (!user || user.status === "locked" || user.status === "rejected") {
      return new Response(
        JSON.stringify({
          error: "Account is locked or not permitted",
          code: ErrorCodes.ACCOUNT_LOCKED,
        }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!workflow) {
      return new Response(
        JSON.stringify({
          error: "Workflow access not granted",
          code: ErrorCodes.WORKFLOW_FORBIDDEN,
        }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    if (
      workflow.usageLimit !== null &&
      workflow.usageCount >= workflow.usageLimit
    ) {
      return new Response(
        JSON.stringify({
          error: "Quota exceeded for this period",
          code: ErrorCodes.QUOTA_EXCEEDED,
        }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    // Create initial pending job run record
    const run = await createJobRun({
      userId,
      workflowId: workflow.workflowId,
      channel: "web",
      input: { url, normalizedUrl: url, language },
      status: "pending",
    });

    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    const encoder = new TextEncoder();

    const sendEvent = async (data: Record<string, unknown>) => {
      const payload = `data: ${JSON.stringify(data)}\n\n`;
      await writer.write(encoder.encode(payload));
    };

    // Execute pipeline asynchronously and pipe events to SSE
    (async () => {
      try {
        await sendEvent({ type: "init", runId: run.id });

        const result = await executePipeline({
          runId: run.id,
          userId,
          rawUrl: url,
          language,
          onProgress: async (status) => {
            await sendEvent({ type: "progress", status });
          },
        });

        if (isErr(result)) {
          await sendEvent({
            type: "error",
            errorCode: result.error.code,
            message: result.error.safeMessage,
          });
        } else {
          await sendEvent({
            type: "completed",
            runId: run.id,
            report: result.data.report,
            remainingQuota: result.data.remainingQuota,
          });
        }
      } catch (err) {
        await sendEvent({
          type: "error",
          errorCode: ErrorCodes.INTERNAL_ERROR,
          message: err instanceof Error ? err.message : "Pipeline failed",
        });
      } finally {
        await writer.close();
      }
    })();

    return new Response(stream.readable, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Server error",
        code: ErrorCodes.INTERNAL_ERROR,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
