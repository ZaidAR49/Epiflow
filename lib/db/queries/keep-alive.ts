import "server-only";
import { getServerEnv } from "@/lib/env";
import { logger } from "@/lib/logger";

export interface KeepAlivePing {
  request: "upsert" | "select" | "count";
  status: number;
  ok: boolean;
}

export interface KeepAliveResult {
  ok: boolean;
  pings: KeepAlivePing[];
  pingsSent: number;
  lastPing: string | null;
  durationMs: number;
}

/**
 * Builds the shared PostgREST headers for the Supabase Data API.
 * Using service_role key so the anon RLS check is bypassed;
 * the route is protected by CRON_SECRET anyway.
 */
function supabaseHeaders(serviceRoleKey: string): HeadersInit {
  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
}

/**
 * Sends three distinct Supabase Data API (PostgREST) requests against the
 * `_keepalive` table to reliably register activity with the Supabase API
 * gateway counter — which is what Supabase actually measures for the free-tier
 * inactivity check.  Direct TCP/Drizzle connections do NOT increment this
 * counter.
 *
 * Request breakdown:
 *   1. PATCH/upsert  → write activity  (HTTP POST with Prefer: resolution=merge-duplicates)
 *   2. SELECT single → read activity   (HTTP GET ?id=eq.1)
 *   3. HEAD count    → extra API hit   (HTTP GET with Prefer: count=exact, head=true)
 */
export async function pingDatabase(): Promise<KeepAliveResult> {
  const env = getServerEnv();

  const supabaseUrl = env.SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set for keep-alive pings."
    );
  }

  const tableUrl = `${supabaseUrl}/rest/v1/_keepalive`;
  const headers = supabaseHeaders(serviceRoleKey);
  const pings: KeepAlivePing[] = [];
  const start = performance.now();
  const now = new Date().toISOString();

  // ── Request 1: Upsert (write activity) ──────────────────────────────────
  const upsertRes = await fetch(tableUrl, {
    method: "POST",
    headers: {
      ...headers,
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify({ id: 1, last_ping: now }),
  });
  pings.push({ request: "upsert", status: upsertRes.status, ok: upsertRes.ok });

  if (!upsertRes.ok) {
    const body = await upsertRes.text();
    logger.error(
      { status: upsertRes.status, body },
      "[KeepAlive] Upsert request failed"
    );
    throw new Error(`Upsert failed with HTTP ${upsertRes.status}: ${body}`);
  }

  // ── Request 2: Select single row (read activity) ─────────────────────────
  const selectRes = await fetch(`${tableUrl}?id=eq.1&select=id,last_ping`, {
    method: "GET",
    headers,
  });
  pings.push({ request: "select", status: selectRes.status, ok: selectRes.ok });

  if (!selectRes.ok) {
    const body = await selectRes.text();
    logger.error(
      { status: selectRes.status, body },
      "[KeepAlive] Select request failed"
    );
    throw new Error(`Select failed with HTTP ${selectRes.status}: ${body}`);
  }

  const rows = (await selectRes.json()) as Array<{
    id: number;
    last_ping: string;
  }>;
  const lastPing = rows[0]?.last_ping ?? null;

  // ── Request 3: HEAD count (extra API gateway hit) ─────────────────────────
  const countRes = await fetch(`${tableUrl}?select=*`, {
    method: "HEAD",
    headers: {
      ...headers,
      Prefer: "count=exact",
    },
  });
  pings.push({ request: "count", status: countRes.status, ok: countRes.ok });

  if (!countRes.ok) {
    logger.warn(
      { status: countRes.status },
      "[KeepAlive] Count HEAD request failed (non-fatal)"
    );
    // Non-fatal: the first two requests already registered activity.
  }

  const durationMs = Math.round(performance.now() - start);
  const allOk = pings.every((p) => p.ok);

  return {
    ok: allOk,
    pings,
    pingsSent: pings.filter((p) => p.ok).length,
    lastPing,
    durationMs,
  };
}
