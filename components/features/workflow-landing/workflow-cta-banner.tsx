"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";

interface WorkflowCtaBannerProps {
  tryWorkflowUrl?: string;
}

export function WorkflowCtaBanner({ tryWorkflowUrl = "#pricing" }: WorkflowCtaBannerProps = {}) {
  const t = useTranslations("workflowLanding");

  return (
    <section className="py-12 sm:py-20 lg:py-28 min-w-0">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="surface-card rounded-2xl p-6 sm:p-12 lg:p-16 text-center relative overflow-hidden min-w-0">
          <div className="absolute inset-0 hero-ambient pointer-events-none" />
          <div className="relative z-10 max-w-2xl mx-auto min-w-0">
            <span className="font-mono text-xs uppercase tracking-widest text-[var(--accent)]">
              {t("ctaEyebrow")}
            </span>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-[var(--text)] mt-3 mb-4 sm:mb-5 break-words">
              {t("ctaTitle")}
            </h2>
            <p className="text-[var(--text-muted)] text-sm sm:text-base leading-relaxed mb-6 sm:mb-10 break-words">
              {t("ctaSubtitle")}
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 w-full sm:w-auto">
              <Link
                href={tryWorkflowUrl}
                className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-medium text-sm shadow-[0_0_28px_rgba(99,102,241,0.4)] transition-all flex items-center justify-center gap-2"
              >
                <span>{t("heroStartFree")}</span>
                <ArrowRight className="w-4 h-4 rtl:-scale-x-100" />
              </Link>
              <a
                href="#workbenchAnchor"
                className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-lg surface-raised hover:bg-[var(--surface)] text-[var(--text)] font-medium text-sm transition-all text-center"
              >
                {t("ctaTestDemo")}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
