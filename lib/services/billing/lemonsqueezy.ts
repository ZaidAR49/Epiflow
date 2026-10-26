import "server-only";

import crypto from "crypto";
import { getServerEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { ok, err, type Result } from "@/lib/result";
import { AppError, ErrorCodes } from "@/lib/errors";

const LEMON_SQUEEZY_API_BASE = "https://api.lemonsqueezy.com/v1";

export interface CreateCheckoutInput {
  variantId: string;
  userId: string;
  planId: string;
  userEmail: string;
  userName: string;
  redirectUrl?: string;
}

export interface LemonSqueezyCheckoutResult {
  checkoutUrl: string;
}

/**
 * Creates a hosted checkout session via Lemon Squeezy API v1.
 * Passes the user_id and plan_id in checkout custom data so webhooks map back cleanly.
 */
export async function createLemonSqueezyCheckout(
  input: CreateCheckoutInput
): Promise<Result<LemonSqueezyCheckoutResult, AppError>> {
  const env = getServerEnv();
  const apiKey = env.LEMONSQUEEZY_API_KEY?.trim();
  const storeId = env.LEMONSQUEEZY_STORE_ID?.trim();

  if (!apiKey || !storeId) {
    logger.warn(
      { hasApiKey: Boolean(apiKey), hasStoreId: Boolean(storeId) },
      "[LemonSqueezy] Credentials missing in environment"
    );
    return err(
      new AppError(
        ErrorCodes.INTERNAL_ERROR,
        500,
        "Billing gateway is not currently configured"
      )
    );
  }

  const appUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, "");
  const redirectUrl =
    input.redirectUrl || `${appUrl}/profile?billing=success`;

  const payload = {
    data: {
      type: "checkouts",
      attributes: {
        checkout_data: {
          email: input.userEmail,
          name: input.userName,
          custom: {
            user_id: input.userId,
            plan_id: input.planId,
          },
        },
        product_options: {
          redirect_url: redirectUrl,
        },
      },
      relationships: {
        store: {
          data: {
            type: "stores",
            id: storeId,
          },
        },
        variant: {
          data: {
            type: "variants",
            id: input.variantId,
          },
        },
      },
    },
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(`${LEMON_SQUEEZY_API_BASE}/checkouts`, {
      method: "POST",
      headers: {
        Accept: "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const errorText = await res.text();
      logger.error(
        { status: res.status, errorText, variantId: input.variantId },
        "[LemonSqueezy] Checkout creation failed"
      );
      return err(
        new AppError(
          ErrorCodes.INTERNAL_ERROR,
          502,
          "Failed to initialize checkout session with payment provider"
        )
      );
    }

    const json = (await res.json()) as {
      data?: {
        attributes?: {
          url?: string;
        };
      };
    };

    const checkoutUrl = json.data?.attributes?.url;
    if (!checkoutUrl) {
      return err(
        new AppError(
          ErrorCodes.INTERNAL_ERROR,
          502,
          "Payment gateway returned an invalid checkout URL"
        )
      );
    }

    return ok({ checkoutUrl });
  } catch (error) {
    logger.error({ err: error }, "[LemonSqueezy] Network error creating checkout");
    return err(
      new AppError(
        ErrorCodes.INTERNAL_ERROR,
        500,
        "Network error communicating with payment provider"
      )
    );
  }
}

/**
 * Retrieves the customer billing portal URL for an active Lemon Squeezy subscription.
 */
export async function getLemonSqueezyCustomerPortalUrl(
  subscriptionId: string
): Promise<string | null> {
  const env = getServerEnv();
  const apiKey = env.LEMONSQUEEZY_API_KEY?.trim();

  if (!apiKey) return null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(
      `${LEMON_SQUEEZY_API_BASE}/subscriptions/${subscriptionId}`,
      {
        headers: {
          Accept: "application/vnd.api+json",
          Authorization: `Bearer ${apiKey}`,
        },
        signal: controller.signal,
      }
    );

    clearTimeout(timeout);

    if (!res.ok) return null;

    const json = (await res.json()) as {
      data?: {
        attributes?: {
          urls?: {
            customer_portal?: string;
          };
        };
      };
    };

    return json.data?.attributes?.urls?.customer_portal || null;
  } catch (error) {
    logger.warn({ err: error, subscriptionId }, "[LemonSqueezy] Failed to fetch customer portal");
    return null;
  }
}

/**
 * Verifies Lemon Squeezy webhook signature using timing-safe HMAC-SHA256 comparison.
 */
export function verifyLemonSqueezyWebhookSignature(
  rawBody: string,
  signature: string | null
): boolean {
  const env = getServerEnv();
  const secret = env.LEMONSQUEEZY_WEBHOOK_SECRET?.trim();

  if (!secret || !signature) {
    return false;
  }

  try {
    const hmac = crypto.createHmac("sha256", secret);
    const expected = Buffer.from(hmac.update(rawBody).digest("hex"), "utf8");
    const received = Buffer.from(signature, "utf8");

    if (expected.length !== received.length) {
      return false;
    }

    return crypto.timingSafeEqual(expected, received);
  } catch (error) {
    logger.error({ err: error }, "[LemonSqueezy] Webhook signature verification error");
    return false;
  }
}

/**
 * Cancels a subscription in Lemon Squeezy via API.
 */
export async function cancelLemonSqueezySubscription(
  subscriptionId: string
): Promise<boolean> {
  const env = getServerEnv();
  const apiKey = env.LEMONSQUEEZY_API_KEY?.trim();

  if (!apiKey) {
    logger.warn("[LemonSqueezy] Missing API key for subscription cancellation");
    return false;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(
      `${LEMON_SQUEEZY_API_BASE}/subscriptions/${subscriptionId}`,
      {
        method: "DELETE",
        headers: {
          Accept: "application/vnd.api+json",
          Authorization: `Bearer ${apiKey}`,
        },
        signal: controller.signal,
      }
    );

    clearTimeout(timeout);

    if (!res.ok) {
      const errText = await res.text();
      logger.error(
        { status: res.status, errText, subscriptionId },
        "[LemonSqueezy] Failed to cancel subscription via API"
      );
      return false;
    }

    logger.info({ subscriptionId }, "[LemonSqueezy] Successfully cancelled subscription via API");
    return true;
  } catch (error) {
    logger.error(
      { err: error, subscriptionId },
      "[LemonSqueezy] Exception cancelling subscription via API"
    );
    return false;
  }
}
