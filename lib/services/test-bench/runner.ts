import "server-only";
import { getInitialWorkflowNodes } from "./initial-nodes";
import type { WorkflowExecutionTrace, WorkflowNode, ExecutionLogItem } from "@/types/test-bench";
import { authenticateGatekeeper, consumeWorkflowUsage } from "@/lib/db/queries/access";
import { expandLinkedInUrl } from "../scraper/url-expander";
import { scrapePost, scrapeAuthor, scrapeCompany } from "../scraper/apify";
import { normalizeScrapedData, isCompanyAuthor } from "../scraper/normalize";
import { generateReport } from "../ai/report-agent";
import { isOk } from "@/lib/result";
import { LINKEDIN_URL_REGEX } from "@/lib/validation/url";
import { sendTelegramMessage, editTelegramMessage } from "../telegram/bot-client";

export interface RunWorkflowParams {
  rawUrl: string;
  telegramId?: number;
  username?: string | null;
  mode?: "live" | "preset_with_email" | "preset_without_email" | "preset_company";
}

export async function executeTestBenchWorkflow(
  params: RunWorkflowParams
): Promise<WorkflowExecutionTrace> {
  const runId = `trace_${Date.now()}`;
  const startTime = new Date().toISOString();
  const nodes = getInitialWorkflowNodes();
  const logs: ExecutionLogItem[] = [];

  const log = (nodeId: string, level: ExecutionLogItem["level"], message: string) => {
    logs.push({ id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, timestamp: new Date().toLocaleTimeString(), level, nodeId, message });
  };

  const setNode = (id: string, status: WorkflowNode["status"], durationMs: number, inputJson?: unknown, outputJson?: unknown, error?: string) => {
    const node = nodes.find((n) => n.id === id);
    if (node) Object.assign(node, { status, durationMs, inputJson, outputJson, error });
  };

  const telegramId = params.telegramId ?? 2076665816;
  const username = params.username ?? "zaidr49";
  const rawUrl = params.rawUrl;

  // 1. Trigger
  const t0 = Date.now();
  setNode("node_trigger", "running", 0, { rawUrl, telegramId });
  log("node_trigger", "info", `Received input URL: ${rawUrl}`);
  setNode("node_trigger", "completed", Date.now() - t0, { rawUrl }, { telegramId, rawUrl });

  // 2. Parse User Input
  const t1 = Date.now();
  const match = rawUrl.match(LINKEDIN_URL_REGEX);
  const isValid = !!match;
  setNode("node_parse_input", "running", 0);
  if (!isValid) {
    setNode("node_parse_input", "failed", Date.now() - t1, { rawUrl }, { isValid: false }, "Invalid LinkedIn URL");
    log("node_parse_input", "error", "Regex validation failed: not a valid LinkedIn post/job/lnkd.in URL");
    return { runId, startTime, status: "failed", nodes, logs };
  }
  setNode("node_parse_input", "completed", Date.now() - t1, { rawUrl }, { isValid: true, url: match[0] });
  log("node_parse_input", "success", "URL validated via regular expression");

  // 3. Authentication Gate
  const t2 = Date.now();
  setNode("node_auth_gate", "running", 0);
  const auth = await authenticateGatekeeper(telegramId, "job-xray", username);
  setNode("node_auth_gate", "completed", Date.now() - t2, { telegramId, workflow: "job-xray" }, auth);
  log("node_auth_gate", "info", `Gatekeeper check: authorized=${auth.isAuthorized}, quota=${auth.remainingQuota}`);

  // 4. Is Authenticated?
  const t3 = Date.now();
  if (!auth.isAuthorized && auth.errorCode !== "QUOTA_EXCEEDED") {
    setNode("node_is_auth", "failed", Date.now() - t3, auth, { allowed: false }, `Access Denied: ${auth.errorCode}`);
    log("node_is_auth", "error", `Gatekeeper blocked user with code: ${auth.errorCode}`);
    return { runId, startTime, status: "failed", nodes, logs };
  }
  setNode("node_is_auth", "completed", Date.now() - t3, auth, { allowed: true });

  // 5. Switch Router
  setNode("node_switch", "completed", 5, { route: "Generate Report" }, { branch: "Generate Report" });

  // 6 & 7. Short URL check & expansion
  const isShort = rawUrl.includes("lnkd.in");
  setNode("node_is_short_url", "completed", 2, { url: rawUrl }, { isShort });
  let normalizedUrl = rawUrl;
  if (isShort) {
    const tExp = Date.now();
    setNode("node_expand_url", "running", 0);
    const expandRes = await expandLinkedInUrl(rawUrl);
    if (isOk(expandRes)) {
      normalizedUrl = expandRes.data;
      setNode("node_expand_url", "completed", Date.now() - tExp, { rawUrl }, { normalizedUrl });
      log("node_expand_url", "success", `Short URL expanded to: ${normalizedUrl}`);
    } else {
      setNode("node_expand_url", "failed", Date.now() - tExp, { rawUrl }, {}, expandRes.error.safeMessage);
      return { runId, startTime, status: "failed", nodes, logs };
    }
  } else {
    setNode("node_expand_url", "skipped", 0, null, { skipped: true });
  }

  // 8. Send Process Status
  const isRtl = (auth.preferredLanguage ?? "ar") === "ar";
  const initialStatusText = isRtl
    ? "⏳ **تم استلام الرابط!** جاري الآن جلب بيانات المنشور. قد يستغرق هذا الأمر بضع دقائق..."
    : "⏳ **Link received!** I am currently fetching the post data. This might take a few minutes...";
  const sendRes = await sendTelegramMessage(telegramId, initialStatusText, { isRtl });
  const statusMessageId = isOk(sendRes) ? sendRes.data.message_id : null;
  setNode("node_send_status", "completed", 12, { status: "fetching" }, { delivered: true, messageId: statusMessageId });

  // 9 & 10. Apify Fetch Post Data & check empty
  const tPost = Date.now();
  setNode("node_apify_post", "running", 0);
  log("node_apify_post", "info", "Executing Apify Post Scraper (actor d0DhjXPjkkwm4W5xK)...");
  const postRes = await scrapePost(normalizedUrl);
  if (!isOk(postRes)) {
    setNode("node_apify_post", "failed", Date.now() - tPost, { url: normalizedUrl }, {}, postRes.error.safeMessage);
    setNode("node_is_post_empty", "failed", 1, {}, { empty: true });
    log("node_apify_post", "error", `Scraping failed: ${postRes.error.safeMessage}`);
    return { runId, startTime, status: "failed", nodes, logs };
  }
  const rawPost = postRes.data;
  const postLength = rawPost.text?.length ?? 0;
  setNode("node_apify_post", "completed", Date.now() - tPost, { url: normalizedUrl }, rawPost);
  setNode("node_is_post_empty", "completed", 2, { textLen: postLength }, { empty: false });
  log("node_apify_post", "success", `Post scraped (${postLength} chars)`);

  // 11 & 12. Author scraping branch
  const authorUrl = rawPost.author?.profile_url;
  const isCompany = isCompanyAuthor(rawPost.author);
  setNode("node_is_company_author", "completed", 2, { authorUrl }, { isCompany });

  let rawAuthor = null;
  if (!isCompany && authorUrl) {
    const tAuth = Date.now();
    setNode("node_apify_author", "running", 0);
    log("node_apify_author", "info", "Executing Apify Author Scraper (actor LpVuK3Zozwuipa5bp)...");
    const authorRes = await scrapeAuthor(authorUrl);
    if (isOk(authorRes)) {
      rawAuthor = authorRes.data;
      setNode("node_apify_author", "completed", Date.now() - tAuth, { authorUrl }, rawAuthor);
      log("node_apify_author", "success", `Author scraped: ${rawAuthor.name || "Recruiter"}`);
    } else {
      setNode("node_apify_author", "failed", Date.now() - tAuth, { authorUrl }, {}, authorRes.error.safeMessage);
    }
  } else {
    setNode("node_apify_author", "skipped", 0, { authorUrl }, { skipped: true, reason: "Company posted directly" });
    log("node_apify_author", "info", "Skipped Author Scraper: post was made directly by company profile");
  }

  // 13 & 14. Company Scraping
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
  setNode("node_format_company", "completed", 2, { companyUrl }, { resolvedCompanyTarget: companyUrl });

  let rawCompany = null;
  if (companyUrl) {
    const tComp = Date.now();
    setNode("node_apify_company", "running", 0);
    log("node_apify_company", "info", "Executing Apify Company Scraper (actor UwSdACBp7ymaGUJjS)...");
    const compRes = await scrapeCompany(companyUrl);
    if (isOk(compRes)) {
      rawCompany = compRes.data;
      setNode("node_apify_company", "completed", Date.now() - tComp, { companyUrl }, rawCompany);
      log("node_apify_company", "success", `Company scraped: ${rawCompany.name ?? "Company"}`);
    } else {
      setNode("node_apify_company", "failed", Date.now() - tComp, { companyUrl }, {}, compRes.error.safeMessage);
    }
  } else {
    setNode("node_apify_company", "skipped", 0, null, { skipped: true });
  }

  // 14b. Change process Status (node_change_status)
  const dataCollectedText = isRtl
    ? "✅ **تم جمع البيانات بنجاح!** جاري الآن تحليل تفاصيل الوظيفة والشركة..."
    : "✅ **Data collected successfully!** Now analyzing the job and company details...";
  if (statusMessageId) {
    await editTelegramMessage(telegramId, statusMessageId, dataCollectedText, { isRtl });
  }
  setNode("node_change_status", "completed", 5, { status: "data_collected" }, { updated: true });

  // 15. Extract Key Data
  const tNorm = Date.now();
  setNode("node_extract_data", "running", 0);
  const normalizedPayload = normalizeScrapedData({
    url: normalizedUrl,
    post: rawPost,
    author: rawAuthor,
    company: rawCompany,
  });
  setNode("node_extract_data", "completed", Date.now() - tNorm, { rawPost, rawAuthor, rawCompany }, normalizedPayload);
  log("node_extract_data", "success", "Scraped data normalized into clean schema");

  // 16. AI: Generate Report
  const tAi = Date.now();
  setNode("node_ai_generate", "running", 0);
  log("node_ai_generate", "info", "Google Gemini 3.8 Flash generating structured report & metadata...");
  const aiResult = await generateReport({ payload: normalizedPayload, language: auth.preferredLanguage ?? "ar" });
  if (!isOk(aiResult)) {
    setNode("node_ai_generate", "failed", Date.now() - tAi, normalizedPayload, {}, aiResult.error.safeMessage);
    log("node_ai_generate", "error", `AI generation failed: ${aiResult.error.safeMessage}`);
    return { runId, startTime, status: "failed", nodes, logs };
  }
  const reportData = aiResult.data;
  setNode("node_ai_generate", "completed", Date.now() - tAi, normalizedPayload, reportData);
  log("node_ai_generate", "success", "Report generated successfully with structured opportunity metadata");

  // 17. Send Report
  const sendReportRes = await sendTelegramMessage(telegramId, reportData.telegramReport, { isRtl });
  const delivered = isOk(sendReportRes);
  setNode("node_send_report", delivered ? "completed" : "failed", 15, { report: reportData.telegramReport.slice(0, 100) + "..." }, { delivered });
  log("node_send_report", delivered ? "success" : "warn", delivered ? `Report delivered to Telegram user ${telegramId}` : "Telegram report delivery failed");

  // 18. Increment Usage
  const tUsage = Date.now();
  setNode("node_increment_usage", "running", 0);
  if (auth.userId) {
    const usageRes = await consumeWorkflowUsage(auth.userId, "job-xray");
    setNode("node_increment_usage", "completed", Date.now() - tUsage, { userId: auth.userId }, usageRes);
    log("node_increment_usage", "success", `Quota decremented. Remaining quota: ${usageRes.remainingQuota}`);
  } else {
    setNode("node_increment_usage", "completed", 5, {}, { simulated: true });
  }

  // 19. Send Email ? (Preference check)
  const sendEmailPref = Boolean(auth.sendEmail);
  setNode("node_check_send_email_pref", "completed", 2, { sendEmail: sendEmailPref }, { proceed: sendEmailPref });

  const hrEmail = reportData.metadata.hrEmail;
  const hasEmail = Boolean(hrEmail);

  if (!sendEmailPref) {
    setNode("node_check_hr_email", "skipped", 0, { hrEmail: null }, { skipped: true, reason: "sendEmail is false" });
    setNode("node_ask_draft_email", "skipped", 0, { hrEmail: null }, { skipped: true, reason: "sendEmail is false" });
    log("node_check_send_email_pref", "warn", "Email drafting feature is disabled for this user profile");

    const disabledNotice = isRtl
      ? "ℹ️ ميزة إنشاء مسودة البريد الإلكتروني غير مفعّلة لهذا الحساب."
      : "ℹ️ Email drafting feature is disabled for this profile.";
    await sendTelegramMessage(telegramId, disabledNotice, { isRtl });
  } else {
    // 20. Check for HR Email
    setNode("node_check_hr_email", "completed", 2, { hrEmail }, { hasEmail });

    if (hasEmail) {
      const meta = encodeURIComponent(JSON.stringify({
        role: reportData.metadata.role, company: reportData.metadata.company,
        hr_name: reportData.metadata.hrName, hr_email: reportData.metadata.hrEmail,
      }));
      const promptText = isRtl
        ? `هل ترغب في أن نجهز لك مسودة بريد إلكتروني للتقديم؟<a href="https://hidden.data/?meta=${meta}">&#8203;</a>`
        : `Do you want us to prepare an email draft for your application?<a href="https://hidden.data/?meta=${meta}">&#8203;</a>`;

      await sendTelegramMessage(telegramId, promptText, {
        parseMode: "HTML",
        isRtl,
        replyMarkup: { inline_keyboard: [[{ text: isRtl ? "نعم ✅" : "Yes ✅", callback_data: "yes" }, { text: isRtl ? "لا ❌" : "No ❌", callback_data: "no" }]] },
      });
      setNode("node_ask_draft_email", "completed", 8, { hrEmail }, { promptShown: true });
      log("node_check_hr_email", "success", `HR application email verified: ${hrEmail}`);
      log("node_ask_draft_email", "success", `Interactive draft prompt sent to Telegram ID ${telegramId}`);
    } else {
      const noEmailNotice = isRtl
        ? "ℹ️ **تنبيه:** لم يقم الناشر بتضمين بريد إلكتروني للتواصل أو التقديم المباشر في تفاصيل المنشور."
        : "ℹ️ **Notice:** The author did not include an email address for direct application or contact in the post details.";
      await sendTelegramMessage(telegramId, noEmailNotice, { isRtl });
      setNode("node_ask_draft_email", "skipped", 0, { hrEmail: null }, { skipped: true, reason: "No email in post body" });
      log("node_check_hr_email", "warn", "No application email in post; notice sent to Telegram");
    }
  }

  return {
    runId,
    startTime,
    endTime: new Date().toISOString(),
    totalDurationMs: Date.now() - t0,
    status: "completed",
    nodes,
    logs,
    emailPromptActive: sendEmailPref && hasEmail,
    opportunityMetadata: {
      role: reportData.metadata.role,
      company: reportData.metadata.company,
      hrName: reportData.metadata.hrName,
      hrEmail: reportData.metadata.hrEmail,
    },
  };
}
