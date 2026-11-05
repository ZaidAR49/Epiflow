import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { pingDatabase } from "@/lib/db/queries/keep-alive";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

function isAuthorizedCron(
  authHeader: string | null,
  cronSecret: string
): boolean {
  if (!authHeader) return false;
  const expected = Buffer.from(`Bearer ${cronSecret}`);
  const actual = Buffer.from(authHeader);
  if (expected.length !== actual.length) {
    return false;
  }
  return crypto.timingSafeEqual(expected, actual);
}

/**
 * GET /api/cron/keep-alive
 *
 * Sends 3 Supabase Data API (REST) requests to register genuine activity with
 * the Supabase API gateway counter, preventing free-tier project pausing.
 *
 * Security: protected by CRON_SECRET via constant-time comparison (prevents
 * timing attacks).  Vercel automatically sends this secret in the Authorization
 * header when triggering cron jobs defined in vercel.json.
 *
 * Schedule (vercel.json): "0 4 * * *"  → once daily at 04:00 UTC.
 * Each invocation fires 3 REST pings, which is well above the threshold needed
 * to satisfy Supabase's 7-day rolling activity window.
 *
 * External schedulers (Cron-job.org / GitHub Actions):
 * Hit this endpoint every 2–3 days with:
 *   Authorization: Bearer <CRON_SECRET>
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  // In production, CRON_SECRET must always be set and verified
  if (process.env.NODE_ENV === "production" && !cronSecret) {
    logger.error("[KeepAliveCron] CRON_SECRET is not configured in production");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (cronSecret && !isAuthorizedCron(authHeader, cronSecret)) {
    logger.warn(
      { ip: request.headers.get("x-forwarded-for") },
      "[KeepAliveCron] Unauthorized keep-alive request rejected"
    );
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await pingDatabase();

    logger.info(
      {
        pingsSent: result.pingsSent,
        lastPing: result.lastPing,
        durationMs: result.durationMs,
        pings: result.pings,
      },
      "[KeepAliveCron] Supabase keep-alive pings completed"
    );

    return NextResponse.json({
      success: result.ok,
      service: "supabase-keep-alive",
      pingsSent: result.pingsSent,
      lastPing: result.lastPing,
      durationMs: result.durationMs,
      pings: result.pings,
    });
  } catch (error) {
    logger.error({ error }, "[KeepAliveCron] Supabase keep-alive ping failed");

    return NextResponse.json(
      {
        success: false,
        error: "Database keep-alive ping failed",
      },
      { status: 500 }
    );
  }
}
