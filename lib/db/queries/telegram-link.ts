import "server-only";
import { sql } from "drizzle-orm";
import { db } from "../client";

/**
 * Saves a hashed one-time token with an expiration timestamp into the user's
 * workflow metadata. Replaces any prior pending link token.
 */
export async function saveTelegramLinkToken(
  userId: string,
  workflowSlug: string,
  tokenHash: string,
  expiresAt: Date
): Promise<boolean> {
  const tokenPayload = JSON.stringify({
    hash: tokenHash,
    expiresAt: expiresAt.getTime(),
  });

  const result = await db.execute<{ updated: boolean }>(sql`
    WITH target_workflow AS (
      SELECT id FROM public.workflows WHERE slug = ${workflowSlug}::text LIMIT 1
    )
    UPDATE public.user_workflow_access uwa
    SET metadata = jsonb_set(COALESCE(uwa.metadata, '{}'::jsonb), '{telegramLinkToken}', ${tokenPayload}::jsonb)
    FROM target_workflow tw
    WHERE uwa.user_id = ${userId}::uuid
      AND uwa.workflow_id = tw.id
    RETURNING true AS updated;
  `);

  return Boolean(result[0]?.updated);
}

/**
 * Atomically verifies and consumes a single-use Telegram link token.
 * If valid and not expired, strips the token from metadata and returns the userId.
 * If invalid or expired, returns null.
 */
export async function verifyAndConsumeTelegramLinkToken(
  tokenHash: string
): Promise<string | null> {
  const now = Date.now();

  const result = await db.execute<{ user_id: string }>(sql`
    WITH matched AS (
      SELECT user_id, workflow_id
      FROM public.user_workflow_access
      WHERE metadata->'telegramLinkToken'->>'hash' = ${tokenHash}
        AND (metadata->'telegramLinkToken'->>'expiresAt')::numeric > ${now}
      LIMIT 1
      FOR UPDATE
    )
    UPDATE public.user_workflow_access uwa
    SET metadata = uwa.metadata - 'telegramLinkToken'
    FROM matched m
    WHERE uwa.user_id = m.user_id AND uwa.workflow_id = m.workflow_id
    RETURNING m.user_id;
  `);

  const row = result[0];
  return row?.user_id ?? null;
}
