import { describe, it, expect } from "vitest";
import { linkedinUrlSchema } from "@/lib/validation/url";
import { z } from "zod";

const testAnalyzeSchema = z.object({
  url: linkedinUrlSchema,
  language: z.enum(["ar", "en"]).default("ar"),
  userId: z.string().uuid(),
});

describe("Server Actions Input Validation", () => {
  it("accepts valid analysis inputs", () => {
    const valid = {
      url: "https://www.linkedin.com/posts/acme_hiring-12345",
      language: "en",
      userId: "123e4567-e89b-12d3-a456-426614174000",
    };
    const parsed = testAnalyzeSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
  });

  it("rejects non-LinkedIn URLs in action inputs", () => {
    const invalid = {
      url: "https://google.com/test",
      language: "ar",
      userId: "123e4567-e89b-12d3-a456-426614174000",
    };
    const parsed = testAnalyzeSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });

  it("rejects malformed user UUIDs", () => {
    const invalid = {
      url: "https://www.linkedin.com/posts/acme_hiring-12345",
      language: "ar",
      userId: "not-a-valid-uuid",
    };
    const parsed = testAnalyzeSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });
});
