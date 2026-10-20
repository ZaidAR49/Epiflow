import { inngest, type JobAnalyzeEventData } from "./client";
import { isErr, isOk } from "@/lib/result";
import { expandLinkedInUrl } from "@/lib/services/scraper/url-expander";
import { scrapePost, scrapeAuthor, scrapeCompany } from "@/lib/services/scraper/apify";
import { normalizeScrapedData, isCompanyAuthor } from "@/lib/services/scraper/normalize";
import { generateReport } from "@/lib/services/ai/report-agent";
import {
  updateJobRunStatus,
  markJobRunFailed,
  markJobRunCompleted,
  markUsageConsumed,
} from "@/lib/db/queries/job-runs";
import { consumeWorkflowUsage } from "@/lib/db/queries/access";

export const analyzeJobPost = inngest.createFunction(
  {
    id: "analyze-linkedin-job-post",
    retries: 1,
    concurrency: {
      limit: 10,
    },
    triggers: [{ event: "job/analyze.requested" }],
  },
  async ({ event, step }) => {
    const data = event.data as JobAnalyzeEventData;
    const { runId, userId, url, language, workflowSlug = "job-xray" } = data;

    // Step 1: Validate and expand URL (SSRF-protected)
    const normalizedUrl = await step.run("expand-url", async () => {
      await updateJobRunStatus(runId, "validating");
      const result = await expandLinkedInUrl(url);
      if (isErr(result)) {
        await markJobRunFailed(runId, result.error.code, result.error.safeMessage);
        throw new Error(result.error.safeMessage);
      }
      return result.data;
    });

    // Step 2: Scrape post data (fail fast if empty)
    const rawPost = await step.run("scrape-post", async () => {
      await updateJobRunStatus(runId, "scraping_post");
      const result = await scrapePost(normalizedUrl);
      if (isErr(result)) {
        await markJobRunFailed(runId, result.error.code, result.error.safeMessage);
        throw new Error(result.error.safeMessage);
      }
      return result.data;
    });

    // Step 3: Scrape enrichment (Author & Company)
    const enrichment = await step.run("scrape-enrichment", async () => {
      let rawAuthor = null;
      const authorUrl = rawPost.author?.profile_url;

      if (authorUrl && !isCompanyAuthor(rawPost.author)) {
        await updateJobRunStatus(runId, "scraping_author");
        const authorResult = await scrapeAuthor(authorUrl);
        if (isOk(authorResult)) {
          rawAuthor = authorResult.data;
        }
      }

      await updateJobRunStatus(runId, "scraping_company");
      const authorCompanyUrl =
        rawAuthor?.currentPosition?.[0]?.companyLinkedinUrl ||
        (rawAuthor?.currentPosition && rawAuthor.currentPosition.length > 0
          ? rawAuthor.currentPosition[rawAuthor.currentPosition.length - 1]?.companyLinkedinUrl
          : undefined);

      const companyIdOrUrl =
        rawPost.companyLinkedinUrl ||
        rawPost.company_url ||
        authorCompanyUrl ||
        (rawPost.company_id ? String(rawPost.company_id) : "") ||
        (rawPost.author?.company_id ? String(rawPost.author.company_id) : "");

      let rawCompany = null;
      if (companyIdOrUrl) {
        const companyResult = await scrapeCompany(companyIdOrUrl);
        if (isOk(companyResult)) {
          rawCompany = companyResult.data;
        }
      }

      return { rawAuthor, rawCompany };
    });

    // Step 4: Normalize scraped payload
    const normalizedPayload = await step.run("normalize-payload", async () => {
      return normalizeScrapedData({
        url: normalizedUrl,
        post: rawPost,
        author: enrichment.rawAuthor,
        company: enrichment.rawCompany,
      });
    });

    // Step 5: Generate AI intelligence report
    const reportOutput = await step.run("generate-ai-report", async () => {
      await updateJobRunStatus(runId, "generating_report");
      const result = await generateReport({
        payload: normalizedPayload,
        language,
      });

      if (isErr(result)) {
        await markJobRunFailed(runId, result.error.code, result.error.safeMessage);
        throw new Error(result.error.safeMessage);
      }
      return result.data;
    });

    // Step 6: Mark job completed
    await step.run("persist-completed-report", async () => {
      await markJobRunCompleted(
        runId,
        reportOutput.report,
        reportOutput.telegramReport
      );
      await updateJobRunStatus(runId, "completed");
    });

    // Step 7: Atomic usage consumption (ONLY after successful delivery)
    await step.run("consume-quota", async () => {
      await consumeWorkflowUsage(userId, workflowSlug);
      await markUsageConsumed(runId);
    });

    return {
      runId,
      status: "completed",
      report: reportOutput,
    };
  }
);
