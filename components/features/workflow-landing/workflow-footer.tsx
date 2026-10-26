"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { EpiFlowLogo } from "@/components/ui/epiflow-logo";
import { Shield } from "lucide-react";

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
    <footer className="border-t border-[var(--border)] py-14 bg-[var(--surface)]/95 text-[var(--text-muted)] text-xs transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Top Row: Workflow Brand & Navigation Links */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-8 border-b border-[var(--border)]">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Link
              href={`/${locale}`}
              className="flex items-center gap-2.5 text-[var(--text)] hover:text-[var(--accent)] transition-colors"
              title={tCommon("platformName")}
            >
              <EpiFlowLogo variant="icon" height={26} glow={false} />
              <span className="font-extrabold text-sm">{tCommon("platformName")}</span>
            </Link>

            <span className="text-[var(--border)] select-none">/</span>

            <div className="flex items-center gap-2">
              {imageUrl ? (
                <div className="relative w-6 h-6 rounded-md bg-[var(--accent)]/15 border border-[var(--accent)]/40 flex items-center justify-center overflow-hidden shrink-0">
                  <Image
                    src={imageUrl}
                    alt={workflowName}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ) : null}
              <span className="font-heading font-bold text-sm text-[var(--text)]">
                {workflowName}
              </span>
            </div>

            <span className="text-[10px] text-[var(--accent)] font-semibold rounded bg-[var(--accent)]/10 px-1.5 py-0.5 border border-[var(--accent)]/20">
              {tCommon("flagship")}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium">
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
            <span className="text-[var(--border)] hidden lg:inline">&bull;</span>
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

        {/* Workflow-Specific Legal & Trademark Notice Box */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/60 p-4 sm:p-5 flex items-start gap-3.5 shadow-xs">
          <div className="p-2 rounded-lg bg-[var(--accent)]/15 text-[var(--accent)] shrink-0 mt-0.5">
            <Shield className="h-4 w-4" />
          </div>
          <div className="space-y-1 text-xs">
            <h4 className="font-bold text-[var(--text)] flex items-center gap-2">
              <span>{tCommon("legalNoticeTitle")}</span>
            </h4>
            <p className="text-[var(--text-muted)] leading-relaxed">
              {t("footerDisclaimer")}
            </p>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[var(--text-muted)]/80 pt-2">
          <p>
            {tCommon("platformName")} &copy; {new Date().getFullYear()}. {tCommon("allRightsReserved")}
          </p>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-emerald-400 font-semibold">{tCommon("systemsOperational")}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
