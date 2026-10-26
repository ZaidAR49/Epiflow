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
import { getPlanById } from "@/lib/db/queries/plans";
import { ensureUserFreeSubscription } from "@/lib/db/queries/free-plan";
import {
  createLemonSqueezyCheckout,
  getLemonSqueezyCustomerPortalUrl,
  cancelLemonSqueezySubscription,
} from "@/lib/services/billing/lemonsqueezy";
import { getServerEnv } from "@/lib/env";
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

/**
 * Admin action: assigns a plan to any user and immediately activates workflow entitlements.
 */
export async function assignPlanToUserAction(rawInput: unknown) {
  const authCheck = await verifyAdminOrEditorCaller();
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

    revalidatePath("/admin");
    revalidatePath("/profile");

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
  const authCheck = await verifyAdminOrEditorCaller();
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

    revalidatePath("/admin");
    revalidatePath("/profile");

    return { success: true };
  } catch (error) {
    logger.error({ err: error }, "Failed to cancel subscription");
    const message = error instanceof Error ? error.message : "Failed to cancel subscription";
    return { success: false, error: message };
  }
}

/**
 * Initiates a checkout session for the authenticated user.
 * - For Free tier (priceMinor === 0): enrolls the user in the free plan and refreshes quotas.
 * - For Paid plans (Lemon Squeezy): validates configuration and creates a hosted checkout session.
 * - For Mock plans (test environments only): creates mock subscription ONLY if plan.provider === 'mock'.
 * Never automatically upgrades users to a paid plan without payment.
 */
export async function createCheckoutSessionAction(planId: string, locale?: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized: Please sign in to subscribe" };
  }

  try {
    const plan = await getPlanById(planId);
    if (!plan || !plan.isActive) {
      return { success: false, error: "Selected plan is unavailable" };
    }

    const loc = locale || "en";

    // 1. Free plan selection: enroll directly
    if (plan.priceMinor === 0 || plan.code === "free") {
      await ensureUserFreeSubscription(session.user.id);
      revalidatePath(`/${loc}/profile`);
      revalidatePath(`/${loc}/admin`);
      return {
        success: true,
        isFreePlan: true,
      };
    }

    const env = getServerEnv();
    const hasLemonKeys = Boolean(
      env.LEMONSQUEEZY_API_KEY?.trim() && env.LEMONSQUEEZY_STORE_ID?.trim()
    );

    // 2. Lemon Squeezy provider: strictly enforce provider variant ID and gateway configuration
    if (plan.provider === "lemonsqueezy") {
      if (!plan.providerPriceId?.trim()) {
        return {
          success: false,
          error: "This plan is not yet configured for online checkout (missing payment provider variant ID).",
        };
      }

      if (!hasLemonKeys) {
        return {
          success: false,
          error: "Payment gateway is not currently configured on the server.",
        };
      }

      const redirectUrl = `${env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, "")}/${loc}/profile?billing=success`;

      const checkoutRes = await createLemonSqueezyCheckout({
        variantId: plan.providerPriceId,
        userId: session.user.id,
        planId: plan.id,
        userEmail: session.user.email || "",
        userName: session.user.name || "Customer",
        redirectUrl,
      });

      if (!checkoutRes.success) {
        return { success: false, error: checkoutRes.error.safeMessage };
      }

      return {
        success: true,
        checkoutUrl: checkoutRes.data.checkoutUrl,
        isHostedCheckout: true,
      };
    }

    // 3. Mock provider (Only allowed for plans explicitly configured with provider='mock' for local tests)
    if (plan.provider === "mock") {
      const mockResult = await createMockSubscription(session.user.id, planId, 30);
      revalidatePath(`/${loc}/profile`);
      revalidatePath(`/${loc}/admin`);

      return {
        success: true,
        subscriptionId: mockResult.subscriptionId,
        isMock: true,
      };
    }

    return {
      success: false,
      error: "Unsupported payment provider for this plan.",
    };
  } catch (error) {
    logger.error(
      { err: error, userId: session.user.id, planId },
      "Checkout session initiation failed"
    );
    const message = error instanceof Error ? error.message : "Failed to initiate checkout";
    return { success: false, error: message };
  }
}

/**
 * Legacy mock subscribe action for backward compatibility in test suites.
 */
export async function mockSubscribeAction(planId: string) {
  return createCheckoutSessionAction(planId);
}

/**
 * Returns customer billing portal URL from Lemon Squeezy for self-service cancellation & invoices.
 */
export async function getBillingPortalUrlAction() {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized: Please sign in" };
  }

  try {
    const sub = await getUserSubscription(session.user.id);
    if (!sub || sub.provider !== "lemonsqueezy") {
      return {
        success: false,
        error: "Billing portal is only available for active Lemon Squeezy subscriptions",
      };
    }

    const portalUrl = await getLemonSqueezyCustomerPortalUrl(sub.providerSubscriptionId);
    if (!portalUrl) {
      return { success: false, error: "Unable to retrieve billing portal at this time" };
    }

    return { success: true, portalUrl };
  } catch (error) {
    logger.error({ err: error, userId: session.user.id }, "Failed to fetch billing portal URL");
    return { success: false, error: "Failed to load billing portal" };
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

    if (currentSub.planCode === "free" || currentSub.provider === "system" || currentSub.planPriceMinor === 0) {
      return { success: false, error: "Free plan does not have an active billing subscription to cancel" };
    }

    // If active Lemon Squeezy subscription, terminate recurring billing at provider
    if (currentSub.provider === "lemonsqueezy" && currentSub.providerSubscriptionId) {
      await cancelLemonSqueezySubscription(currentSub.providerSubscriptionId);
    }

    const success = await cancelSubscription(subscriptionId, session.user.id);
    if (!success) {
      return { success: false, error: "Failed to cancel subscription" };
    }

    // Seamlessly restore default Free tier access and quotas
    await ensureUserFreeSubscription(session.user.id);

    revalidatePath("/profile");
    revalidatePath("/admin");

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

