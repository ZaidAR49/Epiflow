import "server-only";
import { logger } from "@/lib/logger";
import { authenticateGatekeeper } from "@/lib/db/queries/access";
import {
  getWorkflowDecryptedRefreshToken,
  touchWorkflowCredential,
} from "@/lib/db/queries/credentials";
import { executeDraftCreation } from "../email/compose-draft";
import { sendTelegramMessage, editTelegramMessage } from "./bot-client";
import type { TelegramCallbackQuery } from "@/lib/validation/telegram";
import { isOk } from "@/lib/result";

/**
 * Handles Telegram callback queries (e.g. Yes/No to draft email prompt)
 * strictly implementing the callback branch of job-xray.json.
 */
export async function handleTelegramCallbackQuery(
  callback: TelegramCallbackQuery
): Promise<void> {
  const telegramId = callback.from.id;
  const username = callback.from.username ?? null;
  const data = callback.data; // "yes" or "no"
  const message = callback.message;
  const chatId = message?.chat.id ?? telegramId;
  const messageId = message?.message_id;

  logger.info({ telegramId, data }, "Handling Telegram callback query");

  // If user declined email drafting ("no")
  if (data === "no") {
    if (messageId) {
      await editTelegramMessage(
        chatId,
        messageId,
        "👌 تم إلغاء تجهيز البريد الإلكتروني."
      );
    }
    return;
  }

  if (data !== "yes") return;

  // 1. Authenticate Gatekeeper (Rule 6.2: user at quota may still draft email)
  const auth = await authenticateGatekeeper(telegramId, "job-xray", username);
  if (!auth.userId && auth.errorCode !== "QUOTA_EXCEEDED") {
    await sendTelegramMessage(
      chatId,
      "⚠️ لا يمكنك تنفيذ هذا الإجراء حالياً. يرجى مراجعة المسؤول.",
      { isRtl: true }
    );
    return;
  }

  // 1b. Verify sendEmail is enabled for this profile
  if (!auth.sendEmail) {
    await sendTelegramMessage(
      chatId,
      "ℹ️ ميزة إنشاء مسودة البريد الإلكتروني غير مفعّلة لهذا الحساب.",
      { isRtl: true }
    );
    return;
  }

  // 2. Extract metadata from message entities or stringified payload
  let metadata: {
    role?: string;
    company?: string;
    hr_name?: string;
    hr_email?: string;
  } | null = null;

  // Check text_link entity
  const linkEntity = message?.entities?.find(
    (e) => e.type === "text_link" && (e.url?.includes("hidden.data") ?? false)
  );
  const targetUrl = linkEntity?.url;

  // Check full stringified payload as fallback
  const rawString = JSON.stringify(callback);
  const metaMatch = targetUrl
    ? targetUrl.match(/meta=([^"\s}\]]+)/)
    : rawString.match(/https:\\\/\\\/hidden\\.data\\\/\\\?meta=([^"\\s}\]]+)|https:\/\/hidden\.data\/\?meta=([^"\s}\]]+)/);

  const encodedJson = targetUrl
    ? metaMatch?.[1]
    : metaMatch?.[1] || metaMatch?.[2];

  if (encodedJson) {
    try {
      metadata = JSON.parse(decodeURIComponent(encodedJson));
    } catch {
      // Fallback
    }
  }

  if (!metadata?.hr_email) {
    await sendTelegramMessage(
      chatId,
      "⚠️ تعذر العثور على بيانات البريد الإلكتروني للمنشور.",
      { isRtl: true }
    );
    return;
  }

  // 3. Status notification
  if (messageId) {
    await editTelegramMessage(
      chatId,
      messageId,
      "⏳ **جاري تجهيز مسودة البريد الإلكتروني وتحميل السيرة الذاتية...**",
      { isRtl: true }
    );
  }

  // 4. Download CV & Create Gmail Draft
  let userRefreshToken: string | null = null;
  if (auth.userId) {
    try {
      userRefreshToken = await getWorkflowDecryptedRefreshToken(
        auth.userId,
        "job-xray",
        "google"
      );
    } catch {
      // Ignored: Fallback will be checked
    }
  }
  const effectiveRefreshToken = userRefreshToken || process.env.GOOGLE_REFRESH_TOKEN;

  const draftResult = await executeDraftCreation({
    role: metadata.role || "Job Opportunity",
    company: metadata.company || "Company",
    hrName: metadata.hr_name,
    hrEmail: metadata.hr_email,
    fullName: auth.fullName || auth.firstName || "Applicant",
    cvUrl: auth.cvUrl,
    googleRefreshToken: effectiveRefreshToken,
  });

  if (isOk(draftResult)) {
    if (auth.userId && userRefreshToken) {
      void touchWorkflowCredential(auth.userId, "job-xray", "google").catch(() => {});
    }

    const { draftUrl } = draftResult.data;
    const isRtl = auth.preferredLanguage !== "en";
    const readyText = isRtl
      ? `✅ **تم تجهيز مسودة البريد الإلكتروني بنجاح!**\n\nيمكنك مراجعتها وتعديلها وإرسالها عبر الرابط التالي:\n[فتح المسودة في Gmail](${draftUrl})`
      : `✅ **Email draft is ready!**\n\nYou can review, edit, and send it via the link below:\n[Open Draft in Gmail](${draftUrl})`;

    if (messageId) {
      await editTelegramMessage(chatId, messageId, readyText, { isRtl });
    } else {
      await sendTelegramMessage(chatId, readyText, { isRtl });
    }
  } else {
    const errorText = `❌ تعذر إنشاء مسودة البريد الإلكتروني في Gmail: ${draftResult.error.safeMessage}`;
    if (messageId) {
      await editTelegramMessage(chatId, messageId, errorText, { isRtl: true });
    } else {
      await sendTelegramMessage(chatId, errorText, { isRtl: true });
    }
  }
}
