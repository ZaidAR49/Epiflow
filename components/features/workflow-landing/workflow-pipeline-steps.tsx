"use client";

import React from "react";
import { useTranslations } from "next-intl";

export function WorkflowPipelineSteps() {
  const t = useTranslations("workflowLanding");

  return (
    <section id="workflow" className="py-12 sm:py-20 lg:py-28 border-b hairline-border bg-[var(--surface)]/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-w-0">
        <div className="max-w-3xl mx-auto text-center mb-10 sm:mb-16 lg:mb-20 min-w-0">
          <span className="font-mono text-xs uppercase tracking-widest text-[var(--accent)]">
            {t("pipeEyebrow")}
          </span>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-[var(--text)] mt-3 mb-4 break-words">
            {t("pipeTitle")}
          </h2>
          <p className="text-[var(--text-muted)] text-sm sm:text-base lg:text-lg leading-relaxed">
            {t("pipeSubtitle")}
          </p>
        </div>

        {/* Animated Horizontal Connector SVG (Desktop) */}
        <div className="hidden lg:block max-w-5xl mx-auto mb-6">
          <svg className="w-full h-8" viewBox="0 0 1000 32" fill="none">
            <line
              x1="80"
              y1="16"
              x2="920"
              y2="16"
              stroke="rgba(148,163,184,0.18)"
              strokeWidth="1"
            />
            <line
              x1="80"
              y1="16"
              x2="920"
              y2="16"
              stroke="#6366F1"
              strokeWidth="2"
              className="pipeline-dash"
            />
            <circle cx="80" cy="16" r="5" fill="#6366F1" />
            <circle cx="500" cy="16" r="5" fill="#6366F1" />
            <circle cx="920" cy="16" r="5" fill="#10B981" />
          </svg>
        </div>

        {/* 3 Spacious Step Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 text-start min-w-0">
          {/* Step 1 */}
          <div className="p-6 sm:p-8 lg:p-10 rounded-xl surface-card flex flex-col justify-between min-w-0">
            <div>
              <div className="font-mono text-xs text-[var(--accent)] font-semibold uppercase tracking-wider mb-3 sm:mb-4">
                {t("pipe1Eyebrow")}
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-[var(--text)] mb-2.5 sm:mb-3 break-words">
                {t("pipe1Title")}
              </h3>
              <p className="text-[var(--text-muted)] text-xs sm:text-sm leading-relaxed mb-6 sm:mb-8">
                {t("pipe1Desc")}
              </p>
            </div>
            <div className="p-3 sm:p-3.5 rounded-lg bg-[var(--bg)] border hairline-border font-mono text-xs text-[var(--text-muted)] truncate" dir="ltr">
              {t("pipe1Badge")}
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-6 sm:p-8 lg:p-10 rounded-xl surface-card flex flex-col justify-between min-w-0">
            <div>
              <div className="font-mono text-xs text-[var(--accent)] font-semibold uppercase tracking-wider mb-3 sm:mb-4">
                {t("pipe2Eyebrow")}
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-[var(--text)] mb-2.5 sm:mb-3 break-words">
                {t("pipe2Title")}
              </h3>
              <p className="text-[var(--text-muted)] text-xs sm:text-sm leading-relaxed mb-6 sm:mb-8">
                {t("pipe2Desc")}
              </p>
            </div>
            <div className="p-3 sm:p-3.5 rounded-lg bg-[var(--bg)] border hairline-border font-mono text-xs text-[var(--accent)] truncate">
              {t("pipe2Badge")}
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-6 sm:p-8 lg:p-10 rounded-xl surface-card flex flex-col justify-between min-w-0">
            <div>
              <div className="font-mono text-xs text-emerald-400 font-semibold uppercase tracking-wider mb-3 sm:mb-4">
                {t("pipe3Eyebrow")}
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-[var(--text)] mb-2.5 sm:mb-3 break-words">
                {t("pipe3Title")}
              </h3>
              <p className="text-[var(--text-muted)] text-xs sm:text-sm leading-relaxed mb-6 sm:mb-8">
                {t("pipe3Desc")}
              </p>
            </div>
            <div className="p-3 sm:p-3.5 rounded-lg bg-[var(--bg)] border hairline-border font-mono text-xs text-emerald-400 truncate">
              {t("pipe3Badge")}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
