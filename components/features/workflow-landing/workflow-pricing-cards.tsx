"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import type { PricingBillingMode } from "./types";

interface WorkflowPricingCardsProps {
  billingMode: PricingBillingMode;
  onSelectPaidPlan: (planName: string) => void;
  tryWorkflowUrl: string;
}

export function WorkflowPricingCards({
  billingMode,
  onSelectPaidPlan,
  tryWorkflowUrl,
}: WorkflowPricingCardsProps) {
  const t = useTranslations("workflowLanding");

  const proPrice = billingMode === "monthly" ? t("plan2PriceMonthly") : billingMode === "yearly" ? t("plan2PriceYearly") : t("plan2PricePayg");
  const proUnit = billingMode === "payg" ? t("plan2UnitPayg") : billingMode === "yearly" ? t("plan2UnitYearly") : t("plan2UnitMonthly");
  const proSub =
    billingMode === "monthly"
      ? t("plan2DescMonthly")
      : billingMode === "yearly"
      ? t("plan2DescYearly")
      : t("plan2DescPayg");
  const proCta =
    billingMode === "monthly"
      ? t("plan2CtaMonthly")
      : billingMode === "yearly"
      ? t("plan2CtaYearly")
      : t("plan2CtaPayg");
  const proQuota = billingMode === "payg" ? t("plan2QuotaPayg") : t("plan2QuotaMonthly");

  const powerPrice = billingMode === "monthly" ? t("plan3PriceMonthly") : billingMode === "yearly" ? t("plan3PriceYearly") : t("plan3PricePayg");
  const powerUnit = billingMode === "payg" ? t("plan3UnitPayg") : billingMode === "yearly" ? t("plan3UnitYearly") : t("plan3UnitMonthly");
  const powerSub =
    billingMode === "monthly"
      ? t("plan3DescMonthly")
      : billingMode === "yearly"
      ? t("plan3DescYearly")
      : t("plan3DescPayg");
  const powerCta =
    billingMode === "monthly"
      ? t("plan3CtaMonthly")
      : billingMode === "yearly"
      ? t("plan3CtaYearly")
      : t("plan3CtaPayg");
  const powerQuota = billingMode === "payg" ? t("plan3QuotaPayg") : t("plan3QuotaMonthly");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch text-start">
      {/* Plan 1: Free Starter */}
      <div className="p-8 sm:p-10 rounded-xl surface-card flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between font-mono text-xs text-[var(--text-muted)] mb-4">
            <span>{t("plan1Name")}</span>
            <span>{t("plan1Tag")}</span>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="font-heading font-extrabold text-4xl sm:text-5xl text-[var(--text)] tabular">
              {t("plan1Price")}
            </span>
            <span className="text-[var(--text-muted)] text-sm">{t("plan1Unit")}</span>
          </div>
          <p className="text-xs text-[var(--text-muted)] mb-8 pb-8 border-b hairline-border">
            {t("plan1Desc")}
          </p>

          <ul className="space-y-4 text-sm text-[var(--text-muted)] mb-10">
            <li className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)]" />
              <span>{t("plan1F1")}</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)]" />
              <span>{t("plan1F2")}</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)]" />
              <span>{t("plan1F3")}</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)]" />
              <span>{t("plan1F4")}</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>{t("plan1F5")}</span>
            </li>
          </ul>
        </div>

        <Link
          href={tryWorkflowUrl}
          className="w-full py-3.5 rounded-lg surface-raised hover:bg-[var(--surface-2)]/90 text-[var(--text)] font-medium text-sm border hairline-border transition-all flex items-center justify-center gap-2"
        >
          <span>{t("plan1Cta")}</span>
          <ArrowRight className="w-4 h-4 rtl:-scale-x-100" />
        </Link>
      </div>

      {/* Plan 2: Job Seeker Pro */}
      <div className="p-8 sm:p-10 rounded-xl bg-[var(--surface-2)] border-2 border-[var(--accent)] shadow-[0_0_45px_rgba(99,102,241,0.22)] flex flex-col justify-between relative">
        <div>
          <div className="flex items-center justify-between font-mono text-xs mb-4">
            <span className="text-[var(--accent)] font-semibold">{t("plan2Name")}</span>
            <span className="px-2.5 py-0.5 rounded bg-[var(--accent)] text-white font-semibold text-[11px]">
              {t("plan2Badge")}
            </span>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="font-heading font-extrabold text-4xl sm:text-5xl text-[var(--text)] tabular">
              {proPrice}
            </span>
            <span className="text-[var(--text-muted)] text-sm">{proUnit}</span>
          </div>
          <p className="text-xs text-emerald-400 font-mono mb-8 pb-8 border-b hairline-border">
            {proSub}
          </p>

          <ul className="space-y-4 text-sm text-[var(--text)] mb-10">
            <li className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
              <span><strong>{proQuota}</strong></span>
            </li>
            <li className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
              <span>{t("plan2F2")}</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
              <span>{t("plan2F3")}</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
              <span>{t("plan2F4")}</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
              <span>{t("plan2F5")}</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span><strong>{t("plan2F6")}</strong></span>
            </li>
          </ul>
        </div>

        <button
          type="button"
          onClick={() => onSelectPaidPlan(t("plan2Name"))}
          className="w-full py-3.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-medium text-sm shadow-[0_0_24px_rgba(99,102,241,0.4)] transition-all flex items-center justify-center gap-2"
        >
          <span>{proCta}</span>
          <span className="px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 font-mono text-[10px] uppercase font-semibold">
            {t("comingSoonBadge")}
          </span>
          <ArrowRight className="w-4 h-4 rtl:-scale-x-100" />
        </button>
      </div>

      {/* Plan 3: Community & Curator */}
      <div className="p-8 sm:p-10 rounded-xl surface-card flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between font-mono text-xs text-[var(--text-muted)] mb-4">
            <span>{t("plan3Name")}</span>
            <span className="text-emerald-400">{t("plan3Tag")}</span>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="font-heading font-extrabold text-4xl sm:text-5xl text-[var(--text)] tabular">
              {powerPrice}
            </span>
            <span className="text-[var(--text-muted)] text-sm">{powerUnit}</span>
          </div>
          <p className="text-xs text-[var(--text-muted)] font-mono mb-8 pb-8 border-b hairline-border">
            {powerSub}
          </p>

          <ul className="space-y-4 text-sm text-[var(--text-muted)] mb-10">
            <li className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span><strong>{powerQuota}</strong></span>
            </li>
            <li className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>{t("plan3F2")}</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>{t("plan3F3")}</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>{t("plan3F4")}</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>{t("plan3F5")}</span>
            </li>
          </ul>
        </div>

        <button
          type="button"
          onClick={() => onSelectPaidPlan(t("plan3Name"))}
          className="w-full py-3.5 rounded-lg surface-raised hover:bg-[var(--accent)] hover:text-white text-[var(--text)] font-medium text-sm border hairline-border transition-all flex items-center justify-center gap-2"
        >
          <span>{powerCta}</span>
          <span className="px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 font-mono text-[10px] uppercase font-semibold">
            {t("comingSoonBadge")}
          </span>
          <ArrowRight className="w-4 h-4 rtl:-scale-x-100" />
        </button>
      </div>
    </div>
  );
}
