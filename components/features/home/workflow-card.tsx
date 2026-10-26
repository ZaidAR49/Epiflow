import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { ArrowRight, CheckCircle2, Clock, Sparkles } from "lucide-react";
import type { WorkflowSummary } from "@/lib/db/queries/workflows";

interface WorkflowCardProps {
  workflow: WorkflowSummary;
  isFlagship?: boolean;
  isSubscribed?: boolean;
}

export function WorkflowCard({
  workflow,
  isFlagship = false,
  isSubscribed = false,
}: WorkflowCardProps) {
  const t = useTranslations("landing");
  const locale = useLocale();

  // Map known workflow slug to static localized descriptions
  const getWorkflowDetails = (slug: string) => {
    switch (slug) {
      case "job-xray":
        return {
          category: t("workflows.jobXray.category"),
          description: t("workflows.jobXray.description"),
          tags: [
            t("workflows.jobXray.tag1"),
            t("workflows.jobXray.tag2"),
            t("workflows.jobXray.tag3"),
            t("workflows.jobXray.tag4"),
          ],
        };
      default:
        return {
          category: "Automated Intelligence",
          description: "Specialized multi-stage automation workflow running on the EpiFlow runtime.",
          tags: ["Automated Pipeline", "AI Powered", "Real-Time"],
        };
    }
  };

  const details = getWorkflowDetails(workflow.slug);

  return (
    <div
      className={`group relative flex flex-col justify-between rounded-2xl border bg-[var(--surface)] p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
        isSubscribed
          ? "border-sky-500/50 shadow-lg shadow-sky-500/15 hover:border-sky-400"
          : isFlagship
          ? "border-sky-500/40 shadow-lg shadow-sky-500/10 hover:border-sky-400"
          : "border-[var(--border)] hover:border-[var(--accent)]/50"
      }`}
    >
      {/* Top Banner: Status & Flagship/Subscription Badges */}
      <div>
        <div className="flex items-center justify-between gap-2 flex-wrap mb-4">
          <div className="flex items-center gap-1.5">
            {workflow.isActive ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="h-3 w-3" />
                <span>{t("statusActive")}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-400 border border-amber-500/20">
                <Clock className="h-3 w-3" />
                <span>{t("statusComingSoon")}</span>
              </span>
            )}
          </div>

          {isSubscribed ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/15 px-2.5 py-0.5 text-[11px] font-bold text-sky-400 border border-sky-500/30 shadow-[0_0_8px_rgba(56,189,248,0.25)]">
              <Sparkles className="h-3 w-3 text-sky-300" />
              <span>{t("badgeSubscribed")}</span>
            </span>
          ) : isFlagship ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-teal-500/15 to-sky-500/15 px-2.5 py-0.5 text-[11px] font-bold text-sky-400 border border-sky-500/30">
              <Sparkles className="h-3 w-3 text-teal-400" />
              <span>{t("badgeFlagship")}</span>
            </span>
          ) : null}
        </div>

        {/* Workflow Title & Category */}
        <div className="flex items-start gap-3.5">
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[var(--surface-2)] border border-[var(--border)] shadow-inner">
            {workflow.imageUrl ? (
              <Image
                src={workflow.imageUrl}
                alt={workflow.name}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <span className="font-heading font-extrabold text-sm text-[var(--accent)]">
                {workflow.slug.slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <span className="block text-xs font-semibold text-sky-400 uppercase tracking-wider">
              {details.category}
            </span>
            <h3 className="text-xl font-bold text-[var(--text)] tracking-tight truncate mt-0.5">
              {workflow.name}
            </h3>
            <span className="font-mono text-[11px] text-[var(--text-muted)] block mt-0.5">
              slug: {workflow.slug}
            </span>
          </div>
        </div>

        {/* Workflow Rich Description */}
        <p className="mt-4 text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
          {details.description}
        </p>

        {/* Capability Tags */}
        <div className="mt-5 flex flex-wrap gap-1.5">
          {details.tags.map((tag, idx) => (
            <span
              key={idx}
              className="inline-block rounded-md bg-[var(--surface-2)] px-2 py-0.5 text-[11px] font-medium text-[var(--text)] border border-[var(--border)]/60"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Call to Action Bar */}
      <div className="mt-6 pt-5 border-t border-[var(--border)] flex items-center justify-between gap-3">
        <Link
          href={`/${locale}/workflows/${workflow.slug}`}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow hover:bg-[var(--accent)]/90 transition-colors"
        >
          <span>{t("seeLandingPage")}</span>
          <ArrowRight className="h-4 w-4 rtl:-scale-x-100" />
        </Link>
      </div>
    </div>
  );
}
