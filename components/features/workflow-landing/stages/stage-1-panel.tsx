"use client";

import React from "react";
import { useTranslations } from "next-intl";
import type { PresetData } from "../types";

interface Stage1PanelProps {
  data: PresetData;
}

export function Stage1Panel({ data }: Stage1PanelProps) {
  const t = useTranslations("workflowLanding");

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="font-mono text-xs text-[var(--accent)] uppercase tracking-wider">
            {t("s1Subtitle")}
          </span>
          <h3 className="text-xl font-bold text-[var(--text)] mt-1">
            {t("s1Title")}
          </h3>
        </div>
        <span className="font-mono text-xs px-3 py-1 rounded-md bg-[var(--bg)] border hairline-border text-emerald-400">
          {t("s1Badge")}
        </span>
      </div>

      {/* Highlighted Post Content Box with Scanline */}
      <div className="relative rounded-xl bg-[var(--bg)] p-6 sm:p-8 border hairline-border overflow-hidden">
        <div className="xray-scanline" />
        <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-xs text-[var(--text-muted)] pb-4 mb-5 border-b hairline-border">
          <span>{data.authorMeta}</span>
          <span className="text-[var(--accent)] truncate">{data.expandedUrl}</span>
        </div>
        <div
          className="text-[var(--text-muted)] text-sm sm:text-base leading-relaxed whitespace-pre-line"
          dangerouslySetInnerHTML={{ __html: data.postHtml }}
        />
      </div>

      {/* 3 Clean Extracted Signal Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg bg-[var(--bg)] border hairline-border">
          <div className="font-mono text-xs text-[var(--text-muted)] mb-1">
            {t("s1EntityCheck")}
          </div>
          <div className="font-mono font-semibold text-sm text-[var(--text)]">
            {data.entitySignal}
          </div>
        </div>
        <div className="p-4 rounded-lg bg-[var(--bg)] border hairline-border">
          <div className="font-mono text-xs text-[var(--text-muted)] mb-1">
            {t("s1FactualCheck")}
          </div>
          <div
            className={`font-mono font-semibold text-sm ${
              data.flagIsWarning ? "text-amber-400" : "text-emerald-400"
            }`}
          >
            {data.flagText}
          </div>
        </div>
        <div className="p-4 rounded-lg bg-[var(--bg)] border hairline-border">
          <div className="font-mono text-xs text-[var(--text-muted)] mb-1">
            {t("s1ExplicitEmail")}
          </div>
          <div className="font-mono font-semibold text-sm text-[var(--accent)] truncate">
            {data.email}
          </div>
        </div>
      </div>
    </div>
  );
}
