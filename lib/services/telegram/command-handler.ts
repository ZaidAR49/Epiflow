import "server-only";
import crypto from "crypto";
import { logger } from "@/lib/logger";
import { sendTelegramMessage } from "./bot-client";
import { verifyAndConsumeTelegramLinkToken } from "@/lib/db/queries/telegram-link";
import { linkTelegramToUser, getUserById, getUserByTelegramId } from "@/lib/db/queries/users";
import type { TelegramMessage } from "@/lib/validation/telegram";

/**
 * Checks if the message text represents a Telegram slash command.
 */
export function isTelegramCommand(text: string): boolean {
  return text.trim().startsWith("/");
}

/**
 * Handles incoming bot slash commands: /start, /connect, /help.
 * Returns true if handled, false if regular message.
 */
export async function handleTelegramCommand(message: TelegramMessage): Promise<boolean> {
  const text = (message.text || message.caption || "").trim();
  if (!isTelegramCommand(text)) return false;

  const telegramId = message.from?.id;
  const username = message.from?.username ?? null;
  const chatId = message.chat.id;

  if (!telegramId) return true;

  // 1. Account linking command: /start connect_<token>, /start <token>, /connect connect_<token>, or /connect <token>
  const linkMatch = text.match(/^\/(?:start|connect)\s+(?:connect_)?([a-f0-9]+)$/i);
  if (linkMatch && linkMatch[1]) {
    const rawToken = linkMatch[1].trim();
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    const userId = await verifyAndConsumeTelegramLinkToken(tokenHash);
    if (!userId) {
      await sendTelegramMessage(
        chatId,
        "⚠️ رمز الربط غير صالح أو انتهت صلاحيته (الصلاحية 10 دقائق).\n\nيرجى فتح صفحة الملف الشخصي على الموقع وتوليد رابط جديد.",
        { isRtl: true }
      );
      return true;
    }

    try {
      await linkTelegramToUser(userId, telegramId, username);
      const user = await getUserById(userId);
      const name = user?.fullName || "مستخدم JobPost X-Ray";

      await sendTelegramMessage(
        chatId,
        `🎉 <b>تم ربط حسابك في JobPost X-Ray بنجاح!</b>\n\nمرحباً بك يا <b>${name}</b>.\nأصبح بإمكانك الآن إرسال أي رابط لمنشور وظيفة من LinkedIn، وسأقوم بتحليله واستخراج كافة التفاصيل لك فوراً! 🚀`,
        { isRtl: true, parseMode: "HTML" }
      );
      logger.info({ userId, telegramId, username }, "Successfully linked Telegram account via deep link");
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      logger.error({ err, errorMsg, userId, telegramId }, "Failed to link Telegram account");
      await sendTelegramMessage(
        chatId,
        "⚠️ حدث خطأ أثناء ربط الحساب. يرجى المحاولة مرة أخرى لاحقاً.",
        { isRtl: true }
      );
    }
    return true;
  }

  // 2. Base /start or /connect command without token
  if (text === "/start" || text === "/connect") {
    const existingUser = await getUserByTelegramId(telegramId);
    if (existingUser) {
      await sendTelegramMessage(
        chatId,
        `👋 <b>أهلاً بك مجدداً يا ${existingUser.fullName}!</b>\n\nحسابك مربوط وجاهز للاستخدام. كل ما عليك فعله هو إرسال أي رابط لمنشور وظيفة من LinkedIn هنا، وسأقوم بتحليله واستخراج كافة البيانات لك فوراً.`,
        { isRtl: true, parseMode: "HTML" }
      );
    } else {
      const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://jobpostxray.com";
      await sendTelegramMessage(
        chatId,
        `👋 <b>أهلاً بك في JobPost X-Ray!</b>\n\nحسابك على تيليجرام غير مربوط بحسابك على الموقع بعد.\n\n🔗 <b>لربط حسابك بضغطة واحدة:</b>\n1. توجّه إلى صفحة <b>الملف الشخصي</b> على الموقع:\n   ${siteUrl}/profile\n2. اضغط على زر <b>ربط حساب تيليجرام</b>.\n3. اضغط على الرابط المباشر أو انسخ الأمر والصقه هنا وسيتصل حسابك تلقائياً!`,
        { isRtl: true, parseMode: "HTML" }
      );
    }
    return true;
  }

  // 3. /help command
  if (text === "/help") {
    await sendTelegramMessage(
      chatId,
      `ℹ️ <b>كيفية استخدام JobPost X-Ray:</b>\n\n1. انسخ رابط أي منشور وظيفة من LinkedIn.\n2. أرسل الرابط مباشرة في هذه المحادثة.\n3. سيقوم البوت بتحليل المنشور، التحقق من جهة التوظيف، وتجهيز مسودة بريد إلكتروني تلقائياً.\n\nلإدارة حسابك وحصتك الشهرية، تفضل بزيارة الموقع.`,
      { isRtl: true, parseMode: "HTML" }
    );
    return true;
  }

  // Unknown command
  await sendTelegramMessage(
    chatId,
    "ℹ️ أرسل رابط منشور LinkedIn لتحليله، أو اكتب /help للمساعدة.",
    { isRtl: true }
  );
  return true;
}
