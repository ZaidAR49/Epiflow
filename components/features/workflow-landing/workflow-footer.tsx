"use client";

import React from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";

interface WorkflowFooterProps {
  workflowName?: string;
  imageUrl?: string | null;
}

export function WorkflowFooter({
  workflowName = "JobPost X-Ray",
  imageUrl,
}: WorkflowFooterProps = {}) {
  const t = useTranslations("workflowLanding");

  return (
    <footer className="border-t hairline-border py-12 bg-[var(--bg)] text-[var(--text-muted)] text-xs">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="relative w-7 h-7 rounded-md bg-[var(--accent)]/15 border border-[var(--accent)]/40 flex items-center justify-center overflow-hidden shrink-0">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={workflowName}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <span className="font-mono font-semibold text-[11px] text-[var(--accent)]">
                XR
              </span>
            )}
          </div>
          <span className="font-heading font-bold text-sm text-[var(--text)]">
            {workflowName}
          </span>
          <span className="text-[var(--text-muted)]">{t("footerCopyright")}</span>
        </div>

        <div className="flex flex-wrap gap-6">
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
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 mt-8 pt-8 border-t hairline-border text-[11px] text-[var(--text-muted)]/70 text-start">
        {t("footerDisclaimer")}
      </div>
    </footer>
  );
}
