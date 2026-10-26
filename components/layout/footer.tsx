"use client";

import React from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { EpiFlowLogo } from "@/components/ui/epiflow-logo";
import { Shield } from "lucide-react";

export function Footer() {
  const t = useTranslations("common");
  const locale = useLocale();

  return (
    <footer className="border-t border-[var(--border)] bg-[var(--surface)]/95 text-xs text-[var(--text-muted)] mt-auto transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
        {/* Top Grid: Brand & Structured Navigation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 sm:gap-10 lg:gap-8 pb-10 sm:pb-12 border-b border-[var(--border)]">
          {/* Brand & Mission Column (Spans 2 cols on lg) */}
          <div className="sm:col-span-2 lg:col-span-2 space-y-4">
            <Link
              href={`/${locale}`}
              className="group inline-flex items-center gap-2.5 focus:outline-hidden"
              title={t("platformName")}
            >
              <EpiFlowLogo variant="icon" height={32} glow />
              <div className="flex flex-col leading-tight">
                <span className="text-base font-extrabold tracking-tight text-[var(--text)] group-hover:text-white transition-colors">
                  {t("platformName")}
                </span>
                <span className="text-[10px] font-medium text-[var(--text-muted)]">
                  {t("tagline")}
                </span>
              </div>
            </Link>

            <p className="text-xs text-[var(--text-muted)] leading-relaxed max-w-sm">
              {t("platformDisclaimer")}
            </p>

            {/* Systems Operational Indicator */}
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-400">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span>{t("systemsOperational")}</span>
            </div>
          </div>

          {/* Column 2: Workflows */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text)]">
              {t("workflows")}
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  href={`/${locale}/workflows/job-xray`}
                  className="inline-flex items-center gap-1.5 text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors group"
                >
                  <span>JobPost X-Ray</span>
                  <span className="rounded bg-[var(--accent)]/15 px-1 py-0.2 text-[9px] font-bold text-[var(--accent)] border border-[var(--accent)]/30">
                    {t("flagship")}
                  </span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Platform */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text)]">
              {t("platformName")}
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  href={`/${locale}#workflows`}
                  className="hover:text-[var(--text)] transition-colors"
                >
                  {t("workflows")}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/contact`}
                  className="hover:text-[var(--text)] transition-colors"
                >
                  {t("contactUs")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Legal & Security */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text)]">
              {t("security")}
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  href={`/${locale}/privacy`}
                  className="hover:text-[var(--text)] transition-colors"
                >
                  {t("privacyPolicy")}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/terms`}
                  className="hover:text-[var(--text)] transition-colors"
                >
                  {t("termsOfService")}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/refund`}
                  className="hover:text-[var(--text)] transition-colors"
                >
                  {t("refundPolicy")}
                </Link>
              </li>
              <li>
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-400/90 pt-1">
                  <Shield className="h-3 w-3 shrink-0" />
                  <span>Google OAuth Verified</span>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 sm:pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[var(--text-muted)] text-center sm:text-start">
          <p>
            {t("platformName")} &copy; {new Date().getFullYear()}. {t("allRightsReserved")}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <Link
              href={`/${locale}/privacy`}
              className="hover:text-[var(--text)] transition-colors"
            >
              {t("privacy")}
            </Link>
            <span>&bull;</span>
            <Link
              href={`/${locale}/terms`}
              className="hover:text-[var(--text)] transition-colors"
            >
              {t("terms")}
            </Link>
            <span>&bull;</span>
            <Link
              href={`/${locale}/refund`}
              className="hover:text-[var(--text)] transition-colors"
            >
              {t("refund")}
            </Link>
            <span>&bull;</span>
            <Link
              href={`/${locale}/contact`}
              className="hover:text-[var(--text)] transition-colors"
            >
              {t("contact")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
