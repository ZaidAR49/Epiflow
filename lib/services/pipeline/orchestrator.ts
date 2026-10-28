import "server-only";
import { AppError, ErrorCodes, type ErrorCode } from "@/lib/errors";
import { ok, err, isErr, type Result } from "@/lib/result";
import { logger } from "@/lib/logger";
import { linkedinUrlSchema } from "@/lib/validation/url";
import { expandLinkedInUrl } from "../scraper/url-expander";
import { scrapePost, scrapeAuthor, scrapeCompany } from "../scraper/apify";
import { normalizeScrapedData, isCompanyProfileUrl } from "../scraper/normalize";
import { generateReport } from "../ai/report-agent";
import type { AnalysisReportOutput } from "@/lib/validation/report";
import { authenticateWebGatekeeper } from "../gatekeeper";
import {
  updateJobRunProgress,
  markJobRunFailed,
  markJobRunCompleted,
  markUsageConsumed,
} from "@/lib/db/queries/job-runs";
import { consumeWorkflowUsage } from "@/lib/db/queries/access";

export interface PipelineExecutionOptions {
  runId: string;
  userId: string;
  rawUrl: string;
  language?: "ar" | "en";
  workflowSlug?: string;
  onProgress?: (status: string) => Promise<void> | void;
}

export interface PipelineExecutionResult {
  runId: string;
  report: AnalysisReportOutput;
  normalizedUrl: string;
  remainingQuota: number | null;
}

/**
 * Executes the discrete 8-step JobPost X-Ray analysis pipeline.
 * Atomic, idempotent, and only consumes quota upon successful delivery.
 */
export async function executePipeline(
  options: PipelineExecutionOptions
): Promise<Result<PipelineExecutionResult, AppError>> {
  const {
    runId,
    userId,
    rawUrl,
    language = "ar",
    workflowSlug = "job-xray",
    onProgress,
  } = options;

  logger.info({ runId, userId }, "Starting pipeline execution");

  try {
    // Gatekeeper validation: verify account status and quota
    const gatekeeperResult = await authenticateWebGatekeeper(userId, workflowSlug);
    if (isErr(gatekeeperResult)) {
      return await failRun(
        runId,
        gatekeeperResult.error.code,
        gatekeeperResult.error.safeMessage
      );
    }

    // Step 1: Validate URL & Expand Short URLs (SSRF-protected)
    await reportProgress(runId, "validating", onProgress);
    const parsedUrl = linkedinUrlSchema.safeParse(rawUrl);
    if (!parsedUrl.success) {
      return await failRun(runId, ErrorCodes.INVALID_URL, "Invalid LinkedIn URL");
    }

    const expandResult = await expandLinkedInUrl(parsedUrl.data);
    if (isErr(expandResult)) {
      return await failRun(
        runId,
        expandResult.error.code,
        expandResult.error.safeMessage
      );
    }
    const normalizedUrl = expandResult.data;

    // Step 2: Scrape Post (fail fast with SCRAPE_EMPTY to save credits)
    await reportProgress(runId, "scraping_post", onProgress);
    const postResult = await scrapePost(normalizedUrl);
    if (isErr(postResult)) {
      return await failRun(
        runId,
        postResult.error.code,
        postResult.error.safeMessage
      );
    }
    const rawPost = postResult.data;

    // Step 3: Scrape Author (Skip if author is a company page)
    let rawAuthor = null;
    const authorUrl = rawPost.author?.profile_url;
    if (authorUrl && !isCompanyProfileUrl(authorUrl)) {
      await reportProgress(runId, "scraping_author", onProgress);
      const authorResult = await scrapeAuthor(authorUrl);
      if (!isErr(authorResult)) {
        rawAuthor = authorResult.data;
      }
    }

    // Scrape Company
    await reportProgress(runId, "scraping_company", onProgress);
    const companyIdOrUrl =
      rawPost.companyLinkedinUrl ||
      rawPost.company_url ||
      (rawPost.company_id ? String(rawPost.company_id) : "");

    let rawCompany = null;
    if (companyIdOrUrl) {
      const companyResult = await scrapeCompany(companyIdOrUrl);
      if (!isErr(companyResult)) {
        rawCompany = companyResult.data;
      }
    }

    // Step 4: Normalize Payload
    const normalizedPayload = normalizeScrapedData({
      url: normalizedUrl,
      post: rawPost,
      author: rawAuthor,
      company: rawCompany,
    });

    // Step 5: Synthesize Report with AI (Gemini primary -> Claude fallback)
    await reportProgress(runId, "generating_report", onProgress);
    const aiResult = await generateReport({
      payload: normalizedPayload,
      language,
    });

    if (isErr(aiResult)) {
      return await failRun(runId, aiResult.error.code, aiResult.error.safeMessage);
    }
    const reportOutput = aiResult.data;

    // Step 6: Persist Completed Run
    await markJobRunCompleted(
      runId,
      reportOutput.report,
      reportOutput.telegramReport
    );

    // Step 7: Delivery Complete
    await reportProgress(runId, "completed", onProgress);

    // Step 8: Atomic Usage Consumption (ONLY after successful completion)
    const usageResult = await consumeWorkflowUsage(userId, workflowSlug);
    await markUsageConsumed(runId);

    logger.info(
      { runId, remainingQuota: usageResult.remainingQuota },
      "Pipeline executed successfully"
    );

    return ok({
      runId,
      report: reportOutput,
      normalizedUrl,
      remainingQuota: usageResult.remainingQuota,
    });
  } catch (error) {
    logger.error({ error, runId }, "Unexpected error in pipeline execution");
    return await failRun(
      runId,
      ErrorCodes.INTERNAL_ERROR,
      "An unexpected error occurred during analysis"
    );
  }
}

async function reportProgress(
  runId: string,
  step: string,
  onProgress?: (s: string) => Promise<void> | void
) {
  await updateJobRunProgress(runId, step);
  if (onProgress) {
    await onProgress(step);
  }
}

async function failRun(
  runId: string,
  code: ErrorCode,
  message: string
): Promise<Result<never, AppError>> {
  await markJobRunFailed(runId, code, message);
  return err(new AppError(code, 400, message));
}
