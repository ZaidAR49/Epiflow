"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { LayoutDashboard } from "lucide-react";
import type { DashboardSummary } from "@/lib/db/queries/dashboard";
import { StatsStrip } from "./stats-strip";
import { WorkflowGrid } from "./workflow-grid";
import { ActivityFeed } from "./activity-feed";

interface DashboardHubProps {
  summary: DashboardSummary;
  locale: string;
}

export function DashboardHub({ summary, locale }: DashboardHubProps) {
  const t = useTranslations("dashboard");

  // Determine lowest remaining quota across workflows with limits
  const lowestRemaining = summary.workflows.reduce<number | null>(
    (min, workflow) => {
      if (workflow.usageLimit === null) return min;
      const remaining = Math.max(0, workflow.usageLimit - workflow.usageCount);
      return min === null ? remaining : Math.min(min, remaining);
    },
    null
  );

  const activeWorkflowCount = summary.workflows.filter((w) => w.isActive).length;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header bar */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20">
              <LayoutDashboard className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[var(--text)] sm:text-3xl">
              {t("title")}
            </h1>
          </div>
          <p className="mt-1.5 text-sm text-[var(--text-muted)]">
            {t("subtitle")}
          </p>
        </div>
      </div>

      {/* 1. Global Metrics Strip */}
      <StatsStrip
        activeWorkflowCount={activeWorkflowCount}
        scansThisMonth={summary.totalRunsThisMonth}
        lowestRemaining={lowestRemaining}
        planName={summary.subscription?.planName || null}
        planStatus={summary.subscription?.status || null}
        isSubscribed={Boolean(
          summary.subscription && summary.subscription.status === "active"
        )}
      />

      {/* 2. Subscribed Workflows */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[var(--text)]">
            {t("yourWorkflows")}
          </h2>
          <span className="rounded-md bg-[var(--surface-2)] px-2.5 py-0.5 text-xs font-semibold text-[var(--text-muted)] border border-[var(--border)]">
            {summary.workflows.length}
          </span>
        </div>
        <WorkflowGrid workflows={summary.workflows} locale={locale} />
      </section>

      {/* 3. Global Activity Feed */}
      <section className="space-y-4">
        <ActivityFeed runs={summary.recentRuns} locale={locale} />
      </section>
    </div>
  );
}
