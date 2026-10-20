import { describe, it, expect } from "vitest";
import { sanitizeHrEmail } from "@/lib/validation/report";

describe("Email Guard (Anti-Hallucination)", () => {
  const samplePost = `
    We are hiring a Senior TypeScript Engineer at Acme Corp!
    If you're interested, please send your resume directly to careers@acme.com with the subject [Dev].
    Looking forward to meeting you.
  `;

  it("retains email if present verbatim in the source post text", () => {
    const email = "careers@acme.com";
    const result = sanitizeHrEmail(email, samplePost);
    expect(result).toBe("careers@acme.com");
  });

  it("handles case-insensitive match properly", () => {
    const email = "CAREERS@ACME.COM";
    const result = sanitizeHrEmail(email, samplePost);
    expect(result).toBe("careers@acme.com");
  });

  it("discards email if not present in the post text (hallucination prevention)", () => {
    const hallucinatedEmail = "hr.recruiter@gmail.com";
    const result = sanitizeHrEmail(hallucinatedEmail, samplePost);
    expect(result).toBeNull();
  });

  it("discards invalid or malformed email strings", () => {
    expect(sanitizeHrEmail("not-an-email", samplePost)).toBeNull();
    expect(sanitizeHrEmail(null, samplePost)).toBeNull();
    expect(sanitizeHrEmail(undefined, samplePost)).toBeNull();
  });
});
