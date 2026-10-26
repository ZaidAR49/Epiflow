"use client";

import React from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { ArrowLeft, Printer, Shield, FileText, ChevronRight } from "lucide-react";

interface LegalLayoutProps {
  badge: string;
  title: string;
  subtitle: string;
  tocItems: { id: string; label: string }[];
  children: React.ReactNode;
}

export function LegalLayout({
  badge,
  title,
  subtitle,
  tocItems,
  children,
}: LegalLayoutProps) {
  const tLegal = useTranslations("legalCommon");
  const locale = useLocale();

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Top Navigation & Breadcrumb */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-6">
          <Link
            href={`/${locale}`}
            className="group inline-flex items-center gap-2 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded-md px-2 py-1"
          >
            <ArrowLeft className="h-4 w-4 rtl:-scale-x-100 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
            <span>{tLegal("backToHome")}</span>
          </Link>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePrint}
              aria-label={tLegal("print")}
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>{tLegal("print")}</span>
            </button>
          </div>
        </div>

        {/* Hero Header */}
        <header className="mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-3.5 py-1 text-xs font-semibold tracking-wider text-[var(--accent)]">
            <Shield className="h-3.5 w-3.5" />
            <span>{badge}</span>
          </div>

          <h1 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight font-heading text-[var(--text)]">
            {title}
          </h1>

          <p className="mt-4 max-w-4xl text-base sm:text-lg text-[var(--text-muted)] leading-relaxed">
            {subtitle}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-4 text-xs font-medium text-[var(--text-muted)]">
            <span className="rounded-md bg-[var(--surface)] px-2.5 py-1 border border-[var(--border)]">
              {tLegal("lastUpdated")}
            </span>
            <span className="rounded-md bg-[var(--surface)] px-2.5 py-1 border border-[var(--border)]">
              {tLegal("effectiveDate")}
            </span>
          </div>
        </header>

        {/* Main Grid: Sticky Sidebar + Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Table of Contents (Desktop Sticky) */}
          <aside className="lg:col-span-4 lg:sticky lg:top-24 z-10 min-w-0">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-6 shadow-sm backdrop-blur">
              <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3 mb-4">
                <FileText className="h-4 w-4 text-[var(--accent)]" />
                <h2 className="text-sm font-bold text-[var(--text)] tracking-wide">
                  {tLegal("tableOfContents")}
                </h2>
              </div>

              <nav aria-label={tLegal("tableOfContents")} className="space-y-1">
                {tocItems.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="group flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                  >
                    <span className="truncate">{item.label}</span>
                    <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 rtl:-scale-x-100 transition-opacity text-[var(--accent)] shrink-0 ms-1" />
                  </a>
                ))}
              </nav>

              <div className="mt-6 pt-6 border-t border-[var(--border)] text-xs text-[var(--text-muted)]">
                <p className="mb-2 font-medium text-[var(--text)]">
                  {tLegal("contactTeam")}
                </p>
                <Link
                  href={`/${locale}/contact`}
                  className="text-[var(--accent)] hover:underline inline-flex items-center gap-1 font-semibold"
                >
                  {tLegal("contactLink")} &rarr;
                </Link>
              </div>
            </div>
          </aside>

          {/* Legal Document Content */}
          <section className="lg:col-span-8 space-y-10 min-w-0">
            {/* Disclaimer Callout Box */}
            <div className="rounded-2xl border border-[var(--accent)]/30 bg-[var(--accent)]/5 p-6 backdrop-blur">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-[var(--accent)] shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-[var(--text)] mb-1">
                    {tLegal("disclaimerBoxTitle")}
                  </h3>
                  <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
                    {tLegal("disclaimerBoxText")}
                  </p>
                </div>
              </div>
            </div>

            {/* Document Body */}
            <div className="space-y-12 text-sm leading-relaxed text-[var(--text)]/90">
              {children}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
