import { describe, it, expect, beforeEach } from "vitest";
import { formatDraftSubject, formatDraftBody } from "@/lib/services/email/compose-draft";
import { getGoogleAccessToken } from "@/lib/services/email/gmail-client";
import { isErr } from "@/lib/result";

describe("Gmail Draft & Token Management", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.GOOGLE_REFRESH_TOKEN;
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
  });

  it("formats draft subject and greeting body correctly", () => {
    const subject = formatDraftSubject("Senior Backend Engineer", "Zaid Radaideh");
    expect(subject).toBe("Application for Senior Backend Engineer - Zaid Radaideh");

    const body = formatDraftBody({
      role: "Senior Backend Engineer",
      company: "Google",
      hrName: "Sarah Connor",
      fullName: "Zaid Radaideh",
    });
    expect(body).toContain("Dear Sarah Connor,");
    expect(body).toContain("Senior Backend Engineer");
    expect(body).toContain("Google");
    expect(body).toContain("Zaid Radaideh");
  });

  it("fails with clear error when GOOGLE_REFRESH_TOKEN is not configured", async () => {
    const tokenRes = await getGoogleAccessToken();
    expect(isErr(tokenRes)).toBe(true);
    if (isErr(tokenRes)) {
      expect(tokenRes.error.safeMessage).toContain("Google Refresh Token not configured");
    }
  });

  it("prioritizes provided user refreshToken over environment variable", async () => {
    process.env.GOOGLE_REFRESH_TOKEN = "env_token";
    process.env.GOOGLE_CLIENT_ID = "test_client_id";
    process.env.GOOGLE_CLIENT_SECRET = "test_client_secret";

    // Calls with an explicit user refresh token
    const tokenRes = await getGoogleAccessToken("user_specific_token");
    // Network call will fail against google oauth endpoint in test, but error should indicate authentication attempt with Google rather than missing config
    expect(isErr(tokenRes)).toBe(true);
    if (isErr(tokenRes)) {
      expect(tokenRes.error.safeMessage).toMatch(
        /Failed to authenticate with Google|Error refreshing Google access token/
      );
    }
  });

  it("extracts hidden metadata from callback query payload", () => {
    const meta = {
      role: "Full Stack Engineer",
      company: "Acme",
      hr_name: "John Doe",
      hr_email: "recruitment@acme.com",
    };
    const encoded = encodeURIComponent(JSON.stringify(meta));
    const callbackPayload = {
      id: "cb_123",
      data: "yes",
      message: {
        message_id: 10,
        text: "Would you like a draft?",
        entities: [
          {
            type: "text_link",
            url: `https://hidden.data/?meta=${encoded}`,
            offset: 23,
            length: 1,
          },
        ],
      },
    };

    const rawString = JSON.stringify(callbackPayload);
    const linkEntity = callbackPayload.message.entities.find(
      (e) => e.type === "text_link" && e.url.includes("hidden.data")
    );
    const targetUrl = linkEntity?.url;
    const metaMatch = targetUrl
      ? targetUrl.match(/meta=([^"\s}\]]+)/)
      : rawString.match(/https:\\\/\\\/hidden\\.data\\\/\\\?meta=([^"\\s}\]]+)/);

    expect(metaMatch).not.toBeNull();
    const rawMeta = metaMatch?.[1] ?? "";
    const extracted = JSON.parse(decodeURIComponent(rawMeta));
    expect(extracted.hr_email).toBe("recruitment@acme.com");
    expect(extracted.role).toBe("Full Stack Engineer");
  });
});
