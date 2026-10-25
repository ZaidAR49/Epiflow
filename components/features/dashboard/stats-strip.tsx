"use client";

import React from "react";
import { useTranslations } from "next-intl";
import {
  Workflow,
  Gauge,
  CreditCard,
  Sparkles,
  TrendingUp,
} from "lucide-react";

interface StatsStripProps {
  activeWorkflowCount: number;
  scansThisMonth: number;
  lowestRemaining: number | null;
  planName: string | null;
  planStatus: string | null;
  isSubscribed: boolean;
}

export function StatsStrip({
  activeWorkflowCount,
  scansThisMonth,
  lowestRemaining,
  planName,
  planStatus,
  isSubscribed,
}: StatsStripProps) {
  const t = useTranslations("dashboard");

  const stats = [
    {
      label: t("activeWorkflows"),
      value: activeWorkflowCount.toString(),
      icon: Workflow,
      accentClass: "text-[var(--accent)] bg-[var(--accent)]/10 border-[var(--accent)]/20",
    },
    {
      label: t("scansThisMonth"),
      value: scansThisMonth.toString(),
      icon: TrendingUp,
      accentClass: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      label: t("remainingQuota"),
      value: lowestRemaining === null ? t("unlimited") : lowestRemaining.toString(),
      icon: Gauge,
      accentClass: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    },
    {
      label: t("currentPlan"),
      value: planName || t("freeTier"),
      icon: isSubscribed ? Sparkles : CreditCard,
      accentClass: isSubscribed
        ? "text-sky-400 bg-sky-500/10 border-sky-500/20"
        : "text-[var(--text-muted)] bg-[var(--surface-2)] border-[var(--border)]",
      badge: planStatus === "trialing" ? t("trialing") : undefined,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="group relative flex flex-col gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm transition-all hover:border-[var(--accent)]/30 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-lg border ${stat.accentClass} transition-transform group-hover:scale-105`}
              >
                <Icon className="h-4.5 w-4.5" />
              </div>
              {stat.badge && (
                <span className="rounded-md bg-sky-500/15 px-2 py-0.5 text-[10px] font-bold text-sky-400 border border-sky-500/30">
                  {stat.badge}
                </span>
              )}
            </div>

            <div className="space-y-0.5">
              <p className="text-xl font-extrabold tracking-tight text-[var(--text)] leading-none">
                {stat.value}
              </p>
              <p className="text-xs font-medium text-[var(--text-muted)] leading-snug">
                {stat.label}
              </p>
            </div>

            {/* Subtle glow accent on hover */}
            <div
              className="pointer-events-none absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{
                background:
                  "radial-gradient(ellipse at 30% 20%, var(--accent) 0%, transparent 60%)",
                opacity: "0.03",
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
