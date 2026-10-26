"use client";

import React from "react";
import { useTranslations } from "next-intl";
import type { PresetData } from "../types";

interface Stage3PanelProps {
  data: PresetData;
}

export function Stage3Panel({ data }: Stage3PanelProps) {
  const t = useTranslations("workflowLanding");

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="font-mono text-xs text-[var(--accent)] uppercase tracking-wider">
            {t("s3Subtitle")}
          </span>
          <h3 className="text-xl font-bold text-[var(--text)] mt-1">
            {t("s3Title")}
          </h3>
        </div>
        <span className="font-mono text-xs px-3 py-1 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          {t("s3Badge")}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-stretch min-w-0">
        {/* Recruiter Profile Card */}
        <div className="lg:col-span-7 p-4 sm:p-6 lg:p-8 rounded-xl bg-[var(--bg)] border hairline-border flex flex-col justify-between min-w-0">
          <div className="flex items-start gap-3 sm:gap-4 min-w-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-[var(--accent)]/15 border border-[var(--accent)]/40 font-mono font-bold text-base sm:text-lg text-[var(--accent)] flex items-center justify-center shrink-0">
              {data.recruiterInitials}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-lg sm:text-xl font-bold text-[var(--text)] break-words">
                {data.recruiterName}
              </h4>
              <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1 break-words">
                {data.recruiterHeadline}
              </p>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed mt-5 sm:mt-6 pt-4 sm:pt-6 border-t hairline-border break-words">
            {data.recruiterBio}
          </p>
        </div>

        {/* Company Telemetry Metrics */}
        <div className="lg:col-span-5 grid grid-cols-2 gap-3 sm:gap-4 font-mono min-w-0">
          <div className="p-4 sm:p-5 rounded-xl bg-[var(--bg)] border hairline-border flex flex-col justify-between min-w-0">
            <span className="text-[11px] sm:text-xs text-[var(--text-muted)] truncate">{t("s3ExpLabel")}</span>
            <div className="text-xl sm:text-2xl font-bold text-[var(--text)] mt-2 tabular">
              {data.tenure}
            </div>
            <span className="text-[11px] sm:text-xs text-emerald-400 mt-1 truncate">{t("s3ExpSub")}</span>
          </div>
          <div className="p-4 sm:p-5 rounded-xl bg-[var(--bg)] border hairline-border flex flex-col justify-between min-w-0">
            <span className="text-[11px] sm:text-xs text-[var(--text-muted)] truncate">{t("s3SizeLabel")}</span>
            <div className="text-lg sm:text-xl font-bold text-emerald-400 mt-2 tabular">
              {data.companySize}
            </div>
            <span className="text-[11px] sm:text-xs text-[var(--text-muted)] mt-1 truncate">{t("s3Employees")}</span>
          </div>
          <div className="p-4 sm:p-5 rounded-xl bg-[var(--bg)] border hairline-border col-span-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-0">
            <div className="min-w-0">
              <span className="text-[11px] sm:text-xs text-[var(--text-muted)] block">
                {t("s3PresenceLabel")}
              </span>
              <span className="text-xs sm:text-sm font-semibold text-[var(--text)] mt-1 block break-words">
                {data.locations}
              </span>
            </div>
            <span className="px-2.5 py-1 rounded bg-[var(--accent)]/15 text-[var(--accent)] text-xs self-start sm:self-auto shrink-0">
              {t("s3Deduplicated")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
