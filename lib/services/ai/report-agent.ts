import "server-only";
import { generateObject } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { anthropic } from "@ai-sdk/anthropic";
import { AppError, ErrorCodes } from "@/lib/errors";
import { ok, err, type Result } from "@/lib/result";
import { logger } from "@/lib/logger";
import {
  analysisReportOutputSchema,
  sanitizeHrEmail,
  type AnalysisReportOutput,
} from "@/lib/validation/report";
import type { NormalizedScrapedPayload } from "../scraper/types";
import { buildSystemPrompt, buildUserPrompt } from "./prompts/system-prompt";
import { formatTelegramReport } from "../telegram/report-formatter";

function getGoogleModel() {
  const apiKey =
    process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  const client = createGoogleGenerativeAI({ apiKey });
  return client(process.env.GEMINI_MODEL || "gemini-3.8-flash");
}

interface GenerateReportOptions {
  payload: NormalizedScrapedPayload;
  language?: "ar" | "en";
}

/**
 * Generates structured recruitment intelligence report with Google Gemini primary
 * and Anthropic Claude fallback, enforcing strict Zod validation and email sanitization.
 */
export async function generateReport(
  options: GenerateReportOptions
): Promise<Result<AnalysisReportOutput, AppError>> {
  const { payload, language = "ar" } = options;
  const systemPrompt = buildSystemPrompt(language);
  const userPrompt = buildUserPrompt(JSON.stringify(payload, null, 2));

  // 1. Primary Attempt: Google Gemini
  try {
    const model = getGoogleModel();
    logger.info({ provider: "google", model: "gemini-3.8-flash" }, "Generating report");
    const { object } = await generateObject({
      model,
      schema: analysisReportOutputSchema,
      system: systemPrompt,
      prompt: userPrompt,
    });

    const sanitizedReport = applyEmailSanitizer(object, payload.post.text, language);
    return ok(sanitizedReport);
  } catch (primaryError) {
    logger.warn(
      { error: primaryError, provider: "google" },
      "Primary Gemini model failed, trying Anthropic Claude fallback"
    );

    // 2. Fallback Attempt: Anthropic Claude (if configured)
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicKey || anthropicKey.includes("your_anthropic")) {
      return err(
        new AppError(
          ErrorCodes.AI_FAILED,
          502,
          "Failed to synthesize intelligence report via primary model",
          { cause: primaryError }
        )
      );
    }

    try {
      const { object } = await generateObject({
        model: anthropic("claude-3-5-sonnet-latest"),
        schema: analysisReportOutputSchema,
        system: systemPrompt,
        prompt: userPrompt,
      });

      const sanitizedReport = applyEmailSanitizer(object, payload.post.text, language);
      return ok(sanitizedReport);
    } catch (fallbackError) {
      logger.error(
        { primaryError, fallbackError },
        "All AI providers failed to generate analysis report"
      );
      return err(
        new AppError(
          ErrorCodes.AI_FAILED,
          502,
          "Failed to synthesize intelligence report",
          { cause: fallbackError }
        )
      );
    }
  }
}

/**
 * Enforces Hard Rule 10 & Domain Rule 6.3 IN CODE:
 * 1. Discards any HR email not present literally in the original source post text.
 * 2. Deterministically derives telegramReport to guarantee 100% pure localized labels.
 */
function applyEmailSanitizer(
  report: AnalysisReportOutput,
  sourcePostText: string,
  language: "ar" | "en" = "ar"
): AnalysisReportOutput {
  const sanitizedEmail = sanitizeHrEmail(report.metadata.hrEmail, sourcePostText);
  const localizedTelegramReport = formatTelegramReport({
    report: report.report,
    language,
    verifiedEmail: sanitizedEmail,
  });

  return {
    ...report,
    telegramReport: localizedTelegramReport,
    metadata: {
      ...report.metadata,
      hrEmail: sanitizedEmail,
    },
  };
}
