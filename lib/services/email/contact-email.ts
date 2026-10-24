import "server-only";

import { getServerEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { ok, err, type Result } from "@/lib/result";
import { AppError, ErrorCodes } from "@/lib/errors";
import type { ContactFormInput } from "@/lib/validation/contact";

export interface ContactEmailResult {
  messageId: string;
  isSimulated: boolean;
}

interface ResendSuccessResponse {
  id: string;
}

interface ResendErrorResponse {
  statusCode?: number;
  message?: string;
  name?: string;
}

import { buildContactInquiryEmail } from "@/templates";

/**
 * Sends a contact form submission to the configured site administrator.
 * Uses Resend HTTP REST API (no third-party heavy dependencies).
 * Falls back safely to simulation mode in development if API key is not yet set.
 */
export async function sendContactEmail(
  input: ContactFormInput
): Promise<Result<ContactEmailResult, AppError>> {
  const env = getServerEnv();
  const submittedAt = new Date().toISOString();

  // If credentials are not yet configured by the user:
  if (!env.RESEND_API_KEY?.trim() || !env.CONTACT_TO_EMAIL?.trim()) {
    logger.info(
      {
        sender: input.name,
        senderEmail: input.email,
        subject: input.subject,
        category: input.category,
        hasApiKey: Boolean(env.RESEND_API_KEY),
        hasToEmail: Boolean(env.CONTACT_TO_EMAIL),
      },
      "[ContactEmail] Simulated delivery: RESEND_API_KEY or CONTACT_TO_EMAIL not configured in env"
    );

    return ok({
      messageId: `simulated-${Date.now()}`,
      isSimulated: true,
    });
  }

  const fromAddress = (
    env.CONTACT_FROM_EMAIL || "EpiFlow Contact <onboarding@resend.dev>"
  ).trim();
  const toAddress = env.CONTACT_TO_EMAIL.trim();

  const email = buildContactInquiryEmail({
    senderName: input.name,
    senderEmail: input.email,
    subject: input.subject,
    category: input.category,
    message: input.message,
    submittedAt,
  });

  const payload = {
    from: fromAddress,
    to: [toAddress],
    reply_to: input.email.trim(),
    subject: email.subject,
    text: email.text,
    html: email.html,
  };

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY.trim()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      const errorData = (await res.json().catch(() => ({}))) as ResendErrorResponse;
      logger.error(
        { status: res.status, errorData, recipient: toAddress },
        "[ContactEmail] Resend API error response"
      );
      return err(
        new AppError(
          ErrorCodes.INTERNAL_ERROR,
          500,
          errorData.message || "Failed to dispatch contact email via Resend"
        )
      );
    }

    const data = (await res.json()) as ResendSuccessResponse;
    logger.info(
      { messageId: data.id, recipient: toAddress, sender: input.email },
      "[ContactEmail] Contact email successfully dispatched via Resend"
    );

    return ok({
      messageId: data.id,
      isSimulated: false,
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Connection failed";
    logger.error(
      { error, recipient: toAddress },
      "[ContactEmail] Network exception when sending contact email"
    );
    return err(
      new AppError(
        ErrorCodes.INTERNAL_ERROR,
        500,
        `Network error while contacting email delivery service (${errMsg})`,
        { cause: error }
      )
    );
  }
}
