/**
 * Unified application error domain for JobPost X-Ray.
 * Never leaks stack traces, internal IDs, or third-party details to users.
 */

export const ErrorCodes = {
  // Gatekeeper error codes (matching schema.sql)
  UNREGISTERED: "UNREGISTERED",
  ACCOUNT_PENDING: "ACCOUNT_PENDING",
  ACCOUNT_REJECTED: "ACCOUNT_REJECTED",
  ACCOUNT_LOCKED: "ACCOUNT_LOCKED",
  WORKFLOW_FORBIDDEN: "WORKFLOW_FORBIDDEN",
  WORKFLOW_DISABLED: "WORKFLOW_DISABLED",
  ACCESS_EXPIRED: "ACCESS_EXPIRED",
  QUOTA_EXCEEDED: "QUOTA_EXCEEDED",

  // Pipeline & scraping error codes
  INVALID_URL: "INVALID_URL",
  SCRAPE_EMPTY: "SCRAPE_EMPTY",
  SCRAPE_FAILED: "SCRAPE_FAILED",
  AI_FAILED: "AI_FAILED",

  // Generic / security error codes
  UNAUTHORIZED: "UNAUTHORIZED",
  RATE_LIMITED: "RATE_LIMITED",
  INVALID_PAYLOAD: "INVALID_PAYLOAD",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly httpStatus: number;
  readonly safeMessage: string;
  readonly details?: Record<string, unknown> | undefined;

  constructor(
    code: ErrorCode,
    httpStatus: number,
    safeMessage: string,
    options?: {
      cause?: unknown;
      details?: Record<string, unknown>;
    }
  ) {
    super(safeMessage, { cause: options?.cause });
    this.name = "AppError";
    this.code = code;
    this.httpStatus = httpStatus;
    this.safeMessage = safeMessage;
    this.details = options?.details;
  }

  toJSON() {
    return {
      code: this.code,
      message: this.safeMessage,
      status: this.httpStatus,
      ...(this.details ? { details: this.details } : {}),
    };
  }
}
