"use client";

import React from "react";
import { useTranslations } from "next-intl";
import type { PresetData } from "../types";

interface Stage5PanelProps {
  data: PresetData;
  commLang: "en" | "ar";
  onSetCommLang: (lang: "en" | "ar") => void;
  onCopyCommunityPost: () => void;
  onOpenCuratorModal: () => void;
}

export function Stage5Panel({
  data,
  commLang,
  onSetCommLang,
  onCopyCommunityPost,
  onOpenCuratorModal,
}: Stage5PanelProps) {
  const t = useTranslations("workflowLanding");
  const langData = commLang === "ar" ? data.commAr : data.commEn;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4 min-w-0">
        <div>
          <span className="font-mono text-xs text-emerald-400 uppercase tracking-wider">
            {t("s5Subtitle")}
          </span>
          <h3 className="text-lg sm:text-xl font-bold text-[var(--text)] mt-1 break-words">
            {t("s5Title")}
          </h3>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg bg-[var(--bg)] p-1 border hairline-border font-mono text-xs">
            <button
              type="button"
              onClick={() => onSetCommLang("en")}
              className={`px-2.5 sm:px-3 py-1 rounded transition-colors ${
                commLang === "en"
                  ? "bg-[var(--accent)] text-white font-semibold"
                  : "text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
            >
              {t("s5LangEn")}
            </button>
            <button
              type="button"
              onClick={() => onSetCommLang("ar")}
              className={`px-2.5 sm:px-3 py-1 rounded transition-colors ${
                commLang === "ar"
                  ? "bg-[var(--accent)] text-white font-semibold"
                  : "text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
            >
              {t("s5LangAr")}
            </button>
          </div>
          <button
            type="button"
            onClick={onCopyCommunityPost}
            className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/40 font-mono text-xs font-semibold text-emerald-400 hover:bg-emerald-500 hover:text-[var(--bg)] transition-all shrink-0"
          >
            {t("s5CopyChannelBtn")}
          </button>
        </div>
      </div>

      {/* Formatted Community Post Preview Box */}
      <div
        dir={commLang === "ar" ? "rtl" : "ltr"}
        className="rounded-xl bg-[var(--bg)] border hairline-border p-4 sm:p-6 lg:p-8 font-sans text-xs sm:text-sm space-y-3 sm:space-y-4 min-w-0"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b hairline-border min-w-0">
          <span className="font-heading font-bold text-sm sm:text-base lg:text-lg text-[var(--text)] break-words">
            {langData.title}
          </span>
          <span className="font-mono text-[11px] sm:text-xs text-[var(--accent)] shrink-0">
            {t("s5VerifiedFormat")}
          </span>
        </div>
        <div className="font-mono text-[11px] sm:text-xs text-[var(--text-muted)] break-words">
          {langData.meta}
        </div>
        <div className="text-[var(--text-muted)] leading-relaxed break-words">
          <strong className="text-[var(--text)] block mb-1">
            {t("s5OppSummary")}
          </strong>
          {langData.summary}
        </div>
        <div className="pt-3 border-t hairline-border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 font-mono text-xs min-w-0">
          <span className="text-emerald-400 font-semibold break-words">
            {langData.apply}
          </span>
          <button
            type="button"
            onClick={onOpenCuratorModal}
            className="text-[var(--accent)] hover:underline self-start sm:self-auto shrink-0"
          >
            {t("s5OpenCuratorLink")}
          </button>
        </div>
      </div>
    </div>
  );
}
