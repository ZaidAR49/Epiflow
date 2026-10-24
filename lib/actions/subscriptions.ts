"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import {
  assignPlanSchema,
  cancelSubscriptionSchema,
} from "@/lib/validation/subscriptions";
import {
  createMockSubscription,
  cancelSubscription,
  getUserSubscription,
} from "@/lib/db/queries/subscriptions";
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
 * Admin action: assigns a plan to any user and immediately activates workflow entitlements.
 */
export async function assignPlanToUserAction(rawInput: unknown) {
  const authCheck = await verifyAdminCaller();
  if (!authCheck.ok) {
    return { success: false, error: authCheck.error };
  }

  const parsed = assignPlanSchema.safeParse(rawInput);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues[0]?.message || "Invalid assignment parameters";
    return { success: false, error: errorMsg };
  }

  try {
    const { userId, planId, periodDays } = parsed.data;
    const result = await createMockSubscription(userId, planId, periodDays);

    revalidatePath("/[locale]/admin", "page");
    revalidatePath("/[locale]/profile", "page");

    return { success: true, subscriptionId: result.subscriptionId };
  } catch (error) {
    logger.error({ err: error }, "Failed to assign plan to user");
    const message = error instanceof Error ? error.message : "Failed to assign plan";
    return { success: false, error: message };
  }
}

/**
 * Admin action: cancels a customer's subscription and immediately revokes granted workflow access.
 */
export async function cancelSubscriptionAction(rawInput: unknown) {
  const authCheck = await verifyAdminCaller();
  if (!authCheck.ok) {
    return { success: false, error: authCheck.error };
  }

  const parsed = cancelSubscriptionSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: "Invalid subscription ID" };
  }

  try {
    const success = await cancelSubscription(parsed.data.subscriptionId);
    if (!success) {
      return { success: false, error: "Subscription not found or already canceled" };
    }

    revalidatePath("/[locale]/admin", "page");
    revalidatePath("/[locale]/profile", "page");

    return { success: true };
  } catch (error) {
    logger.error({ err: error }, "Failed to cancel subscription");
    const message = error instanceof Error ? error.message : "Failed to cancel subscription";
    return { success: false, error: message };
  }
}

/**
 * User / Mock Checkout Action:
 * Allows the currently signed-in user to subscribe to a plan (simulates checkout).
 */
export async function mockSubscribeAction(planId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized: Please sign in to subscribe" };
  }

  try {
    const result = await createMockSubscription(session.user.id, planId, 30);

    revalidatePath("/[locale]/profile", "page");
    revalidatePath("/[locale]/pricing", "page");
    revalidatePath("/[locale]/admin", "page");

    return { success: true, subscriptionId: result.subscriptionId };
  } catch (error) {
    logger.error({ err: error, userId: session.user.id, planId }, "Mock subscribe failed");
    const message = error instanceof Error ? error.message : "Subscription failed";
    return { success: false, error: message };
  }
}

/**
 * User action: allows the signed-in user to cancel their own active subscription.
 */
export async function cancelUserSubscriptionAction(subscriptionId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized: Please sign in" };
  }

  try {
    const currentSub = await getUserSubscription(session.user.id);
    if (!currentSub || currentSub.id !== subscriptionId) {
      return { success: false, error: "Active subscription not found for your account" };
    }

    const success = await cancelSubscription(subscriptionId);
    if (!success) {
      return { success: false, error: "Failed to cancel subscription" };
    }

    revalidatePath("/[locale]/profile", "page");
    revalidatePath("/[locale]/admin", "page");

    return { success: true };
  } catch (error) {
    logger.error(
      { err: error, userId: session.user.id, subscriptionId },
      "Failed to cancel user subscription"
    );
    const message = error instanceof Error ? error.message : "Failed to cancel subscription";
    return { success: false, error: message };
  }
}
