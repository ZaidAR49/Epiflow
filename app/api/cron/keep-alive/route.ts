import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { pingDatabase } from "@/lib/db/queries/keep-alive";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

function isAuthorizedCron(authHeader: string | null, cronSecret: string): boolean {
  if (!authHeader) return false;
  const expected = Buffer.from(`Bearer ${cronSecret}`);
  const actual = Buffer.from(authHeader);
  if (expected.length !== actual.length) {
    return false;
  }
  return crypto.timingSafeEqual(expected, actual);
}

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  // In production, CRON_SECRET must always be set and verified
  if (process.env.NODE_ENV === "production" && !cronSecret) {
    logger.error("[KeepAliveCron] CRON_SECRET is not configured in production");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (cronSecret && !isAuthorizedCron(authHeader, cronSecret)) {
    logger.warn({ ip: request.headers.get("x-forwarded-for") }, "[KeepAliveCron] Unauthorized keep-alive request rejected");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await pingDatabase();

    logger.info(
      { databaseTime: result.databaseTime, durationMs: result.durationMs },
      "[KeepAliveCron] Supabase keep-alive ping succeeded"
    );

    return NextResponse.json({
      success: true,
      service: "supabase-keep-alive",
      databaseTime: result.databaseTime,
      durationMs: result.durationMs,
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
