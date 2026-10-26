"use client";

import React, { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import {
  Sparkles,
  Calendar,
  Zap,
  XCircle,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  Layers,
  ExternalLink,
} from "lucide-react";
import type { SubscriptionWithDetails } from "@/lib/db/queries/subscriptions";
import type { Plan } from "@/lib/db/queries/plans";
import {
  cancelUserSubscriptionAction,
  getBillingPortalUrlAction,
} from "@/lib/actions/subscriptions";
import { PlanSelectionModal } from "./plan-selection-modal";
import { CancelSubscriptionModal } from "./cancel-subscription-modal";

interface UserSubscriptionCardProps {
  subscription: SubscriptionWithDetails | null;
  availablePlans: Plan[];
}

export function UserSubscriptionCard({
  subscription,
  availablePlans,
}: UserSubscriptionCardProps) {
  const t = useTranslations("profile");
  const locale = useLocale();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [isCanceling, startCancelTransition] = useTransition();
  const [isOpeningPortal, startPortalTransition] = useTransition();
  const searchParams = useSearchParams();
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const displayMessage =
    statusMessage ??
    (searchParams?.get("billing") === "success"
      ? { type: "success" as const, text: t("subscribeSuccess") }
      : null);

  const handleOpenBillingPortal = () => {
    setStatusMessage(null);
    startPortalTransition(async () => {
      const result = await getBillingPortalUrlAction();
      if (result.success && result.portalUrl) {
        window.open(result.portalUrl, "_blank", "noopener,noreferrer");
      } else {
        setStatusMessage({
          type: "error",
          text: result.error || "Failed to load billing portal",
        });
      }
    });
  };

  const handleCancelSubscription = () => {
    if (!subscription) return;
    setStatusMessage(null);

    startCancelTransition(async () => {
      const result = await cancelUserSubscriptionAction(subscription.id);
      setShowCancelConfirm(false);
      if (result.success) {
        setStatusMessage({
          type: "success",
          text: t("subCanceledSuccess"),
        });
      } else {
        setStatusMessage({
          type: "error",
          text: result.error || "Failed to cancel subscription",
        });
      }
    });
  };

  const activePlans = availablePlans.filter((p) => p.isActive);
  const isPaidSubscription = Boolean(
    subscription &&
      subscription.status === "active" &&
      subscription.planPriceMinor > 0 &&
      subscription.planCode !== "free" &&
      subscription.provider !== "system"
  );

  return (
    <>
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--accent)]/10 text-[var(--accent)]">
              <Sparkles className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold text-[var(--text)]">
              {t("subscriptionTitle")}
            </h3>
          </div>

          {subscription && isPaidSubscription ? (
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold border capitalize ${
                subscription.status === "active"
                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                  : subscription.status === "canceled"
                  ? "bg-rose-500/15 text-rose-400 border-rose-500/30"
                  : "bg-amber-500/15 text-amber-400 border-amber-500/30"
              }`}
            >
              {subscription.status}
            </span>
          ) : (
            <span className="rounded-full bg-[var(--surface-2)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--text-muted)] border border-[var(--border)]">
              {t("freeTier")}
            </span>
          )}
        </div>

        {/* Feedback message */}
        {displayMessage && (
          <div
            className={`flex items-center gap-2 rounded-lg p-3 text-xs ${
              displayMessage.type === "success"
                ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                : "border border-rose-500/20 bg-rose-500/10 text-rose-400"
            }`}
          >
            {displayMessage.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 shrink-0" />
            )}
            <span>{displayMessage.text}</span>
          </div>
        )}

        {/* Card Body */}
        {subscription && isPaidSubscription ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--text-muted)]">Plan:</span>
              <span className="font-bold text-sm text-[var(--text)]">
                {subscription.planName}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--text-muted)]">{t("billingInterval")}:</span>
              <span className="font-semibold text-[var(--text)] capitalize">
                {subscription.billingInterval}
              </span>
            </div>

            {subscription.currentPeriodEnd && (
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 text-[var(--text-muted)]">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{t("renewsOrExpires")}:</span>
                </span>
                <span className="font-mono text-[11px] text-[var(--text)]">
                  {new Intl.DateTimeFormat(locale, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  }).format(new Date(subscription.currentPeriodEnd))}
                </span>
              </div>
            )}

            {/* Actions */}
            <div className="pt-3 border-t border-[var(--border)]/60 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="flex-1 min-w-[120px] flex items-center justify-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-xs font-semibold text-[var(--text)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
              >
                <Layers className="h-3.5 w-3.5" />
                <span>{t("changePlan")}</span>
              </button>

              {subscription.provider === "lemonsqueezy" && (
                <button
                  type="button"
                  onClick={handleOpenBillingPortal}
                  disabled={isOpeningPortal}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-3 py-2 text-xs font-semibold text-[var(--accent)] hover:bg-[var(--accent)]/20 transition-colors"
                >
                  {isOpeningPortal ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ExternalLink className="h-3.5 w-3.5" />
                  )}
                  <span>
                    {isOpeningPortal ? t("loadingPortal") : t("manageInPortal")}
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowCancelConfirm(true)}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 transition-colors"
              >
                <XCircle className="h-3.5 w-3.5" />
                <span>{t("cancelSubscription")}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--text-muted)]">Plan:</span>
              <span className="font-bold text-sm text-[var(--text)]">
                {subscription?.planName || "FREE"}
              </span>
            </div>

            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              {t("freeTierDesc")}
            </p>

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[var(--accent)]/90 active:scale-[0.98] transition-all"
            >
              <Zap className="h-4 w-4" />
              <span>{t("upgradePlan")}</span>
            </button>
          </div>
        )}

      </div>

      {/* Strict Cancellation Confirmation Modal */}
      <CancelSubscriptionModal
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={handleCancelSubscription}
        isCanceling={isCanceling}
        planName={subscription?.planName || "Pro"}
      />

      {/* Upgrade / Select Plan Modal */}
      <PlanSelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        plans={activePlans}
        currentPlanId={subscription?.planId}
      />
    </>
  );
}
