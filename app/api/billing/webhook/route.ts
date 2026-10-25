import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { verifyLemonSqueezyWebhookSignature } from "@/lib/services/billing/lemonsqueezy";
import {
  syncLemonSqueezySubscription,
  recordLemonSqueezyPayment,
} from "@/lib/db/queries/billing-webhooks";

const webhookEnvelopeSchema = z.object({
  meta: z.object({
    event_name: z.string(),
    custom_data: z
      .object({
        user_id: z.string().optional(),
        plan_id: z.string().optional(),
      })
      .optional(),
  }),
  data: z.object({
    id: z.string(),
    type: z.string(),
    attributes: z.record(z.string(), z.unknown()),
  }),
});

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-signature");

    const isValid = verifyLemonSqueezyWebhookSignature(rawBody, signature);
    if (!isValid) {
      logger.warn(
        { hasSignature: Boolean(signature) },
        "[BillingWebhook] Unauthorized webhook payload: invalid signature"
      );
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Malformed JSON" }, { status: 400 });
    }

    const parseResult = webhookEnvelopeSchema.safeParse(parsedJson);
    if (!parseResult.success) {
      logger.warn(
        { issues: parseResult.error.issues },
        "[BillingWebhook] Schema validation failed for webhook envelope"
      );
      return NextResponse.json({ error: "Invalid payload structure" }, { status: 400 });
    }

    const { meta, data } = parseResult.data;
    const eventName = meta.event_name;
    const customData = meta.custom_data;
    const attributes = data.attributes;

    logger.info(
      { eventName, resourceId: data.id, resourceType: data.type },
      "[BillingWebhook] Processing Lemon Squeezy event"
    );

    // 1. Subscription lifecycle events
    if (
      eventName === "subscription_created" ||
      eventName === "subscription_updated" ||
      eventName === "subscription_resumed" ||
      eventName === "subscription_cancelled" ||
      eventName === "subscription_expired"
    ) {
      const statusRaw = typeof attributes["status"] === "string" ? attributes["status"] : "active";
      const renewsAtRaw = typeof attributes["renews_at"] === "string" ? attributes["renews_at"] : null;
      const endsAtRaw = typeof attributes["ends_at"] === "string" ? attributes["ends_at"] : null;
      const createdAtRaw = typeof attributes["created_at"] === "string" ? attributes["created_at"] : null;
      const isCancelled = Boolean(attributes["cancelled"]);

      const currentPeriodEnd = renewsAtRaw
        ? new Date(renewsAtRaw)
        : endsAtRaw
        ? new Date(endsAtRaw)
        : null;

      const currentPeriodStart = createdAtRaw ? new Date(createdAtRaw) : null;

      await syncLemonSqueezySubscription({
        providerSubscriptionId: data.id,
        status: statusRaw,
        currentPeriodStart,
        currentPeriodEnd,
        cancelAtPeriodEnd: isCancelled,
        userId: customData?.user_id,
        planId: customData?.plan_id,
      });
    }

    // 2. Order/Payment success events
    if (eventName === "order_created" || eventName === "subscription_payment_success") {
      const totalMinor = typeof attributes["total"] === "number" ? attributes["total"] : 0;
      const currency = typeof attributes["currency"] === "string" ? attributes["currency"] : "USD";
      const status = typeof attributes["status"] === "string" ? attributes["status"] : "succeeded";
      const receiptUrl =
        typeof attributes["urls"] === "object" && attributes["urls"] !== null
          ? (attributes["urls"] as Record<string, unknown>)["receipt"] as string | undefined
          : undefined;

      const userId = customData?.user_id;
      const planId = customData?.plan_id;
      const subscriptionId =
        typeof attributes["subscription_id"] === "string" || typeof attributes["subscription_id"] === "number"
          ? String(attributes["subscription_id"])
          : undefined;

      if (userId) {
        await recordLemonSqueezyPayment({
          userId,
          planId,
          subscriptionId,
          providerPaymentId: data.id,
          amountMinor: totalMinor,
          currency: currency.toUpperCase().slice(0, 3),
          status,
          receiptUrl: receiptUrl || null,
          paidAt: new Date(),
        });
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    logger.error({ err: error }, "[BillingWebhook] Internal server error handling webhook");
    return NextResponse.json({ error: "Internal processing error" }, { status: 500 });
  }
}
