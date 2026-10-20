import { describe, it, expect } from "vitest";
import { AppError, ErrorCodes } from "@/lib/errors";

describe("AppError Domain", () => {
  it("creates AppError with code, httpStatus, and safeMessage", () => {
    const error = new AppError(
      ErrorCodes.QUOTA_EXCEEDED,
      429,
      "You have exceeded your workflow quota"
    );

    expect(error.code).toBe("QUOTA_EXCEEDED");
    expect(error.httpStatus).toBe(429);
    expect(error.safeMessage).toBe("You have exceeded your workflow quota");
    expect(error.toJSON()).toEqual({
      code: "QUOTA_EXCEEDED",
      message: "You have exceeded your workflow quota",
      status: 429,
    });
  });

  it("attaches optional details without leaking secrets", () => {
    const error = new AppError(ErrorCodes.SCRAPE_EMPTY, 404, "No post data found", {
      details: { url: "https://www.linkedin.com/posts/test" },
    });

    expect(error.details).toEqual({ url: "https://www.linkedin.com/posts/test" });
  });
});
