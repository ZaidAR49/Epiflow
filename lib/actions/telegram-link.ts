"use server";

import crypto from "crypto";
import { auth } from "@/auth";
import { logger } from "@/lib/logger";
import { ErrorCodes } from "@/lib/errors";
import {
  manualTelegramLinkSchema,
  type ManualTelegramLinkInput,
} from "@/lib/validation/telegram-link";
import {
  linkTelegramToUser,
  unlinkTelegramFromUser,
  getUserById,
  getUserTelegramIdentity,
} from "@/lib/db/queries/users";
import { saveTelegramLinkToken } from "@/lib/db/queries/telegram-link";
import { getWorkflowChannelBySlug } from "@/lib/db/queries/workflow-channels";

export type TelegramLinkActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; errorCode: string; message: string };

export interface TelegramDeepLinkData {
  botHandle: string;
  deepLink: string;
  command: string;
  expiresAt: string;
}

/**
 * Generates a single-use 10-minute token for 1-click Telegram deep linking.
 */
export async function generateTelegramLinkTokenAction(): Promise<
  TelegramLinkActionResult<TelegramDeepLinkData>
> {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      success: false,
      errorCode: ErrorCodes.UNAUTHORIZED,
      message: "You must be signed in to connect Telegram",
    };
  }

  try {
    const rawToken = crypto.randomBytes(16).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const saved = await saveTelegramLinkToken(
      session.user.id,
      "job-xray",
      tokenHash,
      expiresAt
    );

    if (!saved) {
      return {
        success: false,
        errorCode: "TOKEN_SAVE_FAILED",
        message: "Failed to initialize Telegram connection token",
      };
    }

    const channel = await getWorkflowChannelBySlug("job-xray", "telegram");
    const botHandle = channel?.handle || process.env.TELEGRAM_BOT_USERNAME || "";

    if (!botHandle) {
      return {
        success: false,
        errorCode: "BOT_NOT_CONFIGURED",
        message: "Telegram bot handle is not configured in workflow channels",
      };
    }

    const startPayload = `connect_${rawToken}`;
    const deepLink = `https://t.me/${botHandle}?start=${startPayload}`;
    const command = `/connect ${rawToken}`;

    logger.info(
      { userId: session.user.id, botHandle },
      "Generated Telegram connection deep link token"
    );

    return {
      success: true,
      data: {
        botHandle,
        deepLink,
        command,
        expiresAt: expiresAt.toISOString(),
      },
    };
  } catch (error) {
    logger.error({ err: error, userId: session.user.id }, "Failed to generate link token");
    return {
      success: false,
      errorCode: ErrorCodes.INTERNAL_ERROR,
      message: "An unexpected error occurred while generating link token",
    };
  }
}

/**
 * Manually links a user to a Telegram ID (for power users or direct entry).
 */
export async function linkTelegramManuallyAction(
  rawInput: ManualTelegramLinkInput
): Promise<TelegramLinkActionResult<{ telegramId: number }>> {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      success: false,
      errorCode: ErrorCodes.UNAUTHORIZED,
      message: "You must be signed in to perform this action",
    };
  }

  const parsed = manualTelegramLinkSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      errorCode: "VALIDATION_ERROR",
      message: parsed.error.issues[0]?.message || "Invalid Telegram ID",
    };
  }

  try {
    const updated = await linkTelegramToUser(
      session.user.id,
      parsed.data.telegramId,
      parsed.data.username
    );

    if (!updated) {
      return {
        success: false,
        errorCode: "USER_NOT_FOUND",
        message: "User account could not be found",
      };
    }

    logger.info(
      { userId: session.user.id, telegramId: parsed.data.telegramId },
      "Manually linked Telegram ID to user"
    );

    return { success: true, data: { telegramId: parsed.data.telegramId } };
  } catch (error: unknown) {
    const isConflict =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === "23505";

    if (isConflict) {
      return {
        success: false,
        errorCode: "TELEGRAM_ALREADY_LINKED",
        message: "This Telegram ID is already linked to another account",
      };
    }

    logger.error({ err: error, userId: session.user.id }, "Failed to manually link Telegram");
    return {
      success: false,
      errorCode: ErrorCodes.INTERNAL_ERROR,
      message: "An unexpected error occurred while linking Telegram",
    };
  }
}

/**
 * Disconnects / unlinks the user's Telegram identity.
 */
export async function disconnectTelegramAction(): Promise<TelegramLinkActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      success: false,
      errorCode: ErrorCodes.UNAUTHORIZED,
      message: "You must be signed in to perform this action",
    };
  }

  try {
    await unlinkTelegramFromUser(session.user.id);
    logger.info({ userId: session.user.id }, "Unlinked Telegram from user");
    return { success: true, data: undefined };
  } catch (error) {
    logger.error({ err: error, userId: session.user.id }, "Failed to disconnect Telegram");
    return {
      success: false,
      errorCode: ErrorCodes.INTERNAL_ERROR,
      message: "An unexpected error occurred while disconnecting Telegram",
    };
  }
}

export interface TelegramStatusResult {
  isConnected: boolean;
  telegramId: number | null;
  username: string | null;
}

/**
 * Checks the current user's Telegram connection status.
 */
export async function checkTelegramStatusAction(): Promise<
  TelegramLinkActionResult<TelegramStatusResult>
> {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      success: false,
      errorCode: ErrorCodes.UNAUTHORIZED,
      message: "You must be signed in to check status",
    };
  }

  try {
    const user = await getUserById(session.user.id);
    if (!user) {
      return {
        success: false,
        errorCode: "USER_NOT_FOUND",
        message: "User account could not be found",
      };
    }

    const telegramIdentity = await getUserTelegramIdentity(session.user.id);

    return {
      success: true,
      data: {
        isConnected: telegramIdentity !== null,
        telegramId: telegramIdentity ? telegramIdentity.telegramId : null,
        username: telegramIdentity ? telegramIdentity.username : null,
      },
    };
  } catch (error) {
    logger.error({ err: error, userId: session.user.id }, "Failed to check Telegram status");
    return {
      success: false,
      errorCode: ErrorCodes.INTERNAL_ERROR,
      message: "Failed to check status",
    };
  }
}
