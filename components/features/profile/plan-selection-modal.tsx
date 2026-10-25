"use client";

import React, { useState, useTransition, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  X,
  Sparkles,
  Check,
  Zap,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import type { Plan } from "@/lib/db/queries/plans";
import { createCheckoutSessionAction } from "@/lib/actions/subscriptions";

interface PlanSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  plans: Plan[];
  currentPlanId?: string | null;
}

export function PlanSelectionModal({
  isOpen,
  onClose,
  plans,
  currentPlanId,
}: PlanSelectionModalProps) {
  const t = useTranslations("profile");
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isPending) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isPending, onClose]);

  if (!isOpen) return null;

  const handleSubscribe = (planId: string) => {
    setSelectedPlanId(planId);
    setErrorMessage(null);
    setSuccessMessage(null);

    startTransition(async () => {
      const result = await createCheckoutSessionAction(planId, locale);
      if (result.success) {
        if ("checkoutUrl" in result && result.checkoutUrl) {
          window.location.href = result.checkoutUrl;
          return;
        }
        setSuccessMessage(t("subscribeSuccess"));
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setErrorMessage(result.error || "Subscription activation failed");
      }
    });
  };

  const formatPrice = (minor: number, currency: string, interval: string) => {
    const formatted = (minor / 100).toLocaleString(undefined, {
      style: "currency",
      currency: currency.toUpperCase(),
      maximumFractionDigits: 0,
    });
    return `${formatted} / ${interval}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl sm:p-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="plan-selection-title"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[var(--border)] pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[var(--accent)]" />
              <h2
                id="plan-selection-title"
                className="text-lg font-bold text-[var(--text)] sm:text-xl"
              >
                {t("selectPlanModalTitle")}
              </h2>
            </div>
            <p className="text-xs text-[var(--text-muted)] sm:text-sm">
              {t("selectPlanModalSubtitle")}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            aria-label="Close"
            className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:outline-hidden transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Feedback Messages */}
        {errorMessage && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-400">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Plans Grid */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {plans.map((plan) => {
            const isCurrent = currentPlanId === plan.id;
            const isThisPending = isPending && selectedPlanId === plan.id;
            const entitlements = plan.entitlements || {};
            const workflows = Object.entries(entitlements);

            return (
              <div
                key={plan.id}
                className={`flex flex-col justify-between rounded-xl border p-5 transition-all ${
                  isCurrent
                    ? "border-[var(--accent)] bg-[var(--surface-2)]/80 shadow-md ring-1 ring-[var(--accent)]/30"
                    : "border-[var(--border)] bg-[var(--surface-2)]/40 hover:border-[var(--accent)]/40"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-base text-[var(--text)]">
                      {plan.name}
                    </span>
                    {isCurrent && (
                      <span className="rounded-full bg-[var(--accent)]/20 px-2 py-0.5 text-[10px] font-bold text-[var(--accent)] border border-[var(--accent)]/30">
                        {t("currentPlanBadge")}
                      </span>
                    )}
                  </div>

                  <div className="text-xl font-black text-[var(--text)] tracking-tight">
                    {formatPrice(plan.priceMinor, plan.currency, plan.billingInterval)}
                  </div>

                  {/* Entitlements List */}
                  <div className="pt-2 border-t border-[var(--border)]/60 space-y-1.5">
                    <div className="text-[11px] font-semibold text-[var(--text-muted)]">
                      {t("subscriptionDesc")}
                    </div>
                    {workflows.length === 0 ? (
                      <div className="text-[11px] text-[var(--text-muted)] italic">
                        Standard access
                      </div>
                    ) : (
                      workflows.map(([wfSlug, meters]) => {
                        const meterObj = (meters as Record<string, number>) || {};
                        const runs = meterObj.runs;
                        return (
                          <div
                            key={wfSlug}
                            className="flex items-center gap-2 text-xs text-[var(--text)]"
                          >
                            <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                            <span>
                              <strong className="capitalize">{wfSlug.replace("-", " ")}</strong>:{" "}
                              {runs !== undefined ? `${runs} scans` : "Unlimited"}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-[var(--border)]/50">
                  <button
                    type="button"
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={isPending || isCurrent}
                    className={`w-full flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-xs font-bold focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:outline-hidden transition-all shadow-sm ${
                      isCurrent
                        ? "bg-[var(--surface)] text-[var(--text-muted)] cursor-not-allowed border border-[var(--border)]"
                        : "bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90 active:scale-[0.98]"
                    }`}
                  >
                    {isThisPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>{t("subscribing")}</span>
                      </>
                    ) : isCurrent ? (
                      <span>{t("currentPlanBadge")}</span>
                    ) : (
                      <>
                        <Zap className="h-3.5 w-3.5" />
                        <span>{t("subscribeMockCta")}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
