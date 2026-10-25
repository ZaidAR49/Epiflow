"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  Activity,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  ArrowUpRight,
  Workflow as WorkflowIcon,
} from "lucide-react";
import type { DashboardRunItem } from "@/lib/db/queries/dashboard";

interface ActivityFeedProps {
  runs: DashboardRunItem[];
  locale: string;
}

export function ActivityFeed({ runs, locale }: ActivityFeedProps) {
  const t = useTranslations("dashboard");

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-3 w-3 shrink-0" />
            <span>{t("completed")}</span>
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-semibold text-rose-400 border border-rose-500/20">
            <AlertCircle className="h-3 w-3 shrink-0" />
            <span>{t("failed")}</span>
          </span>
        );
      case "running":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/10 px-2.5 py-0.5 text-xs font-semibold text-sky-400 border border-sky-500/20">
            <Loader2 className="h-3 w-3 animate-spin shrink-0" />
            <span>{t("running")}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-400 border border-amber-500/20">
            <Clock className="h-3 w-3 shrink-0" />
            <span>{t("pending")}</span>
          </span>
        );
    }
  };

  const formatDate = (date: Date) => {
    try {
      return new Intl.DateTimeFormat(locale, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
    } catch {
      return "";
    }
  };

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20">
            <Activity className="h-4 w-4" />
          </div>
          <h3 className="text-base font-bold text-[var(--text)]">
            {t("recentActivity")}
          </h3>
          {runs.length > 0 && (
            <span className="rounded-md bg-[var(--surface-2)] px-2 py-0.5 text-xs font-bold text-[var(--text-muted)] border border-[var(--border)]">
              {runs.length}
            </span>
          )}
        </div>
      </div>

      {runs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center text-sm text-[var(--text-muted)]">
          <Activity className="h-8 w-8 mb-2 opacity-30" />
          <p>{t("noRecentActivity")}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-start text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]/60 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                <th className="py-2.5 ps-3 pe-4 text-start">{t("workflow")}</th>
                <th className="py-2.5 px-4 text-start">{t("status")}</th>
                <th className="py-2.5 px-4 text-start">{t("input")}</th>
                <th className="py-2.5 px-4 text-start">{t("time")}</th>
                <th className="py-2.5 ps-4 pe-3 text-end"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]/40 font-medium">
              {runs.map((run) => (
                <tr
                  key={run.id}
                  className="group hover:bg-[var(--surface-2)]/50 transition-colors"
                >
                  <td className="py-3 ps-3 pe-4">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface-2)]">
                        {run.workflowImageUrl ? (
                          <Image
                            src={run.workflowImageUrl}
                            alt={run.workflowName}
                            fill
                            className="object-cover"
                            sizes="28px"
                          />
                        ) : (
                          <WorkflowIcon className="h-3.5 w-3.5 text-[var(--accent)]" />
                        )}
                      </div>
                      <span className="truncate font-bold text-[var(--text)] group-hover:text-[var(--accent)] transition-colors">
                        {run.workflowName}
                      </span>
                    </div>
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap">
                    {getStatusBadge(run.status)}
                  </td>

                  <td className="py-3 px-4 text-xs text-[var(--text-muted)] max-w-xs truncate">
                    <span dir="ltr" className="inline-block truncate max-w-[240px]">
                      {run.inputPreview || "—"}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-xs text-[var(--text-muted)] whitespace-nowrap">
                    {formatDate(run.createdAt)}
                  </td>

                  <td className="py-3 ps-4 pe-3 text-end whitespace-nowrap">
                    <Link
                      href={`/${locale}/workflows/${run.workflowSlug}/console`}
                      className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-colors"
                    >
                      <span>{t("openConsole")}</span>
                      <ArrowUpRight className="h-3.5 w-3.5 rtl:-scale-x-100" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
