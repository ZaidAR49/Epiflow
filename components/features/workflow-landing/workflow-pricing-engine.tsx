"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import type { Plan } from "@/types";
import type { PricingBillingMode } from "./types";
import { WorkflowPricingCards } from "./workflow-pricing-cards";

interface WorkflowPricingEngineProps {
  plans?: Plan[];
  slug?: string;
  currentPlanId?: string | null;
  onSelectPaidPlan: (plan: Plan) => void;
  tryWorkflowUrl: string;
  loadingPlanId?: string | null;
}

export function WorkflowPricingEngine({
  plans = [],
  slug = "job-xray",
  currentPlanId,
  onSelectPaidPlan,
  tryWorkflowUrl,
  loadingPlanId,
}: WorkflowPricingEngineProps) {
  const t = useTranslations("workflowLanding");
  const [billingMode, setBillingMode] = useState<PricingBillingMode>("monthly");
  const [adPreviewMode, setAdPreviewMode] = useState<"free" | "pro">("pro");

  return (
    <section id="pricing" className="py-24 lg:py-32 border-b hairline-border bg-[var(--surface)]/30">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Heading & 3-Mode Billing Toggle */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <span className="font-mono text-xs uppercase tracking-widest text-[var(--accent)]">
            {t("priceEyebrow")}
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[var(--text)] mt-3 mb-5">
            {t("priceTitle")}
          </h2>
          <p className="text-[var(--text-muted)] text-lg mb-10">
            {t("priceSubtitle")}
          </p>

          {/* Interactive 3-Mode Billing Switcher */}
          <div className="inline-flex flex-wrap items-center justify-center p-1.5 rounded-xl surface-card gap-1">
            <button
              type="button"
              onClick={() => setBillingMode("monthly")}
              className={`px-4 py-2 rounded-lg text-xs font-mono font-semibold transition-all ${
                billingMode === "monthly"
                  ? "bg-[var(--accent)] text-white"
                  : "text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
            >
              {t("priceTabMonthly")}
            </button>
            <button
              type="button"
              onClick={() => setBillingMode("yearly")}
              className={`px-4 py-2 rounded-lg text-xs font-mono font-semibold flex items-center gap-2 transition-all ${
                billingMode === "yearly"
                  ? "bg-[var(--accent)] text-white"
                  : "text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
            >
              <span>{t("priceTabYearly")}</span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 text-[11px]">
                {t("priceTabYearlySave")}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setBillingMode("payg")}
              className={`px-4 py-2 rounded-lg text-xs font-mono font-semibold flex items-center gap-2 transition-all ${
                billingMode === "payg"
                  ? "bg-[var(--accent)] text-white"
                  : "text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
            >
              <span>{t("priceTabPayg")}</span>
              <span className="px-2 py-0.5 rounded bg-[var(--accent)]/15 text-[var(--accent)] text-[11px]">
                {t("priceTabPaygNoSub")}
              </span>
            </button>
          </div>
        </div>

        {/* 3 Spacious Pricing Cards Subcomponent */}
        <WorkflowPricingCards
          plans={plans}
          slug={slug}
          billingMode={billingMode}
          currentPlanId={currentPlanId}
          onSelectPaidPlan={onSelectPaidPlan}
          tryWorkflowUrl={tryWorkflowUrl}
          loadingPlanId={loadingPlanId}
        />

        {/* Transparency Preview: Free vs Pro Ad-Free Output */}
        <div className="max-w-4xl mx-auto mt-12 p-6 sm:p-8 rounded-xl surface-card text-start">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b hairline-border">
            <div>
              <span className="font-mono text-xs text-[var(--accent)] uppercase">
                {t("transEyebrow")}
              </span>
              <h4 className="font-heading font-bold text-base text-[var(--text)] mt-0.5">
                {t("transTitle")}
              </h4>
            </div>
            <div className="inline-flex rounded-lg bg-[var(--bg)] p-1 border hairline-border font-mono text-xs shrink-0">
              <button
                type="button"
                onClick={() => setAdPreviewMode("free")}
                className={`px-3 py-1.5 rounded transition-all ${
                  adPreviewMode === "free"
                    ? "bg-[var(--accent)] text-white font-semibold"
                    : "text-[var(--text-muted)] hover:text-[var(--text)]"
                }`}
              >
                {t("transFreeBtn")}
              </button>
              <button
                type="button"
                onClick={() => setAdPreviewMode("pro")}
                className={`px-3 py-1.5 rounded transition-all ${
                  adPreviewMode === "pro"
                    ? "bg-[var(--accent)] text-white font-semibold"
                    : "text-[var(--text-muted)] hover:text-[var(--text)]"
                }`}
              >
                {t("transProBtn")}
              </button>
            </div>
          </div>

          <div className="mt-5 p-4 rounded-lg bg-[var(--bg)] border hairline-border font-mono text-xs space-y-2">
            <div className="text-[var(--text-muted)]">
              {t("transReportEnd")}
            </div>
            <div
              className={`pt-2 border-t hairline-border ${
                adPreviewMode === "free" ? "text-amber-400" : "text-emerald-400"
              }`}
            >
              {adPreviewMode === "free"
                ? t("transFreeSample")
                : t("transProSample")}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
