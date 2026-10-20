"use client";

import React from "react";
import { useTranslations, useLocale } from "next-intl";
import { Activity, Clock, Zap, Infinity as InfinityIcon } from "lucide-react";

interface WorkflowQuotaCardProps {
  usageCount: number;
  usageLimit: number | null;
  expiresAt: Date | null;
}

export function WorkflowQuotaCard({
  usageCount,
  usageLimit,
  expiresAt,
}: WorkflowQuotaCardProps) {
  const t = useTranslations("profile");
  const locale = useLocale();

  const isUnlimited = usageLimit === null;
  const percentage = isUnlimited
    ? 0
    : Math.min(100, Math.round((usageCount / (usageLimit || 1)) * 100));

  const formattedExpiry = expiresAt
    ? new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(expiresAt))
    : t("neverExpires");

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm space-y-5">
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20">
            <Zap className="h-5 w-5" />
          </div>
          <h3 className="text-base font-bold text-[var(--text)]">{t("quotaSection")}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-4">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-2">
            <span>{t("scansUsed")}</span>
            <Activity className="h-4 w-4 text-[var(--accent)]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-[var(--text)]">{usageCount}</span>
            <span className="text-xs text-[var(--text-muted)]">
              / {isUnlimited ? t("unlimited") : usageLimit}
            </span>
          </div>

          {!isUnlimited && (
            <div className="mt-3">
              <div className="h-1.5 w-full rounded-full bg-[var(--border)] overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    percentage >= 90
                      ? "bg-rose-500"
                      : percentage >= 75
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="mt-1 block text-end text-[10px] text-[var(--text-muted)]">
                {percentage}%
              </span>
            </div>
          )}
        </div>

        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-2">
            <span>{t("expiresAt")}</span>
            <Clock className="h-4 w-4 text-[var(--text-muted)]" />
          </div>
          <div className="flex items-center gap-2 mt-auto">
            {isUnlimited ? (
              <div className="flex items-center gap-1.5 text-sm font-semibold text-emerald-400">
                <InfinityIcon className="h-4 w-4" />
                <span>{formattedExpiry}</span>
              </div>
            ) : (
              <span className="text-sm font-semibold text-[var(--text)]">{formattedExpiry}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
