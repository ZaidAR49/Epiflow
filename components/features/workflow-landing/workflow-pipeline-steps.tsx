"use client";

import React from "react";
import { useTranslations } from "next-intl";

export function WorkflowPipelineSteps() {
  const t = useTranslations("workflowLanding");

  return (
    <section id="workflow" className="py-24 lg:py-32 border-b hairline-border bg-[var(--surface)]/40">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-16 lg:mb-20">
          <span className="font-mono text-xs uppercase tracking-widest text-[var(--accent)]">
            {t("pipeEyebrow")}
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[var(--text)] mt-3 mb-5">
            {t("pipeTitle")}
          </h2>
          <p className="text-[var(--text-muted)] text-lg">
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-start">
          {/* Step 1 */}
          <div className="p-8 sm:p-10 rounded-xl surface-card flex flex-col justify-between">
            <div>
              <div className="font-mono text-xs text-[var(--accent)] font-semibold uppercase tracking-wider mb-4">
                {t("pipe1Eyebrow")}
              </div>
              <h3 className="text-2xl font-bold text-[var(--text)] mb-3">
                {t("pipe1Title")}
              </h3>
              <p className="text-[var(--text-muted)] text-sm leading-relaxed mb-8">
                {t("pipe1Desc")}
              </p>
            </div>
            <div className="p-3.5 rounded-lg bg-[var(--bg)] border hairline-border font-mono text-xs text-[var(--text-muted)] truncate" dir="ltr">
              {t("pipe1Badge")}
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-8 sm:p-10 rounded-xl surface-card flex flex-col justify-between">
            <div>
              <div className="font-mono text-xs text-[var(--accent)] font-semibold uppercase tracking-wider mb-4">
                {t("pipe2Eyebrow")}
              </div>
              <h3 className="text-2xl font-bold text-[var(--text)] mb-3">
                {t("pipe2Title")}
              </h3>
              <p className="text-[var(--text-muted)] text-sm leading-relaxed mb-8">
                {t("pipe2Desc")}
              </p>
            </div>
            <div className="p-3.5 rounded-lg bg-[var(--bg)] border hairline-border font-mono text-xs text-[var(--accent)]">
              {t("pipe2Badge")}
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-8 sm:p-10 rounded-xl surface-card flex flex-col justify-between">
            <div>
              <div className="font-mono text-xs text-emerald-400 font-semibold uppercase tracking-wider mb-4">
                {t("pipe3Eyebrow")}
              </div>
              <h3 className="text-2xl font-bold text-[var(--text)] mb-3">
                {t("pipe3Title")}
              </h3>
              <p className="text-[var(--text-muted)] text-sm leading-relaxed mb-8">
                {t("pipe3Desc")}
              </p>
            </div>
            <div className="p-3.5 rounded-lg bg-[var(--bg)] border hairline-border font-mono text-xs text-emerald-400">
              {t("pipe3Badge")}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
