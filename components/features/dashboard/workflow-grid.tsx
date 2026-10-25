"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  ArrowRight,
  ExternalLink,
  Workflow as WorkflowIcon,
  Clock,
  Zap,
} from "lucide-react";
import type { DashboardWorkflowItem } from "@/lib/db/queries/dashboard";

interface WorkflowGridProps {
  workflows: DashboardWorkflowItem[];
  locale: string;
}

export function WorkflowGrid({ workflows, locale }: WorkflowGridProps) {
  const t = useTranslations("dashboard");

  if (workflows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)]/50 p-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 mb-4">
          <WorkflowIcon className="h-7 w-7" />
        </div>
        <h3 className="text-lg font-bold text-[var(--text)]">
          {t("noWorkflowsYet")}
        </h3>
        <p className="mt-1 max-w-md text-sm text-[var(--text-muted)]">
          {t("subtitle")}
        </p>
        <Link
          href={`/${locale}#pricing`}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          <span>{t("exploreWorkflows")}</span>
          <ArrowRight className="h-4 w-4 rtl:-scale-x-100" />
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {workflows.map((workflow) => {
        const usageLimit = workflow.usageLimit;
        const usageCount = workflow.usageCount;
        const hasLimit = usageLimit !== null && usageLimit > 0;
        const percent = hasLimit
          ? Math.min(100, Math.round((usageCount / usageLimit) * 100))
          : 0;

        const meterColor =
          percent >= 90
            ? "bg-rose-500"
            : percent >= 70
            ? "bg-amber-500"
            : "bg-[var(--accent)]";

        return (
          <div
            key={workflow.id}
            className="group relative flex flex-col justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm transition-all hover:border-[var(--accent)]/40 hover:shadow-lg"
          >
            {/* Top row: Avatar & Identity */}
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-2)]">
                    {workflow.imageUrl ? (
                      <Image
                        src={workflow.imageUrl}
                        alt={workflow.name}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    ) : (
                      <WorkflowIcon className="h-6 w-6 text-[var(--accent)]" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-bold text-[var(--text)] group-hover:text-[var(--accent)] transition-colors">
                      {workflow.name}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className="inline-flex items-center gap-1 rounded-md bg-[var(--surface-2)] px-2 py-0.5 text-[11px] font-medium text-[var(--text-muted)] border border-[var(--border)]">
                        {workflow.planName || t("freeTier")}
                      </span>
                      {workflow.isActive ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-400 border border-emerald-500/20">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                          {t("completed")}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <Link
                  href={`/${locale}/workflows/${workflow.slug}`}
                  title={t("viewLanding")}
                  className="shrink-0 p-1.5 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors rounded-lg hover:bg-[var(--surface-2)]"
                >
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </div>

              {/* Usage & Metric section */}
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/60 p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-[var(--text-muted)]">
                    {t("scansUsed")}
                  </span>
                  <span className="font-bold text-[var(--text)]">
                    {usageCount}
                    <span className="text-[var(--text-muted)] font-normal ms-1">
                      / {hasLimit ? usageLimit : t("unlimited")}
                    </span>
                  </span>
                </div>

                {hasLimit && (
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface)]">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${meterColor}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                )}

                <div className="flex items-center justify-between pt-1 text-[11px] text-[var(--text-muted)] border-t border-[var(--border)]/50">
                  <span className="flex items-center gap-1">
                    <Zap className="h-3 w-3 text-amber-400" />
                    {t("runs7Days", { count: workflow.recentRunCount })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {workflow.lastUsedAt
                      ? new Intl.DateTimeFormat(locale, {
                          month: "short",
                          day: "numeric",
                        }).format(workflow.lastUsedAt)
                      : t("never")}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-5 pt-3 border-t border-[var(--border)]/60 flex items-center justify-between gap-2">
              <Link
                href={`/${locale}/workflows/${workflow.slug}/console`}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:opacity-95 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              >
                <span>{t("openConsole")}</span>
                <ArrowRight className="h-3.5 w-3.5 rtl:-scale-x-100" />
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
