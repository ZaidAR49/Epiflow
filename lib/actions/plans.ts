"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { planFormSchema, updatePlanFormSchema } from "@/lib/validation/plans";
import {
  createPlan,
  updatePlan,
  togglePlanActive,
  getPlanById,
  getPlanByCode,
} from "@/lib/db/queries/plans";
import { getUserById } from "@/lib/db/queries/users";
import { logger } from "@/lib/logger";

async function verifyAdminOrEditorCaller() {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "Unauthorized: Please sign in" };
  }

  const caller = await getUserById(session.user.id);
  if (
    !caller ||
    (caller.role !== "admin" && caller.role !== "editor") ||
    caller.status === "locked"
  ) {
    return { ok: false, error: "Unauthorized: Admin or Editor privileges required" };
  }

  return { ok: true, callerId: session.user.id };
}

export async function createPlanAction(rawInput: unknown) {
  const authCheck = await verifyAdminOrEditorCaller();
  if (!authCheck.ok) {
    return { success: false, error: authCheck.error };
  }

  const parsed = planFormSchema.safeParse(rawInput);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues[0]?.message || "Invalid plan parameters";
    return { success: false, error: errorMsg };
  }

  try {
    const existing = await getPlanByCode(parsed.data.code);
    if (existing) {
      return { success: false, error: "A plan with this code already exists" };
    }

    const newPlan = await createPlan({
      code: parsed.data.code,
      name: parsed.data.name,
      priceMinor: parsed.data.priceMinor,
      currency: parsed.data.currency,
      billingInterval: parsed.data.billingInterval,
      trialDays: parsed.data.trialDays,
      provider: parsed.data.provider ?? "mock",
      providerPriceId: parsed.data.providerPriceId ?? null,
      entitlements: parsed.data.entitlements,
      isActive: parsed.data.isActive,
    });

    revalidatePath("/[locale]/admin", "page");
    revalidatePath("/[locale]/pricing", "page");

    return { success: true, plan: newPlan };
  } catch (error) {
    logger.error({ err: error }, "Failed to create plan");
    const message = error instanceof Error ? error.message : "Failed to create plan";
    return { success: false, error: message };
  }
}

export async function updatePlanAction(rawInput: unknown) {
  const authCheck = await verifyAdminOrEditorCaller();
  if (!authCheck.ok) {
    return { success: false, error: authCheck.error };
  }

  const parsed = updatePlanFormSchema.safeParse(rawInput);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues[0]?.message || "Invalid plan update parameters";
    return { success: false, error: errorMsg };
  }

  try {
    const { id, ...patch } = parsed.data;

    const existing = await getPlanById(id);
    if (!existing) {
      return { success: false, error: "Plan not found" };
    }

    if (existing.code === "free") {
      if (patch.code && patch.code !== "free") {
        return { success: false, error: "The default free plan code cannot be altered" };
      }
      if (patch.isActive === false) {
        return { success: false, error: "The default free plan cannot be deactivated" };
      }
    }

    if (patch.code && patch.code !== existing.code) {
      const duplicate = await getPlanByCode(patch.code);
      if (duplicate && duplicate.id !== id) {
        return { success: false, error: "A plan with this code already exists" };
      }
    }

    const updated = await updatePlan(id, patch);

    revalidatePath("/[locale]/admin", "page");
    revalidatePath("/[locale]/pricing", "page");

    return { success: true, plan: updated };
  } catch (error) {
    logger.error({ err: error }, "Failed to update plan");
    const message = error instanceof Error ? error.message : "Failed to update plan";
    return { success: false, error: message };
  }
}

export async function togglePlanActiveAction(planId: string) {
  const authCheck = await verifyAdminOrEditorCaller();
  if (!authCheck.ok) {
    return { success: false, error: authCheck.error };
  }

  try {
    const existing = await getPlanById(planId);
    if (!existing) {
      return { success: false, error: "Plan not found" };
    }

    if (existing.code === "free") {
      return { success: false, error: "The default free plan cannot be deactivated" };
    }

    const updated = await togglePlanActive(planId);
    if (!updated) {
      return { success: false, error: "Plan not found" };
    }

    revalidatePath("/[locale]/admin", "page");
    revalidatePath("/[locale]/pricing", "page");

    return { success: true, isActive: updated.isActive };
  } catch (error) {
    logger.error({ err: error, planId }, "Failed to toggle plan active state");
    return { success: false, error: "Failed to toggle plan status" };
  }
}
