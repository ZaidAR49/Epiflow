"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Plan } from "@/types";
import type { PricingBillingMode } from "./types";

interface WorkflowPricingCardsProps {
  plans?: Plan[];
  slug?: string;
  billingMode: PricingBillingMode;
  currentPlanId?: string | null;
  onSelectPaidPlan: (plan: Plan) => void;
  tryWorkflowUrl: string;
  loadingPlanId?: string | null;
}

export function WorkflowPricingCards({
  plans = [],
  slug = "job-xray",
  billingMode,
  currentPlanId,
  onSelectPaidPlan,
  tryWorkflowUrl,
  loadingPlanId,
}: WorkflowPricingCardsProps) {
  const t = useTranslations("workflowLanding");
  const p = useTranslations("profile");

  // If plans provided from DB, render them ordered by price. Otherwise fallback to empty.
  const activePlans = plans.filter((plan) => plan.isActive);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-stretch text-start min-w-0">
      {activePlans.map((plan) => {
        const isFree = plan.priceMinor === 0 || plan.code === "free";
        const isPro = plan.code === "pro";
        const isBusiness = plan.code === "business";
        const isCurrent = currentPlanId === plan.id;
        const isLoading = loadingPlanId === plan.id;

        // Entitlement quota
        const entitlements = (plan.entitlements || {}) as Record<
          string,
          Record<string, number | null>
        >;
        const wfEntitlements =
          entitlements[slug] || entitlements["job-xray"] || {};
        const runs =
          wfEntitlements.runs ?? (isFree ? 5 : isPro ? 100 : 200);

        // Price formatting per billing mode
        let displayPrice: string;
        let displayUnit: string;
        let displaySub: string;

        if (isFree) {
          displayPrice = "$0";
          displayUnit = t("plan1Unit");
          displaySub = t("plan1Desc");
        } else {
          const baseMinor = plan.priceMinor;
          if (billingMode === "monthly") {
            displayPrice = `$${(baseMinor / 100).toFixed(
              baseMinor % 100 === 0 ? 0 : 2
            )}`;
            displayUnit = t("plan2UnitMonthly");
            displaySub =
              plan.trialDays > 0
                ? t("planTrialText", { days: plan.trialDays })
                : isBusiness
                ? t("plan3DescMonthly")
                : t("plan2DescMonthly");
          } else if (billingMode === "yearly") {
            const annualMonthly = Math.round((baseMinor * 0.8) / 100);
            displayPrice = `$${annualMonthly}`;
            displayUnit = t("plan2UnitYearly");
            const annualTotal = Math.round((baseMinor * 0.8 * 12) / 100);
            displaySub = t("planDescYearlyBilled", { total: `$${annualTotal}` });
          } else {
            const paygPrice = Math.round((baseMinor * 1.2) / 100);
            displayPrice = `$${paygPrice}`;
            displayUnit = t("plan2UnitPayg");
            displaySub = t("plan2DescPayg");
          }
        }

        // Plan Name, Tag and Badge
        const planName = isFree
          ? t("plan1Name")
          : isPro
          ? t("plan2Name")
          : isBusiness
          ? t("plan3Name")
          : plan.name;

        const planTag = isFree
          ? t("plan1Tag")
          : isBusiness
          ? t("plan3Tag")
          : null;

        const planBadge = isPro ? t("plan2Badge") : null;

        // Features list
        const features = isFree
          ? [t("plan1F2"), t("plan1F3"), t("plan1F4"), t("plan1F5")]
          : isPro
          ? [t("plan2F2"), t("plan2F3"), t("plan2F4"), t("plan2F5"), t("plan2F6")]
          : isBusiness
          ? [t("plan3F1"), t("plan3F2"), t("plan3F3"), t("plan3F4"), t("plan3F5")]
          : [t("plan1F2"), t("plan2F3"), t("plan2F4"), t("plan2F5")];

        // CTA text
        const ctaText = isPro
          ? billingMode === "yearly"
            ? t("plan2CtaYearly")
            : billingMode === "payg"
            ? t("plan2CtaPayg")
            : t("plan2CtaMonthly")
          : isBusiness
          ? billingMode === "yearly"
            ? t("plan3CtaYearly")
            : billingMode === "payg"
            ? t("plan3CtaPayg")
            : t("plan3CtaMonthly")
          : p("subscribeCta");

        return (
          <div
            key={plan.id}
            className={`p-5 sm:p-8 lg:p-10 rounded-xl flex flex-col justify-between relative transition-all min-w-0 ${
              isPro
                ? "bg-[var(--surface-2)] border-2 border-[var(--accent)] shadow-[0_0_45px_rgba(99,102,241,0.22)]"
                : "surface-card"
            }`}
          >
            <div>
              {/* Header */}
              <div className="flex items-center justify-between font-mono text-xs mb-4">
                <span
                  className={
                    isPro
                      ? "text-[var(--accent)] font-semibold"
                      : "text-[var(--text-muted)] font-medium"
                  }
                >
                  {planName}
                </span>
                {planBadge ? (
                  <span className="px-2.5 py-0.5 rounded bg-[var(--accent)] text-white font-semibold text-[11px]">
                    {planBadge}
                  </span>
                ) : planTag ? (
                  <span
                    className={
                      isBusiness
                        ? "text-emerald-400 font-mono text-[11px]"
                        : "text-[var(--text-muted)]"
                    }
                  >
                    {planTag}
                  </span>
                ) : null}
              </div>

              {/* Price display */}
              <div className="flex items-baseline gap-2 mb-2">
                <span className="font-heading font-extrabold text-4xl sm:text-5xl text-[var(--text)] tabular">
                  {displayPrice}
                </span>
                <span className="text-[var(--text-muted)] text-sm">{displayUnit}</span>
              </div>
              <p
                className={`text-xs mb-8 pb-8 border-b hairline-border ${
                  isPro
                    ? "text-emerald-400 font-mono"
                    : "text-[var(--text-muted)]"
                }`}
              >
                {displaySub}
              </p>

              {/* Entitlement Quota & Features */}
              <ul className="space-y-3 sm:space-y-4 text-sm text-[var(--text-muted)] mb-6 sm:mb-10">
                <li className="flex items-center gap-3">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isPro
                        ? "bg-[var(--accent)]"
                        : isBusiness
                        ? "bg-emerald-400"
                        : "bg-[var(--text-muted)]"
                    }`}
                  />
                  <span>
                    <strong>{t("planScansPerMonth", { count: runs })}</strong>
                  </span>
                </li>

                {features.map((feat, idx) => {
                  const isHighlight =
                    (isPro && idx === features.length - 1) ||
                    (isFree && idx === features.length - 1);
                  return (
                    <li key={idx} className="flex items-center gap-3">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isHighlight
                            ? isPro
                              ? "bg-emerald-400"
                              : "bg-amber-400"
                            : isPro
                            ? "bg-[var(--accent)]"
                            : isBusiness
                            ? "bg-emerald-400"
                            : "bg-[var(--text-muted)]"
                        }`}
                      />
                      <span className={isPro ? "text-[var(--text)]" : undefined}>
                        {isHighlight && isPro ? <strong>{feat}</strong> : feat}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Action CTA */}
            {isCurrent ? (
              <button
                type="button"
                disabled
                className="w-full py-3.5 rounded-lg bg-[var(--surface-2)] text-[var(--text-muted)] font-medium text-sm border hairline-border cursor-not-allowed flex items-center justify-center gap-2"
              >
                <span>{p("currentPlanBadge")}</span>
              </button>
            ) : isFree ? (
              <Link
                href={tryWorkflowUrl}
                className="w-full py-3.5 rounded-lg surface-raised hover:bg-[var(--surface-2)]/90 text-[var(--text)] font-medium text-sm border hairline-border transition-all flex items-center justify-center gap-2"
              >
                <span>{t("plan1Cta")}</span>
                <ArrowRight className="w-4 h-4 rtl:-scale-x-100" />
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => onSelectPaidPlan(plan)}
                disabled={isLoading}
                className={`w-full py-3.5 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                  isPro
                    ? "bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white shadow-[0_0_24px_rgba(99,102,241,0.4)]"
                    : "surface-raised hover:bg-[var(--accent)] hover:text-white text-[var(--text)] border hairline-border"
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{p("subscribing")}</span>
                  </>
                ) : (
                  <>
                    <span>{ctaText}</span>
                    <ArrowRight className="w-4 h-4 rtl:-scale-x-100" />
                  </>
                )}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
