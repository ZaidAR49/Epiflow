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

/**
 * Builds HTML template for contact notification email.
 */
function buildContactHtml(input: ContactFormInput, submittedAt: string): string {
  const sanitizedMessage = input.message
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/\n/g, "<br/>");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New EpiFlow Contact Message</title>
</head>
<body style="margin: 0; padding: 0; background-color: #090D16; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #E6EAF2;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #090D16; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #0F172A; border: 1px solid rgba(148, 163, 184, 0.18); border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.4);">
          <!-- Header -->
          <tr>
            <td style="padding: 24px 28px; background: linear-gradient(135deg, #162036 0%, #0F172A 100%); border-bottom: 1px solid rgba(148, 163, 184, 0.14);">
              <table role="presentation" width="100%">
                <tr>
                  <td>
                    <span style="font-size: 18px; font-weight: 800; color: #6366F1; letter-spacing: -0.5px;">EpiFlow</span>
                    <span style="font-size: 12px; color: #8B97AD; margin-left: 8px;">// Contact Notification</span>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; padding: 4px 10px; background-color: rgba(99, 102, 241, 0.15); border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 999px; font-size: 11px; font-weight: 700; color: #818CF8; text-transform: uppercase;">
                      ${input.category}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Sender Details -->
          <tr>
            <td style="padding: 28px 28px 16px 28px;">
              <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #FFFFFF; line-height: 1.4;">
                ${input.subject}
              </h1>

              <table role="presentation" width="100%" style="background-color: #162036; border-radius: 10px; padding: 14px 18px; margin-bottom: 24px;">
                <tr>
                  <td style="font-size: 13px; color: #8B97AD; padding: 4px 0;" width="80">From:</td>
                  <td style="font-size: 13px; font-weight: 600; color: #E6EAF2; padding: 4px 0;">${input.name}</td>
                </tr>
                <tr>
                  <td style="font-size: 13px; color: #8B97AD; padding: 4px 0;">Email:</td>
                  <td style="font-size: 13px; font-weight: 600; color: #6366F1; padding: 4px 0;">
                    <a href="mailto:${input.email}" style="color: #818CF8; text-decoration: none;">${input.email}</a>
                  </td>
                </tr>
                <tr>
                  <td style="font-size: 13px; color: #8B97AD; padding: 4px 0;">Time:</td>
                  <td style="font-size: 13px; color: #E6EAF2; padding: 4px 0;">${submittedAt}</td>
                </tr>
              </table>

              <!-- Message Body -->
              <div style="font-size: 14px; line-height: 1.7; color: #E6EAF2; background-color: rgba(9, 13, 22, 0.6); border: 1px solid rgba(148, 163, 184, 0.12); border-radius: 10px; padding: 20px;">
                ${sanitizedMessage}
              </div>
            </td>
          </tr>

          <!-- Action Button -->
          <tr>
            <td style="padding: 16px 28px 28px 28px;" align="center">
              <a href="mailto:${input.email}?subject=${encodeURIComponent("Re: " + input.subject)}" style="display: inline-block; background-color: #6366F1; color: #FFFFFF; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 14px; font-weight: 600; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);">
                Reply to ${input.name}
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 18px 28px; background-color: #090D16; border-top: 1px solid rgba(148, 163, 184, 0.1); text-align: center; font-size: 11px; color: #8B97AD;">
              This inquiry was submitted via the EpiFlow Contact Us form. Replying directly to this email will deliver your message to ${input.email}.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Builds plain text alternative for contact notification email.
 */
function buildContactText(input: ContactFormInput, submittedAt: string): string {
  return [
    `=== New EpiFlow Contact Inquiry ===`,
    `Category: ${input.category.toUpperCase()}`,
    `Subject: ${input.subject}`,
    `From: ${input.name} <${input.email}>`,
    `Submitted At: ${submittedAt}`,
    ``,
    `--- Message ---`,
    input.message,
    ``,
    `----------------------------------------`,
    `To reply, reply directly to this email or send to ${input.email}`,
  ].join("\n");
}

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

  const fromAddress =
    env.CONTACT_FROM_EMAIL || "EpiFlow Contact <onboarding@resend.dev>";
  const toAddress = env.CONTACT_TO_EMAIL;
  const emailSubject = `[EpiFlow Contact: ${input.category.toUpperCase()}] ${input.subject}`;

  const payload = {
    from: fromAddress,
    to: [toAddress],
    reply_to: input.email,
    subject: emailSubject,
    text: buildContactText(input, submittedAt),
    html: buildContactHtml(input, submittedAt),
  };

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
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
    logger.error(
      { error, recipient: toAddress },
      "[ContactEmail] Network exception when sending contact email"
    );
    return err(
      new AppError(
        ErrorCodes.INTERNAL_ERROR,
        500,
        "Network error while contacting email delivery service",
        { cause: error }
      )
    );
  }
}
