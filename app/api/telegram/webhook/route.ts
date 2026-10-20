import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { telegramUpdateSchema } from "@/lib/validation/telegram";
import { handleTelegramMessage } from "@/lib/services/telegram/handler";
import { handleTelegramCallbackQuery } from "@/lib/services/telegram/callback-handler";
import { logger } from "@/lib/logger";

function verifySecretToken(headerToken: string | null): boolean {
  const secretToken = process.env.TELEGRAM_BOT_SECRET_TOKEN;
  if (!headerToken || !secretToken) {
    return false;
  }

  const headerBuffer = Buffer.from(headerToken);
  const secretBuffer = Buffer.from(secretToken);

  if (headerBuffer.length !== secretBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(headerBuffer, secretBuffer);
}

export async function POST(req: NextRequest) {
  const headerToken = req.headers.get("x-telegram-bot-api-secret-token");

  // Constant-time verification of Telegram secret token
  if (!verifySecretToken(headerToken)) {
    logger.warn("Unauthorized Telegram webhook access attempt");
    return new NextResponse(null, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const parseResult = telegramUpdateSchema.safeParse(body);
  if (!parseResult.success) {
    // Ignore unsupported or unknown update types gracefully
    return NextResponse.json({ ok: true });
  }

  const update = parseResult.data;

  // Process message asynchronously and return 200 within a second to Telegram
  if (update.message) {
    handleTelegramMessage(update.message).catch((err) => {
      logger.error({ err }, "Unhandled error in Telegram message processing");
    });
  } else if (update.callback_query) {
    handleTelegramCallbackQuery(update.callback_query).catch((err) => {
      logger.error({ err }, "Unhandled error in Telegram callback query processing");
    });
  }

  return NextResponse.json({ ok: true });
}
