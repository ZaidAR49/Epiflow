"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { EpiFlowLogo } from "@/components/ui/epiflow-logo";

interface WorkflowFooterProps {
  workflowName?: string;
  imageUrl?: string | null;
}

export function WorkflowFooter({
  workflowName = "JobPost X-Ray",
  imageUrl,
}: WorkflowFooterProps = {}) {
  const t = useTranslations("workflowLanding");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  return (
    <footer className="border-t hairline-border py-12 bg-[var(--bg)] text-[var(--text-muted)] text-xs">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          {imageUrl ? (
            <div className="relative w-7 h-7 rounded-md bg-[var(--accent)]/15 border border-[var(--accent)]/40 flex items-center justify-center overflow-hidden shrink-0">
              <Image
                src={imageUrl}
                alt={workflowName}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          ) : (
            <EpiFlowLogo variant="icon" height={28} glow={false} />
          )}
          <span className="font-heading font-bold text-sm text-[var(--text)]">
            {workflowName}
          </span>
          <span className="text-[10px] text-[var(--accent)]">by EpiFlow</span>
          <span className="text-[var(--text-muted)]">{t("footerCopyright")}</span>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <a href="#audiences" className="hover:text-[var(--text)] transition-colors">
            {t("navUseCases")}
          </a>
          <a href="#features" className="hover:text-[var(--text)] transition-colors">
            {t("navCapabilities")}
          </a>
          <a href="#workflow" className="hover:text-[var(--text)] transition-colors">
            {t("navWorkflow")}
          </a>
          <a href="#comparison" className="hover:text-[var(--text)] transition-colors">
            {t("navComparison")}
          </a>
          <a href="#pricing" className="hover:text-[var(--text)] transition-colors">
            {t("navPricing")}
          </a>
          <a href="#faq" className="hover:text-[var(--text)] transition-colors">
            {t("navFaq")}
          </a>
          <span className="text-[var(--border)] hidden md:inline">•</span>
          <Link
            href={`/${locale}/contact`}
            className="hover:text-[var(--text)] transition-colors"
          >
            {tCommon("contactUs")}
          </Link>
          <Link
            href={`/${locale}/privacy`}
            className="hover:text-[var(--text)] transition-colors"
          >
            {tCommon("privacyPolicy")}
          </Link>
          <Link
            href={`/${locale}/terms`}
            className="hover:text-[var(--text)] transition-colors"
          >
            {tCommon("termsOfService")}
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 mt-8 pt-8 border-t hairline-border text-[11px] text-[var(--text-muted)]/70 text-start">
        {t("footerDisclaimer")}
      </div>
    </footer>
  );
}
