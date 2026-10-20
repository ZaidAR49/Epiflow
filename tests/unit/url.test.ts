import { describe, it, expect } from "vitest";
import {
  linkedinUrlSchema,
  isShortLinkedInUrl,
  normalizeLinkedInUrl,
} from "@/lib/validation/url";

describe("LinkedIn URL Validation & Normalization", () => {
  it("accepts valid LinkedIn post URLs", () => {
    const url = "https://www.linkedin.com/posts/johndoe_hiring-software-engineer-activity-7123456789";
    const parsed = linkedinUrlSchema.safeParse(url);
    expect(parsed.success).toBe(true);
  });

  it("accepts valid LinkedIn job URLs", () => {
    const url = "https://www.linkedin.com/jobs/view/3849201938/";
    const parsed = linkedinUrlSchema.safeParse(url);
    expect(parsed.success).toBe(true);
  });

  it("accepts valid LinkedIn feed update URLs", () => {
    const url = "https://www.linkedin.com/feed/update/urn:li:activity:7123456789";
    const parsed = linkedinUrlSchema.safeParse(url);
    expect(parsed.success).toBe(true);
  });

  it("accepts and detects lnkd.in short URLs", () => {
    const url = "https://lnkd.in/gAbCdEf";
    expect(isShortLinkedInUrl(url)).toBe(true);
    expect(linkedinUrlSchema.safeParse(url).success).toBe(true);
  });

  it("rejects non-LinkedIn URLs", () => {
    const url = "https://twitter.com/johndoe/status/123456";
    const parsed = linkedinUrlSchema.safeParse(url);
    expect(parsed.success).toBe(false);
  });

  it("strips tracking parameters while preserving clean URL", () => {
    const dirtyUrl =
      "https://www.linkedin.com/posts/test_post?utm_source=share&utm_medium=member_desktop&trackingId=12345";
    const normalized = normalizeLinkedInUrl(dirtyUrl);
    expect(normalized).toBe("https://www.linkedin.com/posts/test_post");
  });
});
