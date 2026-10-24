"use server";

import { contactFormSchema } from "@/lib/validation/contact";
import { sendContactEmail } from "@/lib/services/email/contact-email";
import { logger } from "@/lib/logger";
import { ErrorCodes } from "@/lib/errors";

export interface ContactActionResult {
  success: boolean;
  isSimulated?: boolean;
  errorCode?: string;
  message?: string;
}

// Simple in-memory sliding window rate limiter: maximum 5 requests per 10 minutes per email
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 5;

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(key) || [];
  const validTimestamps = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

  if (validTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    rateLimitMap.set(key, validTimestamps);
    return true;
  }

  validTimestamps.push(now);
  rateLimitMap.set(key, validTimestamps);
  return false;
}

/**
 * Server Action to process contact form submissions.
 * Validates external inputs with Zod, rejects honeypot bots, enforces rate limits,
 * and delegates email dispatching to the contact email service.
 */
export async function submitContactAction(
  rawInput: unknown
): Promise<ContactActionResult> {
  const parsed = contactFormSchema.safeParse(rawInput);

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]?.message || "Invalid contact form submission";
    return {
      success: false,
      errorCode: "VALIDATION_ERROR",
      message: firstIssue,
    };
  }

  const { website, email } = parsed.data;

  // Anti-Spam: Silent drop for bots that filled the invisible honeypot field
  if (website && website.trim().length > 0) {
    logger.warn({ senderEmail: email }, "[ContactAction] Honeypot triggered, silently dropping bot submission");
    return {
      success: true,
      isSimulated: false,
    };
  }

  // Rate Limiting
  if (isRateLimited(email)) {
    logger.warn({ email }, "[ContactAction] Rate limit exceeded for contact form");
    return {
      success: false,
      errorCode: ErrorCodes.RATE_LIMITED,
      message: "Too many messages sent. Please wait a few minutes before trying again.",
    };
  }

  const result = await sendContactEmail(parsed.data);

  if (!result.success) {
    return {
      success: false,
      errorCode: result.error.code,
      message: result.error.safeMessage,
    };
  }

  return {
    success: true,
    isSimulated: result.data.isSimulated,
  };
}
