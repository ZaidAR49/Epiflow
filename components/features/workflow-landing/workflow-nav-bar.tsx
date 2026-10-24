"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Menu, X } from "lucide-react";
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
  const tCommon = useTranslations("common");

  return (
    <header className="sticky top-0 z-40 bg-[var(--surface)]/85 backdrop-blur-md border-b border-[var(--border)] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand & Breadcrumb Architecture (Apify / Vercel style) */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <Link
            href={`/${locale}`}
            className="group/brand flex items-center gap-2.5 shrink-0 transition-opacity hover:opacity-95 focus:outline-hidden"
            title={`${tCommon("platformName")} — ${tCommon("home")}`}
          >
            <EpiFlowLogo variant="icon" height={34} glow />
            <span className="text-base font-extrabold tracking-tight text-[var(--text)] group-hover/brand:text-white transition-colors">
              {tCommon("platformName")}
            </span>
          </Link>

          <span
            className="text-[var(--border)] text-sm font-light select-none shrink-0"
            aria-hidden="true"
          >
            /
          </span>

          <a
            href="#top"
            className="group/wf flex items-center gap-2 min-w-0 rounded-lg px-2 py-1 transition-colors hover:bg-[var(--surface-2)]"
            title={workflowName}
          >
            {imageUrl && (
              <div className="relative flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-md border border-[var(--border)] bg-[var(--surface-2)] shadow-xs transition-transform duration-200 group-hover/wf:scale-105 group-hover/wf:border-[var(--accent)]/50">
                <Image
                  src={imageUrl}
                  alt={workflowName}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            )}
            <span className="text-xs sm:text-sm font-semibold text-[var(--text)] truncate transition-colors group-hover/wf:text-[var(--accent)]">
              {workflowName}
            </span>
          </a>
        </div>

        {/* Clean Anchor Links */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2 text-xs font-semibold text-[var(--text-muted)]">
          <a
            href="#audiences"
            className="rounded-lg px-2.5 py-1.5 hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
          >
            {t("navUseCases")}
          </a>
          <a
            href="#features"
            className="rounded-lg px-2.5 py-1.5 hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
          >
            {t("navCapabilities")}
          </a>
          <a
            href="#workflow"
            className="rounded-lg px-2.5 py-1.5 hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
          >
            {t("navWorkflow")}
          </a>
          <a
            href="#comparison"
            className="rounded-lg px-2.5 py-1.5 hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
          >
            {t("navComparison")}
          </a>
          <a
            href="#pricing"
            className="rounded-lg px-2.5 py-1.5 hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
          >
            {t("navPricing")}
          </a>
          <a
            href="#faq"
            className="rounded-lg px-2.5 py-1.5 hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
          >
            {t("navFaq")}
          </a>
        </nav>

        {/* Primary CTA, Language Switcher & Mobile Toggle */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <LocaleSwitcher />

          {hasAccess || isAuthenticated ? (
            <Link
              href={`/${locale}/workflows/${slug}/console`}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5"
            >
              <span>{t("navOpenConsole")}</span>
              <ArrowRight className="w-3.5 h-3.5 rtl:-scale-x-100" />
            </Link>
          ) : (
            <Link
              href={`/${locale}/sign-in?callbackUrl=/${locale}/workflows/${slug}/console`}
              className="px-3.5 py-1.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5"
            >
              <span>{t("navStartFree")}</span>
              <ArrowRight className="w-3.5 h-3.5 rtl:-scale-x-100" />
            </Link>
          )}

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={t("navMenu")}
            className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/80 text-[var(--text)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-[var(--border)] bg-[var(--surface)] px-6 py-5 space-y-3 text-sm font-medium text-[var(--text-muted)] text-start animate-in fade-in duration-150">
          <a
            href="#audiences"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block py-1.5 hover:text-[var(--text)] transition-colors"
          >
            {t("navUseCases")}
          </a>
          <a
            href="#features"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block py-1.5 hover:text-[var(--text)] transition-colors"
          >
            {t("navCapabilities")}
          </a>
          <a
            href="#workflow"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block py-1.5 hover:text-[var(--text)] transition-colors"
          >
            {t("navWorkflow")}
          </a>
          <a
            href="#comparison"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block py-1.5 hover:text-[var(--text)] transition-colors"
          >
            {t("navComparison")}
          </a>
          <a
            href="#pricing"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block py-1.5 hover:text-[var(--text)] transition-colors"
          >
            {t("navPricing")}
          </a>
          <a
            href="#faq"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block py-1.5 hover:text-[var(--text)] transition-colors"
          >
            {t("navFaq")}
          </a>

          <div className="pt-3 border-t border-[var(--border)]">
            {hasAccess || isAuthenticated ? (
              <Link
                href={`/${locale}/workflows/${slug}/console`}
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-xs"
              >
                <span>{t("navOpenConsole")}</span>
                <ArrowRight className="w-3.5 h-3.5 rtl:-scale-x-100" />
              </Link>
            ) : (
              <Link
                href={`/${locale}/sign-in?callbackUrl=/${locale}/workflows/${slug}/console`}
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full py-2.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-xs"
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
