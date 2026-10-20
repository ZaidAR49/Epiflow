import "server-only";
import { AppError, ErrorCodes } from "@/lib/errors";
import { ok, err, type Result } from "@/lib/result";
import { logger } from "@/lib/logger";
import { markdownToTelegramHtml, stripHtmlTags } from "./formatters";

const TELEGRAM_API_BASE = "https://api.telegram.org";

interface TelegramSendOptions {
  parseMode?: "Markdown" | "MarkdownV2" | "HTML";
  isRtl?: boolean;
  replyMarkup?: Record<string, unknown>;
}

interface TelegramMessageResponse {
  message_id: number;
  chat: { id: number };
}

function getBotToken(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new AppError(
      ErrorCodes.INTERNAL_ERROR,
      500,
      "TELEGRAM_BOT_TOKEN is not configured"
    );
  }
  return token;
}

async function callTelegramApi<T>(
  method: string,
  body: Record<string, unknown>,
  retries = 2
): Promise<Result<T, AppError>> {
  const token = getBotToken();
  const url = `${TELEGRAM_API_BASE}/bot${token}/${method}`;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status === 429) {
        const errorData = (await response.json().catch(() => ({}))) as {
          parameters?: { retry_after?: number };
        };
        const retryAfter = errorData.parameters?.retry_after ?? 2;
        logger.warn({ retryAfter, method }, "Telegram rate limit hit, backing off");
        await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
        continue;
      }

      const data = (await response.json()) as {
        ok: boolean;
        result: T;
        description?: string;
      };

      if (!data.ok) {
        return err(
          new AppError(
            ErrorCodes.INTERNAL_ERROR,
            502,
            data.description || "Telegram API call failed"
          )
        );
      }

      return ok(data.result);
    } catch (error) {
      if (attempt === retries) {
        return err(
          new AppError(
            ErrorCodes.INTERNAL_ERROR,
            502,
            "Network failure communicating with Telegram",
            { cause: error }
          )
        );
      }
      await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }

  return err(
    new AppError(ErrorCodes.INTERNAL_ERROR, 502, "Telegram API max retries exceeded")
  );
}

export async function sendTelegramMessage(
  chatId: number,
  text: string,
  options?: TelegramSendOptions
): Promise<Result<TelegramMessageResponse, AppError>> {
  const isMarkdownV2 = options?.parseMode === "MarkdownV2";
  const parseMode = isMarkdownV2 ? "MarkdownV2" : "HTML";
  const payloadText = isMarkdownV2
    ? text.slice(0, 4000)
    : markdownToTelegramHtml(text, { isRtl: options?.isRtl });

  const result = await callTelegramApi<TelegramMessageResponse>("sendMessage", {
    chat_id: chatId,
    text: payloadText,
    parse_mode: parseMode,
    reply_markup: options?.replyMarkup,
    ...(options?.isRtl ? { is_rtl: true } : {}),
  });

  if (!result.success) {
    logger.warn(
      { error: result.error.safeMessage, chatId },
      "Telegram formatted message failed, falling back to clean text"
    );
    // Fallback: send as plain text with HTML stripped
    const plainText = stripHtmlTags(text).slice(0, 4000);
    return callTelegramApi<TelegramMessageResponse>("sendMessage", {
      chat_id: chatId,
      text: plainText,
      reply_markup: options?.replyMarkup,
      ...(options?.isRtl ? { is_rtl: true } : {}),
    });
  }

  return result;
}

/**
 * Updates an existing Telegram message in-place (used for real-time progress).
 */
export async function editTelegramMessage(
  chatId: number,
  messageId: number,
  text: string,
  options?: TelegramSendOptions
): Promise<Result<TelegramMessageResponse, AppError>> {
  const isMarkdownV2 = options?.parseMode === "MarkdownV2";
  const parseMode = isMarkdownV2 ? "MarkdownV2" : "HTML";
  const payloadText = isMarkdownV2
    ? text.slice(0, 4000)
    : markdownToTelegramHtml(text, { isRtl: options?.isRtl });

  const result = await callTelegramApi<TelegramMessageResponse>("editMessageText", {
    chat_id: chatId,
    message_id: messageId,
    text: payloadText,
    parse_mode: parseMode,
    reply_markup: options?.replyMarkup,
    ...(options?.isRtl ? { is_rtl: true } : {}),
  });

  if (!result.success) {
    // If Telegram reports that message is not modified, content is already matching
    if (result.error.safeMessage.toLowerCase().includes("message is not modified")) {
      return ok({ message_id: messageId, chat: { id: chatId } });
    }

    logger.warn(
      { error: result.error.safeMessage, chatId, messageId },
      "Telegram formatted edit failed, falling back to clean text"
    );

    const plainText = stripHtmlTags(text).slice(0, 4000);
    const fallback = await callTelegramApi<TelegramMessageResponse>("editMessageText", {
      chat_id: chatId,
      message_id: messageId,
      text: plainText,
      reply_markup: options?.replyMarkup,
      ...(options?.isRtl ? { is_rtl: true } : {}),
    });
    if (!fallback.success && fallback.error.safeMessage.toLowerCase().includes("message is not modified")) {
      return ok({ message_id: messageId, chat: { id: chatId } });
    }
    return fallback;
  }

  return result;
}

/**
 * Sets the Telegram bot webhook with secret token verification.
 */
export async function setTelegramWebhook(
  webhookUrl: string,
  secretToken: string
): Promise<Result<boolean, AppError>> {
  return callTelegramApi<boolean>("setWebhook", {
    url: webhookUrl,
    secret_token: secretToken,
    allowed_updates: ["message", "callback_query"],
  });
}
