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
import {
  createLemonSqueezyCheckout,
  getLemonSqueezyCustomerPortalUrl,
} from "@/lib/services/billing/lemonsqueezy";
import { getServerEnv } from "@/lib/env";
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
 * Initiates a checkout session for the authenticated user.
 * If Lemon Squeezy is configured and the plan has a variant ID, redirects to Lemon Squeezy checkout.
 * Otherwise, falls back to instant mock subscription for development testing.
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

    const env = getServerEnv();
    const hasLemonKeys = Boolean(
      env.LEMONSQUEEZY_API_KEY?.trim() && env.LEMONSQUEEZY_STORE_ID?.trim()
    );

    // If configured with Lemon Squeezy variant ID and live API keys:
    if (hasLemonKeys && plan.provider === "lemonsqueezy" && plan.providerPriceId) {
      const redirectUrl = `${env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, "")}/${locale || "en"}/profile?billing=success`;

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

    // Development / Testbench Fallback: Activate mock subscription immediately
    const mockResult = await createMockSubscription(session.user.id, planId, 30);

    revalidatePath("/[locale]/profile", "page");
    revalidatePath("/[locale]/admin", "page");

    return {
      success: true,
      subscriptionId: mockResult.subscriptionId,
      isMock: true,
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

