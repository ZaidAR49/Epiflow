import "server-only";
import { logger } from "@/lib/logger";
import { isErr, isOk } from "@/lib/result";
import { LINKEDIN_URL_REGEX } from "@/lib/validation/url";
import { authenticateGatekeeper, consumeWorkflowUsage } from "@/lib/db/queries/access";
import { createJobRun, markJobRunFailed, markJobRunCompleted, markUsageConsumed } from "@/lib/db/queries/job-runs";
import { expandLinkedInUrl } from "../scraper/url-expander";
import { scrapePost, scrapeAuthor, scrapeCompany } from "../scraper/apify";
import { normalizeScrapedData, isCompanyAuthor } from "../scraper/normalize";
import { generateReport } from "../ai/report-agent";
import {
  sendTelegramMessage,
  editTelegramMessage,
} from "./bot-client";
import { TelegramMessages } from "./formatters";
import type { TelegramMessage } from "@/lib/validation/telegram";

/**
 * Handles incoming Telegram messages: verifies gatekeeper access,
 * manages real-time status updates via editMessageText, delivers AI reports,
 * and consumes quota atomically upon success.
 */
export async function handleTelegramMessage(message: TelegramMessage): Promise<void> {
  const telegramId = message.from?.id;
  const username = message.from?.username ?? null;
  const text = message.text || message.caption || "";
  const chatId = message.chat.id;

  if (!telegramId) return;

  // 1. Extract and validate LinkedIn URL
  const match = text.match(LINKEDIN_URL_REGEX);
  if (!match || !match[0]) {
    await sendTelegramMessage(chatId, TelegramMessages.ar.invalidUrl, { isRtl: true });
    return;
  }
  const rawUrl = match[0];

  // 2. Authenticate Gatekeeper (Read-only access check)
  const auth = await authenticateGatekeeper(telegramId, "job-xray", username);
  const lang: "ar" | "en" = "ar"; // default to Arabic for Telegram bot
  const isRtl = lang === "ar";

  if (!auth.isAuthorized || !auth.userId) {
    const errorMsg =
      auth.errorCode === "QUOTA_EXCEEDED"
        ? "⚠️ لقد استنفدت الحد المسموح به من الفحوصات لهذه الفترة."
        : auth.errorCode === "UNREGISTERED"
          ? "⚠️ حسابك غير مسجل في الخدمة. يرجى التواصل مع المسؤول للحصول على إذن الوصول."
          : `⚠️ لا يمكن تنفيذ الطلب: (${auth.errorCode})`;

    await sendTelegramMessage(chatId, errorMsg, { isRtl });
    return;
  }

  const userId = auth.userId;

  // 3. Send initial progress message to chat
  const statusMsgResult = await sendTelegramMessage(
    chatId,
    TelegramMessages[lang].validating,
    { isRtl }
  );

  const statusMessageId = isOk(statusMsgResult)
    ? statusMsgResult.data.message_id
    : null;

  // Helper to edit status in-place
  async function updateStatus(statusText: string) {
    if (statusMessageId) {
      const editRes = await editTelegramMessage(chatId, statusMessageId, statusText, { isRtl });
      if (!isOk(editRes)) {
        logger.warn({ err: editRes.error, chatId, statusMessageId }, "Failed to update Telegram status");
      }
    }
  }

  // 4. Create initial Job Run
  const run = await createJobRun({
    userId,
    channel: "telegram",
    url: rawUrl,
    normalizedUrl: rawUrl,
    status: "pending",
  });

  try {
    // Step A: Expand short URL
    const expandResult = await expandLinkedInUrl(rawUrl);
    if (isErr(expandResult)) {
      await updateStatus("⚠️ الرابط المدخل غير صالح أو تعذر الوصول إليه.");
      await markJobRunFailed(run.id, expandResult.error.code, expandResult.error.safeMessage);
      return;
    }
    const normalizedUrl = expandResult.data;

    // Step B: Scrape Post
    await updateStatus(TelegramMessages[lang].scrapingPost);
    const postResult = await scrapePost(normalizedUrl);
    if (isErr(postResult)) {
      await updateStatus(TelegramMessages[lang].scrapeEmpty);
      await markJobRunFailed(run.id, postResult.error.code, postResult.error.safeMessage);
      return;
    }
    const rawPost = postResult.data;

    // Step C: Scrape Author & Company
    await updateStatus(TelegramMessages[lang].enriching);
    let rawAuthor = null;
    const authorUrl = rawPost.author?.profile_url;
    if (authorUrl && !isCompanyAuthor(rawPost.author)) {
      const authorRes = await scrapeAuthor(authorUrl);
      if (isOk(authorRes)) rawAuthor = authorRes.data;
    }

    let rawCompany = null;
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
    if (companyUrl) {
      const compRes = await scrapeCompany(companyUrl);
      if (isOk(compRes)) rawCompany = compRes.data;
    }

    // Step D: Normalize & AI Generation
    await updateStatus(TelegramMessages[lang].generating);
    const normalizedPayload = normalizeScrapedData({
      url: normalizedUrl,
      post: rawPost,
      author: rawAuthor,
      company: rawCompany,
    });

    const aiResult = await generateReport({ payload: normalizedPayload, language: lang });
    if (isErr(aiResult)) {
      await updateStatus(TelegramMessages[lang].failed);
      await markJobRunFailed(run.id, aiResult.error.code, aiResult.error.safeMessage);
      return;
    }
    const reportOutput = aiResult.data;

    // Step E: Deliver finalized Markdown report to Telegram
    await sendTelegramMessage(chatId, reportOutput.telegramReport, { isRtl });

    // Mark completed & consume quota atomically
    await markJobRunCompleted(run.id, reportOutput.report, reportOutput.telegramReport);
    await consumeWorkflowUsage(userId, "job-xray");
    await markUsageConsumed(run.id);

    // Delete or complete status message
    await updateStatus(TelegramMessages[lang].completed);

    // Step F: Send Email branch matching job-xray.json
    if (auth.sendEmail) {
      if (reportOutput.metadata.hrEmail) {
        const metadataJson = JSON.stringify({
          role: reportOutput.metadata.role,
          company: reportOutput.metadata.company,
          hr_name: reportOutput.metadata.hrName,
          hr_email: reportOutput.metadata.hrEmail,
        });

        const promptText = isRtl
          ? `هل ترغب في أن نجهز لك مسودة بريد إلكتروني للتقديم؟<a href="https://hidden.data/?meta=${encodeURIComponent(metadataJson)}">&#8203;</a>`
          : `Do you want us to prepare an email draft for your application?<a href="https://hidden.data/?meta=${encodeURIComponent(metadataJson)}">&#8203;</a>`;

        await sendTelegramMessage(chatId, promptText, {
          parseMode: "HTML",
          isRtl,
          replyMarkup: {
            inline_keyboard: [
              [
                { text: isRtl ? "نعم ✅" : "Yes ✅", callback_data: "yes" },
                { text: isRtl ? "لا ❌" : "No ❌", callback_data: "no" },
              ],
            ],
          },
        });
      } else {
        const noEmailNotice = isRtl
          ? "ℹ️ **تنبيه:** لم يقم الناشر بتضمين بريد إلكتروني للتواصل أو التقديم المباشر في تفاصيل المنشور."
          : "ℹ️ **Notice:** The author did not include an email address for direct application or contact in the post details.";
        await sendTelegramMessage(chatId, noEmailNotice, { isRtl });
      }
    } else {
      const disabledNotice = isRtl
        ? "ℹ️ ميزة إنشاء مسودة البريد الإلكتروني غير مفعّلة لهذا الحساب."
        : "ℹ️ Email drafting feature is disabled for this profile.";
      await sendTelegramMessage(chatId, disabledNotice, { isRtl });
    }
  } catch (error) {
    logger.error({ error, runId: run.id }, "Error handling Telegram update");
    await updateStatus(TelegramMessages[lang].failed);
    await markJobRunFailed(run.id, "INTERNAL_ERROR", "Unexpected processing error");
  }
}
