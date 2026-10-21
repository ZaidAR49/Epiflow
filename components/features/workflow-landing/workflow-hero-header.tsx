"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { useTranslations } from "next-intl";

interface WorkflowHeroHeaderProps {
  workflowName?: string;
  tryWorkflowUrl?: string;
}

export function WorkflowHeroHeader({
  workflowName = "JobPost X-Ray",
  tryWorkflowUrl = "#pricing",
}: WorkflowHeroHeaderProps) {
  const t = useTranslations("workflowLanding");

  return (
    <div className="max-w-3xl mx-auto text-center mb-16 lg:mb-20">
      {/* Monospace Status Pill */}
      <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full surface-card mb-8">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="font-mono text-xs uppercase tracking-widest text-[var(--text-muted)]">
          {workflowName} • {t("heroStatusPill")}
        </span>
      </div>

      {/* Safe, Honest Outcome-Focused Headline */}
      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[var(--text)] leading-[1.08] mb-6">
        {t("heroTitleStart")}
        <span className="text-[var(--accent)]">{t("heroTitleAccent")}</span>
      </h1>

      {/* Subheadline */}
      <p className="text-lg sm:text-xl text-[var(--text-muted)] leading-relaxed mb-10">
        {t("heroSubtitle")}
      </p>

      {/* Dual CTAs */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link
          href={tryWorkflowUrl}
          className="w-full sm:w-auto px-7 py-3.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-medium text-sm shadow-[0_0_28px_rgba(99,102,241,0.4)] transition-all flex items-center justify-center gap-2"
        >
          <span>{t("heroStartFree")}</span>
          <ArrowRight className="w-4 h-4 rtl:-scale-x-100" />
        </Link>
        <a
          href="#workbenchAnchor"
          className="w-full sm:w-auto px-7 py-3.5 rounded-lg surface-card hover:bg-[var(--surface-2)] text-[var(--text)] font-medium text-sm transition-all flex items-center justify-center gap-2"
        >
          <span>{t("heroExploreLive")}</span>
          <ArrowUpRight className="w-4 h-4 text-[var(--text-muted)] rtl:-scale-x-100" />
        </a>
      </div>
    </div>
  );
}
