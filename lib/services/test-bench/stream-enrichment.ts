import "server-only";
import type { WorkflowNode, ExecutionLogItem, SSEWorkflowEvent } from "@/types/test-bench";
import { scrapePost, scrapeAuthor, scrapeCompany } from "../scraper/apify";
import { normalizeScrapedData, isCompanyAuthor } from "../scraper/normalize";
import { generateReport } from "../ai/report-agent";
import { isOk } from "@/lib/result";
import { consumeWorkflowUsage, type GatekeeperAuthResult } from "@/lib/db/queries/access";
import { sendTelegramMessage, editTelegramMessage } from "../telegram/bot-client";
import { handleStreamEmailPrompt } from "./stream-email-prompt";

export interface StreamContext {
  normalizedUrl: string;
  telegramId: number;
  sendToTelegram: boolean;
  auth: GatekeeperAuthResult;
  statusChatMsgId: string;
  telegramStatusMessageId?: number | null;
  t0: number;
  emit: (event: SSEWorkflowEvent) => Promise<void>;
  log: (nodeId: string, level: ExecutionLogItem["level"], message: string) => Promise<void>;
  finishNode: (
    id: string,
    status: WorkflowNode["status"],
    durationMs: number,
    inputJson?: unknown,
    outputJson?: unknown,
    error?: string
  ) => Promise<WorkflowNode>;
}

