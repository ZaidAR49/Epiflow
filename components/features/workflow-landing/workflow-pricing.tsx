"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { Check, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";

interface WorkflowPricingProps {
  slug: string;
  hasAccess?: boolean;
}

export function WorkflowPricing({ slug, hasAccess }: WorkflowPricingProps) {
  const t = useTranslations("workflowLanding");
  const locale = useLocale();

  const [isYearly, setIsYearly] = useState(false);

  const plans = [
    {
      id: "starter",
      title: t("planStarterTitle"),
      desc: t("planStarterDesc"),
      price: t("planStarterPrice"),
      period: t("perMonth"),
      isPopular: false,
      ctaText: t("planStarterCta"),
      ctaHref: `/${locale}/sign-in?callbackUrl=/${locale}/dashboard`,
      features: [
        t("planStarterFeat1"),
        t("planStarterFeat2"),
        t("planStarterFeat3"),
        t("planStarterFeat4"),
      ],
    },
    {
      id: "pro",
      title: t("planProTitle"),
      desc: t("planProDesc"),
      price: isYearly ? t("planProPriceYearly") : t("planProPriceMonthly"),
      period: t("perMonth"),
      billedNote: isYearly ? t("billedAnnually") : null,
      isPopular: true,
      ctaText: t("planProCta"),
      ctaHref: hasAccess
        ? `/${locale}/workflows/${slug}/console`
        : `/${locale}/sign-in?callbackUrl=/${locale}/dashboard&plan=pro`,
      features: [
        t("planProFeat1"),
        t("planProFeat2"),
        t("planProFeat3"),
        t("planProFeat4"),
        t("planProFeat5"),
        t("planProFeat6"),
      ],
    },
    {
      id: "power",
      title: t("planPowerTitle"),
      desc: t("planPowerDesc"),
      price: isYearly ? t("planPowerPriceYearly") : t("planPowerPriceMonthly"),
      period: t("perMonth"),
      billedNote: isYearly ? t("billedAnnually") : null,
      isPopular: false,
      ctaText: t("planPowerCta"),
      ctaHref: hasAccess
        ? `/${locale}/workflows/${slug}/console`
        : `/${locale}/sign-in?callbackUrl=/${locale}/dashboard&plan=power`,
      features: [
        t("planPowerFeat1"),
        t("planPowerFeat2"),
        t("planPowerFeat3"),
        t("planPowerFeat4"),
        t("planPowerFeat5"),
        t("planPowerFeat6"),
      ],
    },
  ];

  return (
    <section id="pricing" className="py-20 border-b border-[var(--border)] relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs font-semibold text-[var(--accent)] mb-3">
            <Sparkles className="h-3.5 w-3.5" />
            <span>{t("navPricing")}</span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-[var(--text)] sm:text-4xl">
            {t("pricingTitle")}
          </h2>
          <p className="mt-4 text-sm sm:text-base text-[var(--text-muted)] leading-relaxed">
            {t("pricingSubtitle")}
          </p>

          {/* Monthly / Yearly Billing Toggle */}
          <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-[var(--border)] bg-[var(--surface-2)]/80 p-1.5 shadow-sm">
            <button
              type="button"
              onClick={() => setIsYearly(false)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                !isYearly
                  ? "bg-[var(--accent)] text-white shadow"
                  : "text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
            >
              {t("billingMonthly")}
            </button>
            <button
              type="button"
              onClick={() => setIsYearly(true)}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                isYearly
                  ? "bg-[var(--accent)] text-white shadow"
                  : "text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
            >
              <span>{t("billingYearly")}</span>
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                {t("savePercent")}
              </span>
            </button>
          </div>
        </div>

        {/* 3 Pricing Tier Cards */}
        <div className="mt-14 grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl p-7 flex flex-col justify-between transition-all duration-200 text-start ${
                plan.isPopular
                  ? "border-2 border-[var(--accent)] bg-[var(--surface)] shadow-2xl shadow-[var(--accent)]/15 scale-[1.02] z-10"
                  : "border border-[var(--border)] bg-[var(--surface)] shadow-sm hover:border-[var(--accent)]/30 hover:bg-[var(--surface-2)]/40"
              }`}
            >
              {plan.isPopular && (
                <div className="absolute -top-3.5 start-1/2 -translate-x-1/2 rtl:translate-x-1/2">
                  <span className="rounded-full bg-[var(--accent)] px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white shadow-md">
                    {t("mostPopular")}
                  </span>
                </div>
              )}

              <div>
                <h3 className="text-lg font-bold text-[var(--text)]">
                  {plan.title}
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed min-h-[40px]">
                  {plan.desc}
                </p>

                {/* Price Display */}
                <div className="mt-6 flex items-baseline gap-1" dir="ltr">
                  <span className="text-4xl font-extrabold tracking-tight text-[var(--text)]">
                    {plan.price}
                  </span>
                  <span className="text-xs font-medium text-[var(--text-muted)]">
                    {plan.period}
                  </span>
                </div>
                {plan.billedNote && (
                  <div className="mt-1 text-[11px] font-medium text-emerald-400">
                    {plan.billedNote}
                  </div>
                )}

                {/* Features List */}
                <ul className="mt-8 space-y-3 border-t border-[var(--border)] pt-6">
                  {plan.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-[var(--text)]">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mt-0.5">
                        <Check className="h-3 w-3" />
                      </div>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Call to Action Button */}
              <div className="mt-8 pt-6 border-t border-[var(--border)]">
                <Link
                  href={plan.ctaHref}
                  className={`inline-flex w-full items-center justify-center gap-2 rounded-xl py-3 text-xs sm:text-sm font-semibold transition-all ${
                    plan.isPopular
                      ? "bg-[var(--accent)] text-white shadow-md shadow-[var(--accent)]/20 hover:bg-[var(--accent)]/90 hover:scale-[1.01]"
                      : "border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] hover:bg-[var(--surface-2)]/80 hover:border-[var(--accent)]/40"
                  }`}
                >
                  <span>{plan.ctaText}</span>
                  <ArrowRight className="h-4 w-4 rtl:-scale-x-100" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Money back / reassurance */}
        <div className="mt-12 text-center flex items-center justify-center gap-2 text-xs text-[var(--text-muted)]">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span>{t("moneyBackGuarantee")}</span>
        </div>
      </div>
    </section>
  );
}
