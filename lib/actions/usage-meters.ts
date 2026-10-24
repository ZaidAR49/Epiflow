"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { createUsageMeterSchema } from "@/lib/validation/usage-meters";
import { createUsageMeter } from "@/lib/db/queries/usage-meters";
import { getUserById } from "@/lib/db/queries/users";
import { logger } from "@/lib/logger";

async function verifyAdminCaller() {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "Unauthorized: Please sign in" };
  }

  const caller = await getUserById(session.user.id);
  if (!caller || caller.role !== "admin" || caller.status === "locked") {
    return { ok: false, error: "Unauthorized: Admin privileges required" };
  }

  return { ok: true, callerId: session.user.id };
}

/**
 * Admin action: registers a new usage meter into the platform catalog.
 */
export async function createUsageMeterAction(rawInput: unknown) {
  const authCheck = await verifyAdminCaller();
  if (!authCheck.ok) {
    return { success: false, error: authCheck.error };
  }

  const parsed = createUsageMeterSchema.safeParse(rawInput);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues[0]?.message || "Invalid usage meter data";
    return { success: false, error: errorMsg };
  }

  try {
    const created = await createUsageMeter(parsed.data);

    revalidatePath("/[locale]/admin", "page");

    return { success: true, meterId: created.id };
  } catch (error) {
    logger.error({ err: error, input: parsed.data }, "Failed to create usage meter");
    const message = error instanceof Error ? error.message : "Failed to create usage meter";
    return { success: false, error: message };
  }
}
