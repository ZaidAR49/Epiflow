import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock auth
const mockAuth = vi.fn();
vi.mock("@/auth", () => ({
  auth: () => mockAuth(),
}));

// Mock credentials query
const mockSaveWorkflowGoogleCredential = vi.fn();
vi.mock("@/lib/db/queries/credentials", () => ({
  saveWorkflowGoogleCredential: (...args: unknown[]) =>
    mockSaveWorkflowGoogleCredential(...args),
}));

// Mock getServerEnv
const mockEnv: Record<string, string | undefined> = {
  GOOGLE_CLIENT_ID: "mock-client-id",
  GOOGLE_CLIENT_SECRET: "mock-client-secret",
  NEXT_PUBLIC_APP_NAME: "EpiFlow",
  NEXT_PUBLIC_PLATFORM_NAME: "epiflow",
  GOOGLE_WORKFLOW_REDIRECT_URI: undefined,
};

vi.mock("@/lib/env", () => ({
  getServerEnv: () => mockEnv,
}));

import { GET as handleAuthGoogle } from "@/app/api/workflows/[slug]/auth/google/route";
import { GET as handleAuthGoogleCallback } from "@/app/api/workflows/[slug]/auth/google/callback/route";

describe("Workflow Google OAuth Redirect & Callback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEnv.GOOGLE_WORKFLOW_REDIRECT_URI = undefined;
    mockEnv.NEXT_PUBLIC_PLATFORM_NAME = "epiflow";
    mockAuth.mockResolvedValue({
      user: { id: "user-123", email: "user@example.com" },
    });
  });

  describe("Initiate OAuth (GET /api/workflows/[slug]/auth/google)", () => {
    it("redirects unauthenticated users to sign-in", async () => {
      mockAuth.mockResolvedValueOnce(null);
      const req = new NextRequest("http://localhost:3000/api/workflows/job-xray/auth/google");
      const res = await handleAuthGoogle(req, {
        params: Promise.resolve({ slug: "job-xray" }),
      });

      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toBe("http://localhost:3000/en/sign-in");
    });

    it("generates correct dynamic redirect_uri matching the workflow slug", async () => {
      const req = new NextRequest("http://localhost:3000/api/workflows/job-xray/auth/google");
      const res = await handleAuthGoogle(req, {
        params: Promise.resolve({ slug: "job-xray" }),
      });

      expect(res.status).toBe(307);
      const redirectLocation = res.headers.get("location");
      expect(redirectLocation).toBeDefined();

      const url = new URL(redirectLocation!);
      expect(url.origin).toBe("https://accounts.google.com");
      expect(url.searchParams.get("redirect_uri")).toBe(
        "http://localhost:3000/api/workflows/job-xray/auth/google/callback"
      );
    });

    it("uses GOOGLE_WORKFLOW_REDIRECT_URI override when configured in environment", async () => {
      mockEnv.GOOGLE_WORKFLOW_REDIRECT_URI =
        "http://localhost:3000/api/workflows/epiflow/auth/google/callback";

      const req = new NextRequest("http://localhost:3000/api/workflows/job-xray/auth/google");
      const res = await handleAuthGoogle(req, {
        params: Promise.resolve({ slug: "job-xray" }),
      });

      const redirectLocation = res.headers.get("location");
      const url = new URL(redirectLocation!);
      expect(url.searchParams.get("redirect_uri")).toBe(
        "http://localhost:3000/api/workflows/epiflow/auth/google/callback"
      );
    });
  });

  describe("OAuth Callback (GET /api/workflows/[slug]/auth/google/callback)", () => {
    it("rejects state mismatch or missing state cookie", async () => {
      const req = new NextRequest(
        "http://localhost:3000/api/workflows/job-xray/auth/google/callback?code=mock_code&state=forged_state"
      );
      const res = await handleAuthGoogleCallback(req, {
        params: Promise.resolve({ slug: "job-xray" }),
      });

      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toContain("/en/workflows/job-xray?error=invalid_state");
    });

    it("resolves epiflow alias to job-xray when storing credentials", async () => {
      const statePayload = Buffer.from(
        JSON.stringify({ userId: "user-123", slug: "epiflow", t: Date.now() })
      ).toString("base64url");

      const req = new NextRequest(
        `http://localhost:3000/api/workflows/epiflow/auth/google/callback?code=test_code&state=${statePayload}`,
        {
          headers: {
            cookie: `wf_oauth_state=${statePayload}`,
          },
        }
      );

      // Mock Google token exchange fetch
      global.fetch = vi.fn().mockImplementation((url: string | URL) => {
        const urlStr = url.toString();
        if (urlStr.includes("oauth2.googleapis.com/token")) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                access_token: "mock-access-token",
                refresh_token: "mock-refresh-token",
                scope: "https://www.googleapis.com/auth/gmail.compose",
              }),
          });
        }
        if (urlStr.includes("googleapis.com/oauth2/v2/userinfo")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ email: "user@example.com" }),
          });
        }
        return Promise.reject(new Error("Unhandled fetch"));
      });

      mockSaveWorkflowGoogleCredential.mockResolvedValueOnce("cred-id-123");

      const res = await handleAuthGoogleCallback(req, {
        params: Promise.resolve({ slug: "epiflow" }),
      });

      expect(res.status).toBe(307);
      // Resolved to job-xray
      expect(mockSaveWorkflowGoogleCredential).toHaveBeenCalledWith({
        userId: "user-123",
        workflowSlug: "job-xray",
        refreshToken: "mock-refresh-token",
        accountEmail: "user@example.com",
        scopes: ["https://www.googleapis.com/auth/gmail.compose"],
      });

      expect(res.headers.get("location")).toBe(
        "http://localhost:3000/en/workflows/job-xray/console?credential_status=connected"
      );
    });
  });
});
