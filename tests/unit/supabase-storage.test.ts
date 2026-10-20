import { describe, it, expect, beforeEach } from "vitest";
import {
  validateImageFile,
  uploadPublicImage,
  MAX_IMAGE_FILE_SIZE,
} from "@/lib/services/storage/supabase-storage";
import { isOk, isErr } from "@/lib/result";

describe("Supabase Storage Helper & Validation", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      DATABASE_URL: "postgresql://postgres.mfikrhuzewundqlzwcad:pass@aws.supabase.com:6543/postgres",
      APIFY_TOKEN: "test_token",
      GEMINI_API_KEY: "test_key",
      TELEGRAM_BOT_TOKEN: "test_token",
      TELEGRAM_BOT_SECRET_TOKEN: "test_secret",
    };
  });

  it("accepts valid image formats under 10MB", () => {
    const pngResult = validateImageFile({
      size: 2 * 1024 * 1024,
      type: "image/png",
    });
    expect(isOk(pngResult)).toBe(true);

    const jpegResult = validateImageFile({
      size: 5 * 1024 * 1024,
      type: "image/jpeg",
    });
    expect(isOk(jpegResult)).toBe(true);

    const webpResult = validateImageFile({
      size: 9.9 * 1024 * 1024,
      type: "image/webp",
    });
    expect(isOk(webpResult)).toBe(true);
  });

  it("rejects files exceeding 10MB limit", () => {
    const oversizedResult = validateImageFile({
      size: MAX_IMAGE_FILE_SIZE + 1024,
      type: "image/png",
    });
    expect(isErr(oversizedResult)).toBe(true);
    if (isErr(oversizedResult)) {
      expect(oversizedResult.error.safeMessage).toContain("exceeds maximum limit of 10MB");
    }
  });

  it("rejects non-popular/non-image MIME types", () => {
    const pdfResult = validateImageFile({
      size: 1024,
      type: "application/pdf",
    });
    expect(isErr(pdfResult)).toBe(true);
    if (isErr(pdfResult)) {
      expect(pdfResult.error.safeMessage).toContain("Unsupported image format");
    }

    const exeResult = validateImageFile({
      size: 1024,
      type: "application/x-msdownload",
    });
    expect(isErr(exeResult)).toBe(true);
  });

  it("fails fast with clear error when SUPABASE_SERVICE_ROLE_KEY is missing", async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    const res = await uploadPublicImage({
      bucket: "workflow-images",
      path: "test.png",
      buffer: Buffer.from("fake-image"),
      contentType: "image/png",
    });

    expect(isErr(res)).toBe(true);
    if (isErr(res)) {
      expect(res.error.safeMessage).toContain("SUPABASE_SERVICE_ROLE_KEY is required");
    }
  });
});
