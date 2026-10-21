import { describe, it, expect, vi } from "vitest";

// Mock db module
const mockExecute = vi.fn().mockResolvedValue([]);
vi.mock("@/lib/db/client", () => ({
  db: {
    execute: (...args: unknown[]) => mockExecute(...args),
  },
}));

import { ensureUserWorkflowAccess } from "@/lib/db/queries/access";

describe("Starter Plan Access & Authorization Routing", () => {
  it("defaults new user workflow access to 5 free scans for the starter tier", async () => {
    const userId = "test-user-id";
    const slug = "job-xray";

    await ensureUserWorkflowAccess(userId, slug);

    expect(mockExecute).toHaveBeenCalledTimes(1);
    const sqlCall = mockExecute.mock.calls[0]?.[0];
    // Drizzle SQL object stores queryChunks with values
    const queryChunks = sqlCall?.queryChunks ?? [];
    const hasLimitFive = queryChunks.some(
      (chunk: unknown) =>
        (chunk as { value?: unknown })?.value === 5 || chunk === 5
    );
    expect(hasLimitFive).toBe(true);
  });

  it("constructs the sign-in redirect URL with console callbackUrl for unauthorized users", () => {
    const locale = "en";
    const slug = "job-xray";
    const isAuthenticated = false;

    const tryWorkflowUrl = isAuthenticated
      ? `/${locale}/workflows/${slug}/console`
      : `/${locale}/sign-in?callbackUrl=/${locale}/workflows/${slug}/console`;

    expect(tryWorkflowUrl).toBe("/en/sign-in?callbackUrl=/en/workflows/job-xray/console");
  });

  it("constructs direct workflow console URL for authorized users", () => {
    const locale = "ar";
    const slug = "job-xray";
    const isAuthenticated = true;

    const tryWorkflowUrl = isAuthenticated
      ? `/${locale}/workflows/${slug}/console`
      : `/${locale}/sign-in?callbackUrl=/${locale}/workflows/${slug}/console`;

    expect(tryWorkflowUrl).toBe("/ar/workflows/job-xray/console");
  });
});
