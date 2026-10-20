import "server-only";
import { AppError, ErrorCodes } from "@/lib/errors";
import { ok, err, type Result } from "@/lib/result";
import { logger } from "@/lib/logger";

export interface GmailDraftOptions {
  to: string;
  subject: string;
  bodyText: string;
  attachment?: {
    buffer: Buffer;
    filename: string;
    mimeType: string;
  };
  refreshToken?: string;
}

export interface GmailDraftResult {
  draftId: string;
  messageId: string;
  draftUrl: string;
}

/**
 * Builds RFC 2822 MIME multipart message with optional attachment.
 */
export function buildMimeMessage(options: {
  to: string;
  subject: string;
  bodyText: string;
  attachment?: {
    buffer: Buffer;
    filename: string;
    mimeType: string;
  };
}): string {
  const boundary = `====_JobPost_XRay_${Date.now()}_====`;
  const sanitizedSubject = options.subject.replace(/[\r\n]+/g, " ");

  if (!options.attachment) {
    const raw = [
      `To: ${options.to}`,
      `Subject: =?UTF-8?B?${Buffer.from(sanitizedSubject).toString("base64")}?=`,
      "MIME-Version: 1.0",
      "Content-Type: text/plain; charset=UTF-8",
      "Content-Transfer-Encoding: base64",
      "",
      Buffer.from(options.bodyText).toString("base64"),
    ].join("\r\n");

    return Buffer.from(raw).toString("base64url");
  }

  const { buffer, filename, mimeType } = options.attachment;
  const rawParts = [
    `To: ${options.to}`,
    `Subject: =?UTF-8?B?${Buffer.from(sanitizedSubject).toString("base64")}?=`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(options.bodyText).toString("base64"),
    "",
    `--${boundary}`,
    `Content-Type: ${mimeType}; name="${filename}"`,
    "Content-Transfer-Encoding: base64",
    `Content-Disposition: attachment; filename="${filename}"`,
    "",
    buffer.toString("base64"),
    "",
    `--${boundary}--`,
  ].join("\r\n");

  return Buffer.from(rawParts).toString("base64url");
}

/**
 * Retrieves a fresh Google OAuth access token using the configured refresh token.
 */
export async function getGoogleAccessToken(
  refreshToken?: string
): Promise<Result<string, AppError>> {
  const token = refreshToken || process.env.GOOGLE_REFRESH_TOKEN;
  if (!token) {
    return err(
      new AppError(
        ErrorCodes.INTERNAL_ERROR,
        500,
        "Google Refresh Token not configured (set GOOGLE_REFRESH_TOKEN in .env.local)"
      )
    );
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return err(
      new AppError(
        ErrorCodes.INTERNAL_ERROR,
        500,
        "Google OAuth credentials not configured (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET)"
      )
    );
  }

  try {
    const tokenUrl = "https://oauth2.googleapis.com/token";
    const tokenRes = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: token,
        grant_type: "refresh_token",
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      logger.error({ status: tokenRes.status, errText }, "Failed to refresh Google token");
      return err(
        new AppError(
          ErrorCodes.INTERNAL_ERROR,
          502,
          "Failed to authenticate with Google (invalid or expired refresh token)"
        )
      );
    }

    const tokenData = (await tokenRes.json()) as { access_token: string };
    return ok(tokenData.access_token);
  } catch (error) {
    return err(
      new AppError(
        ErrorCodes.INTERNAL_ERROR,
        500,
        "Error refreshing Google access token",
        { cause: error }
      )
    );
  }
}

/**
 * Creates a Gmail draft via Google REST API with optional resume attachment.
 */
export async function createGmailDraft(
  options: GmailDraftOptions
): Promise<Result<GmailDraftResult, AppError>> {
  const { to, subject, bodyText, attachment, refreshToken } = options;

  logger.info({ to, subject, hasAttachment: !!attachment }, "Composing Gmail draft");

  // 1. Refresh Google access token
  const tokenResult = await getGoogleAccessToken(refreshToken);
  if (!tokenResult.success) {
    return tokenResult;
  }
  const accessToken = tokenResult.data;

  const rawBase64Url = buildMimeMessage({
    to,
    subject,
    bodyText,
    attachment,
  });

  try {
    // 2. Create Draft in Gmail
    const draftRes = await fetch(
      "https://gmail.googleapis.com/gmail/v1/users/me/drafts",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: {
            raw: rawBase64Url,
          },
        }),
      }
    );

    if (!draftRes.ok) {
      const draftErr = await draftRes.text();
      logger.error({ status: draftRes.status, draftErr }, "Failed to create Gmail draft");
      return err(
        new AppError(
          ErrorCodes.INTERNAL_ERROR,
          502,
          "Failed to create draft in Gmail"
        )
      );
    }

    const draftData = (await draftRes.json()) as {
      id: string;
      message: { id: string };
    };

    return ok({
      draftId: draftData.id,
      messageId: draftData.message.id,
      draftUrl: `https://mail.google.com/mail/u/0/#drafts/${draftData.id}`,
    });
  } catch (error) {
    logger.error({ error }, "Unexpected error creating Gmail draft");
    return err(
      new AppError(
        ErrorCodes.INTERNAL_ERROR,
        500,
        "Failed to create Gmail draft",
        { cause: error }
      )
    );
  }
}
