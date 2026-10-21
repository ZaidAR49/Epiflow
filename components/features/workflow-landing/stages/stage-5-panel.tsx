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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="font-mono text-xs text-emerald-400 uppercase tracking-wider">
            {t("s5Subtitle")}
          </span>
          <h3 className="text-xl font-bold text-[var(--text)] mt-1">
            {t("s5Title")}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg bg-[var(--bg)] p-1 border hairline-border font-mono text-xs">
            <button
              type="button"
              onClick={() => onSetCommLang("en")}
              className={`px-3 py-1 rounded transition-colors ${
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
              className={`px-3 py-1 rounded transition-colors ${
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
            className="px-4 py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/40 font-mono text-xs font-semibold text-emerald-400 hover:bg-emerald-500 hover:text-[var(--bg)] transition-all"
          >
            {t("s5CopyChannelBtn")}
          </button>
        </div>
      </div>

      {/* Formatted Community Post Preview Box */}
      <div
        dir={commLang === "ar" ? "rtl" : "ltr"}
        className="rounded-xl bg-[var(--bg)] border hairline-border p-6 sm:p-8 font-sans text-sm space-y-4"
      >
        <div className="flex items-center justify-between pb-3 border-b hairline-border">
          <span className="font-heading font-bold text-base sm:text-lg text-[var(--text)]">
            {langData.title}
          </span>
          <span className="font-mono text-xs text-[var(--accent)]">
            {t("s5VerifiedFormat")}
          </span>
        </div>
        <div className="font-mono text-xs text-[var(--text-muted)]">
          {langData.meta}
        </div>
        <div className="text-[var(--text-muted)] leading-relaxed">
          <strong className="text-[var(--text)] block mb-1">
            {commLang === "ar" ? "ملخص الفرصة:" : t("s5OppSummary")}
          </strong>
          {langData.summary}
        </div>
        <div className="pt-3 border-t hairline-border flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
          <span className="text-emerald-400 font-semibold">
            {langData.apply}
          </span>
          <button
            type="button"
            onClick={onOpenCuratorModal}
            className="text-[var(--accent)] hover:underline"
          >
            {t("s5OpenCuratorLink")}
          </button>
        </div>
      </div>
    </div>
  );
}
