import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/cron/keep-alive/route";
import * as keepAliveQuery from "@/lib/db/queries/keep-alive";

vi.mock("@/lib/db/queries/keep-alive", () => ({
  pingDatabase: vi.fn(),
}));

describe("Supabase Keep-Alive Cron Endpoint (/api/cron/keep-alive)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.CRON_SECRET;
  });

  it("successfully responds when no CRON_SECRET is configured", async () => {
    vi.mocked(keepAliveQuery.pingDatabase).mockResolvedValueOnce({
      ok: true,
      databaseTime: "2026-10-26T12:00:00.000Z",
      durationMs: 42,
    });

    const request = new NextRequest("http://localhost:3000/api/cron/keep-alive");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.databaseTime).toBe("2026-10-26T12:00:00.000Z");
    expect(data.durationMs).toBe(42);
    expect(keepAliveQuery.pingDatabase).toHaveBeenCalledTimes(1);
  });

  it("rejects unauthorized requests when CRON_SECRET is configured and header is missing", async () => {
    process.env.CRON_SECRET = "super-secret-token";

    const request = new NextRequest("http://localhost:3000/api/cron/keep-alive");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
    expect(keepAliveQuery.pingDatabase).not.toHaveBeenCalled();
  });

  it("rejects requests when Bearer token does not match CRON_SECRET", async () => {
    process.env.CRON_SECRET = "super-secret-token";

    const request = new NextRequest("http://localhost:3000/api/cron/keep-alive", {
      headers: {
        authorization: "Bearer wrong-token",
      },
    });
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
    expect(keepAliveQuery.pingDatabase).not.toHaveBeenCalled();
  });

  it("authorizes request when Bearer token matches CRON_SECRET", async () => {
    process.env.CRON_SECRET = "super-secret-token";

    vi.mocked(keepAliveQuery.pingDatabase).mockResolvedValueOnce({
      ok: true,
      databaseTime: "2026-10-26T12:00:00.000Z",
      durationMs: 15,
    });

    const request = new NextRequest("http://localhost:3000/api/cron/keep-alive", {
      headers: {
        authorization: "Bearer super-secret-token",
      },
    });
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(keepAliveQuery.pingDatabase).toHaveBeenCalledTimes(1);
  });

  it("returns 500 when database ping fails", async () => {
    vi.mocked(keepAliveQuery.pingDatabase).mockRejectedValueOnce(
      new Error("Database connection pool exhausted")
    );

    const request = new NextRequest("http://localhost:3000/api/cron/keep-alive");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Database keep-alive ping failed");
  });
});
