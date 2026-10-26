"use client";

import React from "react";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import type { PresetData } from "../types";

interface Stage4PanelProps {
  data: PresetData;
  onCopyEmail: () => void;
  onOpenGmailModal: () => void;
}

export function Stage4Panel({
  data,
  onCopyEmail,
  onOpenGmailModal,
}: Stage4PanelProps) {
  const t = useTranslations("workflowLanding");

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="font-mono text-xs text-[var(--accent)] uppercase tracking-wider">
            {t("s4Subtitle")}
          </span>
          <h3 className="text-xl font-bold text-[var(--text)] mt-1">
            {t("s4Title")}
          </h3>
        </div>
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <span className="font-mono text-xs text-[var(--text-muted)] shrink-0">
            {t("s4VerifiedEmail")}
          </span>
          <span className="font-mono text-xs font-semibold px-2.5 sm:px-3 py-1 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 truncate max-w-[220px] sm:max-w-none">
            {data.email}
          </span>
          <button
            type="button"
            onClick={onCopyEmail}
            className="px-2.5 py-1 rounded-md bg-[var(--bg)] border hairline-border font-mono text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors shrink-0"
          >
            {t("s4Copy")}
          </button>
        </div>
      </div>

      {/* Clean Gmail Draft Card */}
      <div className="rounded-xl bg-[var(--bg)] border hairline-border p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-5 min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 sm:pb-4 border-b hairline-border font-mono text-xs min-w-0">
          <div className="truncate min-w-0 max-w-full">
            <span className="text-[var(--text-muted)] me-1.5">{t("s4To")}</span>
            <span className="text-emerald-400 font-semibold">{data.draftTo}</span>
          </div>
          <span className="text-[var(--text-muted)] text-[11px] sm:text-xs">
            {t("s4OAuthInfo")}
          </span>
        </div>

        <div className="pb-3 sm:pb-4 border-b hairline-border font-mono text-xs sm:text-sm min-w-0">
          <span className="text-[var(--text-muted)] me-1.5">{t("s4Subject")}</span>
          <span className="text-[var(--text)] font-medium break-words">{data.draftSubject}</span>
        </div>

        <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed break-words">
          {data.draftBody}
        </p>

        <div className="pt-4 border-t hairline-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 min-w-0">
          <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg surface-card font-mono text-xs max-w-full min-w-0">
            <span className="w-2 h-2 rounded-full bg-[var(--accent)] shrink-0" />
            <span className="text-[var(--text)] truncate">Google_Drive_Resume_2026.pdf</span>
            <span className="text-[var(--text-muted)] shrink-0 text-[11px]">{t("s4AutoAttached")}</span>
          </div>

          <button
            type="button"
            onClick={onOpenGmailModal}
            className="w-full sm:w-auto px-6 py-2.5 sm:py-3 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-medium text-xs sm:text-sm shadow-[0_0_24px_rgba(99,102,241,0.35)] transition-all flex items-center justify-center gap-2 shrink-0"
          >
            <span>{t("s4PreviewBtn")}</span>
            <ArrowRight className="w-4 h-4 rtl:-scale-x-100" />
          </button>
        </div>
      </div>
    </div>
  );
}
