"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { EpiFlowLogo } from "@/components/ui/epiflow-logo";

interface WorkflowNavBarProps {
  slug: string;
  workflowName?: string;
  imageUrl?: string | null;
  hasAccess?: boolean;
  isAuthenticated?: boolean;
}

export function WorkflowNavBar({
  slug,
  workflowName = "JobPost X-Ray",
  imageUrl,
  hasAccess = false,
  isAuthenticated = false,
}: WorkflowNavBarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const locale = useLocale();
  const t = useTranslations("workflowLanding");

  return (
    <header className="sticky top-0 z-40 bg-[var(--bg)]/85 backdrop-blur-md border-b hairline-border">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Identity */}
        <Link
          href={`/${locale}`}
          className="flex items-center gap-3 group focus:outline-none"
        >
          {imageUrl ? (
            <div className="relative w-9 h-9 rounded-lg bg-[var(--accent)]/15 border border-[var(--accent)]/40 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.3)] group-hover:border-[var(--accent)] transition-all overflow-hidden shrink-0">
              <Image
                src={imageUrl}
                alt={workflowName}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          ) : (
            <EpiFlowLogo variant="icon" height={36} glow />
          )}
          <div className="flex flex-col leading-tight">
            <span className="font-heading font-bold text-base text-[var(--text)] tracking-tight">
              {workflowName}
            </span>
            <span className="text-[10px] font-medium text-[var(--accent)]">
              by EpiFlow
            </span>
          </div>
        </Link>

        {/* Clean Anchor Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[var(--text-muted)]">
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
        </nav>

        {/* Primary CTA, Language Switcher & Mobile Toggle */}
        <div className="flex items-center gap-3">
          <LocaleSwitcher />

          {hasAccess || isAuthenticated ? (
            <Link
              href={`/${locale}/workflows/${slug}/console`}
              className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium shadow-[0_0_24px_rgba(16,185,129,0.35)] transition-all flex items-center gap-2"
            >
              <span>{t("navOpenConsole")}</span>
              <ArrowRight className="w-4 h-4 rtl:-scale-x-100" />
            </Link>
          ) : (
            <Link
              href={`/${locale}/sign-in?callbackUrl=/${locale}/workflows/${slug}/console`}
              className="px-5 py-2.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-medium shadow-[0_0_24px_rgba(99,102,241,0.35)] transition-all flex items-center gap-2"
            >
              <span>{t("navStartFree")}</span>
              <ArrowRight className="w-4 h-4 rtl:-scale-x-100" />
            </Link>
          )}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden px-3 py-2 rounded-lg surface-card text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text)]"
          >
            {t("navMenu")}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t hairline-border bg-[var(--surface)] px-6 py-5 space-y-3 text-sm font-medium text-[var(--text-muted)] text-start">
          <a
            href="#audiences"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block py-1.5 hover:text-[var(--text)]"
          >
            {t("navUseCases")}
          </a>
          <a
            href="#features"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block py-1.5 hover:text-[var(--text)]"
          >
            {t("navCapabilities")}
          </a>
          <a
            href="#workflow"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block py-1.5 hover:text-[var(--text)]"
          >
            {t("navWorkflow")}
          </a>
          <a
            href="#comparison"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block py-1.5 hover:text-[var(--text)]"
          >
            {t("navComparison")}
          </a>
          <a
            href="#pricing"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block py-1.5 hover:text-[var(--text)]"
          >
            {t("navPricing")}
          </a>
          <a
            href="#faq"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block py-1.5 hover:text-[var(--text)]"
          >
            {t("navFaq")}
          </a>

          <div className="pt-3 border-t hairline-border">
            {hasAccess || isAuthenticated ? (
              <Link
                href={`/${locale}/workflows/${slug}/console`}
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm"
              >
                <span>{t("navOpenConsole")}</span>
                <ArrowRight className="w-3.5 h-3.5 rtl:-scale-x-100" />
              </Link>
            ) : (
              <Link
                href={`/${locale}/sign-in?callbackUrl=/${locale}/workflows/${slug}/console`}
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full py-2.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm"
              >
                <span>{t("navStartFree")}</span>
                <ArrowRight className="w-3.5 h-3.5 rtl:-scale-x-100" />
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
