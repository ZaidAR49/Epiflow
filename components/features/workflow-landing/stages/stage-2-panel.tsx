"use client";

import React from "react";
import { useTranslations } from "next-intl";
import type { PresetData } from "../types";

interface Stage2PanelProps {
  data: PresetData;
}

export function Stage2Panel({ data }: Stage2PanelProps) {
  const t = useTranslations("workflowLanding");

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="font-mono text-xs text-[var(--accent)] uppercase tracking-wider">
            {t("s2Subtitle")}
          </span>
          <h3 className="text-xl font-bold text-[var(--text)] mt-1">
            {t("s2Title")}
          </h3>
        </div>
        <span
          className={`font-mono text-xs px-3 py-1 rounded-md border ${
            data.flagIsWarning
              ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
              : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
          }`}
        >
          {data.flagText}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 min-w-0">
        {/* Card 1: Role & Meta */}
        <div className="p-4 sm:p-6 rounded-xl bg-[var(--bg)] border hairline-border flex flex-col justify-between min-w-0">
          <div>
            <span className="font-mono text-xs text-[var(--text-muted)] uppercase">
              {t("s2ScopeHeader")}
            </span>
            <h4 className="text-base sm:text-lg font-bold text-[var(--text)] mt-2 break-words">
              {data.role}
            </h4>
            <div className="font-mono text-xs text-[var(--accent)] mt-2 break-words">
              {data.metaLine}
            </div>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-5 sm:mt-6 pt-3 sm:pt-4 border-t hairline-border">
            {t("s2ScopeSub")}
          </p>
        </div>

        {/* Card 2: Key Responsibilities & Preferred Skills */}
        <div className="p-4 sm:p-6 rounded-xl bg-[var(--bg)] border hairline-border flex flex-col justify-between min-w-0">
          <div>
            <span className="font-mono text-xs text-[var(--text-muted)] uppercase">
              {t("s2ReqsHeader")}
            </span>
            <div className="mt-4 space-y-3 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-[var(--text)]">Core Architecture</span>
                <span className="text-[var(--accent)]">{t("s2Core")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text)]">Distributed Systems</span>
                <span className="text-[var(--accent)]">{t("s2Core")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text)]">Kafka / High Concurrency</span>
                <span className="text-[var(--text-muted)]">{t("s2Preferred")}</span>
              </div>
            </div>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-6 pt-4 border-t hairline-border">
            {t("s2ReqsSub")}
          </p>
        </div>

        {/* Card 3: Deterministic Cross-Checks */}
        <div className="p-6 rounded-xl bg-[var(--bg)] border hairline-border flex flex-col justify-between">
          <div>
            <span className="font-mono text-xs text-[var(--text-muted)] uppercase">
              {t("s2AuditHeader")}
            </span>
            <div className="mt-4 space-y-3 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">{t("s2EmailVsDomain")}</span>
                <span className={data.flagIsWarning ? "text-amber-400" : "text-emerald-400"}>
                  {data.domainCheck}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">{t("s2RoleVsIndustry")}</span>
                <span className="text-emerald-400">{data.industryCheck}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">{t("s2MissingFields")}</span>
                <span className="text-emerald-400">{data.missingCheck}</span>
              </div>
            </div>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-6 pt-4 border-t hairline-border">
            {t("s2AuditSub")}
          </p>
        </div>
      </div>
    </div>
  );
}
