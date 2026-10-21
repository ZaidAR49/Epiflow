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
    <section className="py-24 lg:py-32">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <div className="surface-card rounded-2xl p-10 sm:p-16 lg:p-20 text-center relative overflow-hidden">
          <div className="absolute inset-0 hero-ambient pointer-events-none" />
          <div className="relative z-10 max-w-2xl mx-auto">
            <span className="font-mono text-xs uppercase tracking-widest text-[var(--accent)]">
              {t("ctaEyebrow")}
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-[var(--text)] mt-3 mb-5">
              {t("ctaTitle")}
            </h2>
            <p className="text-[var(--text-muted)] text-base sm:text-lg leading-relaxed mb-10">
              {t("ctaSubtitle")}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href={tryWorkflowUrl}
                className="w-full sm:w-auto px-8 py-4 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-medium text-sm shadow-[0_0_28px_rgba(99,102,241,0.4)] transition-all flex items-center justify-center gap-2"
              >
                <span>{t("heroStartFree")}</span>
                <ArrowRight className="w-4 h-4 rtl:-scale-x-100" />
              </Link>
              <a
                href="#workbenchAnchor"
                className="w-full sm:w-auto px-8 py-4 rounded-lg surface-raised hover:bg-[var(--surface)] text-[var(--text)] font-medium text-sm transition-all"
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
