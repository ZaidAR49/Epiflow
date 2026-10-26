"use client";

import React from "react";
import { useTranslations } from "next-intl";
import type { PresetData } from "../types";

interface StackedXrayViewProps {
  data: PresetData;
  onOpenGmailModal: () => void;
  onOpenCuratorModal: () => void;
}

export function StackedXrayView({
  data,
  onOpenGmailModal,
  onOpenCuratorModal,
}: StackedXrayViewProps) {
  const t = useTranslations("workflowLanding");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-xs text-[var(--accent)] uppercase tracking-wider">
          {t("stackedEyebrow")}
        </span>
        <span className="font-mono text-xs text-emerald-400">
          {t("stackedSynced")}
        </span>
      </div>

      {/* Layer 1 Offset Card */}
      <div className="p-4 sm:p-6 rounded-xl bg-[var(--bg)] border hairline-border transition-transform min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <span className="font-mono text-xs text-[var(--accent)] font-semibold">
            {t("stackedLayer1")}
          </span>
          <span
            className={`font-mono text-xs px-2.5 py-0.5 rounded ${
              data.flagIsWarning
                ? "bg-amber-500/15 text-amber-400"
                : "bg-emerald-500/15 text-emerald-400"
            }`}
          >
            {data.flagText}
          </span>
        </div>
        <div className="flex flex-wrap items-baseline justify-between gap-2 sm:gap-4 min-w-0">
          <h4 className="text-base sm:text-lg font-bold text-[var(--text)] break-words">
            {data.role}
          </h4>
          <span className="font-mono text-xs sm:text-sm font-semibold text-[var(--accent)] break-words">
            {data.metaLine}
          </span>
        </div>
      </div>

      {/* Layer 2 Offset Card (Indented on Desktop with logical ms-8) */}
      <div className="p-4 sm:p-6 rounded-xl bg-[var(--bg)] border hairline-border lg:ms-8 transition-transform min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <span className="font-mono text-xs text-[var(--accent)] font-semibold">
            {t("stackedLayer2")}
          </span>
          <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400">
            {t("s3Badge")}
          </span>
        </div>
        <div className="flex flex-wrap items-baseline justify-between gap-2 sm:gap-4 min-w-0">
          <h4 className="text-base sm:text-lg font-bold text-[var(--text)] break-words">
            {data.recruiterName}
          </h4>
          <span className="font-mono text-xs sm:text-sm text-[var(--text-muted)] tabular break-words">
            {data.companySize} {t("s3Employees")} • {data.locations}
          </span>
        </div>
      </div>

      {/* Layer 3 Offset Card (Indented Further with logical ms-16) */}
      <div className="p-4 sm:p-6 rounded-xl bg-[var(--bg)] border border-[var(--accent)]/50 lg:ms-16 shadow-[0_0_30px_rgba(99,102,241,0.15)] transition-transform min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3 sm:mb-4">
          <span className="font-mono text-xs text-[var(--accent)] font-semibold">
            {t("stackedLayer3")}
          </span>
          <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 truncate max-w-[200px] sm:max-w-none">
            {data.email}
          </span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 min-w-0">
          <span className="text-xs sm:text-sm text-[var(--text-muted)] break-words">
            {t("stackedLayer3Sub")}
          </span>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0 w-full sm:w-auto">
            <button
              type="button"
              onClick={onOpenCuratorModal}
              className="w-full sm:w-auto px-4 py-2 sm:py-2.5 rounded-lg surface-card hover:bg-[var(--surface-2)] text-[var(--text)] font-mono text-xs transition-all text-center"
            >
              {t("stackedChannelBtn")}
            </button>
            <button
              type="button"
              onClick={onOpenGmailModal}
              className="w-full sm:w-auto px-5 py-2 sm:py-2.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-medium text-xs sm:text-sm transition-all text-center"
            >
              {t("stackedGmailBtn")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
