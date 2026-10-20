import { downloadCvFromGoogleDrive } from "./google-drive";
import { createGmailDraft, getGoogleAccessToken, type GmailDraftResult } from "./gmail-client";
import { type AppError } from "@/lib/errors";
import { isErr, type Result } from "@/lib/result";
import { logger } from "@/lib/logger";

export interface DraftEmailPayload {
  role: string;
  company: string;
  hrName?: string | null;
  hrEmail: string;
  fullName: string;
  cvUrl?: string | null;
  googleRefreshToken?: string;
}

export function formatDraftSubject(role: string, fullName: string): string {
  return `Application for ${role || "Position"} - ${fullName}`;
}

export function formatDraftBody(params: {
  role: string;
  company: string;
  hrName?: string | null;
  fullName: string;
}): string {
  const greetingTarget =
    params.hrName || (params.company ? `${params.company} Team` : "Hiring Team");

  return [
    `Dear ${greetingTarget},`,
    "",
    `I am writing to express my interest in the ${params.role || "advertised"} position.`,
    "",
    `I believe my skills and experience make me a strong candidate for this role, and I am eager to bring my dedication to your team at ${params.company || "your company"}. Please find my resume attached for your review.`,
    "",
    "Thank you for your time and consideration. I look forward to the possibility of discussing this opportunity with you.",
    "",
    "Best regards,",
    "",
    params.fullName,
  ].join("\n");
}

/**
 * Downloads CV from Google Drive (if configured) and creates a Gmail draft.
 */
export async function executeDraftCreation(
  payload: DraftEmailPayload
): Promise<Result<GmailDraftResult, AppError>> {
  logger.info({ role: payload.role, hrEmail: payload.hrEmail }, "Executing draft creation");

  // 1. Obtain Google access token for Drive & Gmail API calls
  const tokenRes = await getGoogleAccessToken(payload.googleRefreshToken);
  if (isErr(tokenRes)) {
    return tokenRes;
  }
  const accessToken = tokenRes.data;

  let attachment:
    | { buffer: Buffer; filename: string; mimeType: string }
    | undefined;

  if (payload.cvUrl) {
    const downloadRes = await downloadCvFromGoogleDrive(payload.cvUrl, accessToken);
    if (!isErr(downloadRes)) {
      attachment = downloadRes.data;
    } else {
      logger.warn(
        { cvUrl: payload.cvUrl, error: downloadRes.error },
        "Could not download CV; creating draft without attachment"
      );
    }
  }

  const subject = formatDraftSubject(payload.role, payload.fullName);
  const bodyText = formatDraftBody({
    role: payload.role,
    company: payload.company,
    hrName: payload.hrName,
    fullName: payload.fullName,
  });

  return await createGmailDraft({
    to: payload.hrEmail,
    subject,
    bodyText,
    attachment,
    refreshToken: payload.googleRefreshToken,
  });
}