export async function executeStreamScrapingAndAi(ctx: StreamContext): Promise<boolean> {
  const {
    normalizedUrl,
    telegramId,
    sendToTelegram,
    auth,
    statusChatMsgId,
    telegramStatusMessageId,
    emit,
    log,
    finishNode,
  } = ctx;
  const isRtl = (auth.preferredLanguage ?? "ar") === "ar";

  const updateStatus = async (text: string) => {
    // 1. Update in-browser chat simulator
    await emit({ type: "chat_edit", messageId: statusChatMsgId, text });

    // 2. Update Telegram status message in-place
    if (sendToTelegram && telegramStatusMessageId) {
      const editRes = await editTelegramMessage(telegramId, telegramStatusMessageId, text, { isRtl });
      if (!isOk(editRes)) {
        await log("node_change_status", "warn", `Telegram status edit note: ${editRes.error.safeMessage}`);
      }
    }
  };

  // 9 & 10. Apify Fetch Post Data
  const tPost = Date.now();
  await emit({ type: "node_start", nodeId: "node_apify_post", inputJson: { url: normalizedUrl } });
  await log("node_apify_post", "info", "Executing Apify Post Scraper (actor d0DhjXPjkkwm4W5xK)...");
  const postRes = await scrapePost(normalizedUrl);
  if (!isOk(postRes)) {
    await finishNode("node_apify_post", "failed", Date.now() - tPost, { url: normalizedUrl }, {}, postRes.error.safeMessage);
    await finishNode("node_is_post_empty", "failed", 1, {}, { empty: true });
    await log("node_apify_post", "error", `Scraping failed: ${postRes.error.safeMessage}`);
    return false;
  }
  const rawPost = postRes.data;
  const postLength = rawPost.text?.length ?? 0;
  await finishNode("node_apify_post", "completed", Date.now() - tPost, { url: normalizedUrl }, rawPost);
  await finishNode("node_is_post_empty", "completed", 2, { textLen: postLength }, { empty: false });
  await log("node_apify_post", "success", `Post scraped (${postLength} chars)`);

  const enrichingText = isRtl
    ? "🔍 **تم استخراج المنشور!** جاري الآن فحص وتدقيق بيانات الشركة والمسؤول..."
    : "🔍 **Post extracted!** Enriching company and recruiter profile...";
  await updateStatus(enrichingText);

  // 11 & 12. Author scraping branch
  const authorUrl = rawPost.author?.profile_url;
  const isCompany = isCompanyAuthor(rawPost.author);
  await finishNode("node_is_company_author", "completed", 2, { authorUrl, companyId: rawPost.author?.company_id }, { isCompany });

  let rawAuthor = null;
  if (!isCompany && authorUrl) {
    const tAuth = Date.now();
    await emit({ type: "node_start", nodeId: "node_apify_author", inputJson: { authorUrl } });
    await log("node_apify_author", "info", "Executing Apify Author Scraper (actor LpVuK3Zozwuipa5bp)...");
    const authorRes = await scrapeAuthor(authorUrl);
    if (isOk(authorRes)) {
      rawAuthor = authorRes.data;
      await finishNode("node_apify_author", "completed", Date.now() - tAuth, { authorUrl }, rawAuthor);
      await log("node_apify_author", "success", `Author scraped: ${rawAuthor.name || "Recruiter"}`);
    } else {
      await finishNode("node_apify_author", "failed", Date.now() - tAuth, { authorUrl }, {}, authorRes.error.safeMessage);
    }
  } else {
    await finishNode("node_apify_author", "skipped", 0, { authorUrl }, { skipped: true, reason: "Company posted directly" });
    await log("node_apify_author", "info", "Skipped Author Scraper: post was made directly by company profile");
  }

  // 13 & 14. Company Scraping: Resolve company target from post or author's current position (matches job-xray.json Format Company ID / URL)
  const authorCompanyUrl =
    rawAuthor?.currentPosition?.[0]?.companyLinkedinUrl ||
    (rawAuthor?.currentPosition && rawAuthor.currentPosition.length > 0
      ? rawAuthor.currentPosition[rawAuthor.currentPosition.length - 1]?.companyLinkedinUrl
      : undefined);

  const companyUrl =
    rawPost.companyLinkedinUrl ||
    rawPost.company_url ||
    authorCompanyUrl ||
    (rawPost.company_id ? String(rawPost.company_id) : "") ||
    (rawPost.author?.company_id ? String(rawPost.author.company_id) : "");
  await finishNode("node_format_company", "completed", 2, { rawAuthorCompanyUrl: authorCompanyUrl }, { resolvedCompanyTarget: companyUrl });

  let rawCompany = null;
  if (companyUrl) {
    const tComp = Date.now();
    await emit({ type: "node_start", nodeId: "node_apify_company", inputJson: { companyUrl } });
    await log("node_apify_company", "info", "Executing Apify Company Scraper (actor UwSdACBp7ymaGUJjS)...");
    const compRes = await scrapeCompany(companyUrl);
    if (isOk(compRes)) {
      rawCompany = compRes.data;
      await finishNode("node_apify_company", "completed", Date.now() - tComp, { companyUrl }, rawCompany);
      await log("node_apify_company", "success", `Company scraped: ${rawCompany.name ?? "Company"}`);
    } else {
      await finishNode("node_apify_company", "failed", Date.now() - tComp, { companyUrl }, {}, compRes.error.safeMessage);
    }
  } else {
    await finishNode("node_apify_company", "skipped", 0, null, { skipped: true });
  }

  // 14b. Change process Status (matches node 'Change process Status' from job-xray.json)
  const tStatus = Date.now();
  await emit({ type: "node_start", nodeId: "node_change_status" });
  const dataCollectedText = isRtl
    ? "✅ **تم جمع البيانات بنجاح!** جاري الآن تحليل تفاصيل الوظيفة والشركة..."
    : "✅ **Data collected successfully!** Now analyzing the job and company details...";
  await updateStatus(dataCollectedText);
  await finishNode(
    "node_change_status",
    "completed",
    Date.now() - tStatus,
    { status: "data_collected" },
    { updated: true, text: dataCollectedText }
  );
  await log("node_change_status", "success", "Updated workflow status in chat & Telegram");

  // 15. Extract Key Data
  const tNorm = Date.now();
  await emit({ type: "node_start", nodeId: "node_extract_data" });
  const normalizedPayload = normalizeScrapedData({
    url: normalizedUrl,
    post: rawPost,
    author: rawAuthor,
    company: rawCompany,
  });
  await finishNode("node_extract_data", "completed", Date.now() - tNorm, { rawPost, rawAuthor, rawCompany }, normalizedPayload);
  await log("node_extract_data", "success", "Scraped data normalized into clean schema");

  // 16. AI: Generate Report
  const tAi = Date.now();
  await emit({ type: "node_start", nodeId: "node_ai_generate" });
  await log("node_ai_generate", "info", "Google Gemini 3.8 Flash generating structured report & metadata...");
  const aiResult = await generateReport({ payload: normalizedPayload, language: auth.preferredLanguage ?? "ar" });
  if (!isOk(aiResult)) {
    await finishNode("node_ai_generate", "failed", Date.now() - tAi, normalizedPayload, {}, aiResult.error.safeMessage);
    await log("node_ai_generate", "error", `AI generation failed: ${aiResult.error.safeMessage}`);
    return false;
  }
  const reportData = aiResult.data;
  await finishNode("node_ai_generate", "completed", Date.now() - tAi, normalizedPayload, reportData);
  await log("node_ai_generate", "success", "Report synthesized successfully");

  // 17. Send Report
  await emit({
    type: "chat_message",
    message: {
      id: `report_${Date.now()}`,
      sender: "bot",
      text: reportData.telegramReport,
      timestamp: new Date().toLocaleTimeString(),
    },
  });

  if (sendToTelegram) {
    await sendTelegramMessage(telegramId, reportData.telegramReport, { isRtl });
  }
  await finishNode("node_send_report", "completed", 15, { report: reportData.telegramReport.slice(0, 100) + "..." }, { delivered: true });

  // 17b. Finalize status message to completed
  const completedText = isRtl
    ? "✅ **تم اكتمال التحليل وتوليد التقرير بنجاح!**"
    : "✅ **Analysis and report generation complete!**";
  await updateStatus(completedText);

  // 18. Increment Usage
  const tUsage = Date.now();
  await emit({ type: "node_start", nodeId: "node_increment_usage" });
  if (auth.userId) {
    const usageRes = await consumeWorkflowUsage(auth.userId, "job-xray");
    await finishNode("node_increment_usage", "completed", Date.now() - tUsage, { userId: auth.userId }, usageRes);
    await log("node_increment_usage", "success", `Quota decremented. Remaining quota: ${usageRes.remainingQuota}`);
  } else {
    await finishNode("node_increment_usage", "completed", 5, {}, { simulated: true });
  }

  // 19 - 21. Check preferences, HR email, and prompt
  await handleStreamEmailPrompt({
    reportData,
    sendEmailPref: Boolean(auth.sendEmail),
    isRtl,
    sendToTelegram,
    telegramId,
    emit,
    log,
    finishNode,
  });

  return true;
}
