"use client";

import React from "react";
import { useTranslations } from "next-intl";

interface WorkflowAudiencesProps {
  onOpenCuratorModal: () => void;
}

export function WorkflowAudiences({ onOpenCuratorModal }: WorkflowAudiencesProps) {
  const t = useTranslations("workflowLanding");

  return (
    <section id="audiences" className="py-24 lg:py-32 border-b hairline-border bg-[var(--surface)]/30">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="max-w-3xl mb-16 lg:mb-20 text-start">
          <span className="font-mono text-xs uppercase tracking-widest text-[var(--accent)]">
            {t("audEyebrow")}
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[var(--text)] mt-3 mb-5">
            {t("audTitle")}
          </h2>
          <p className="text-[var(--text-muted)] text-lg leading-relaxed">
            {t("audSubtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-start">
          {/* Audience 01: Active Job Seekers */}
          <div className="p-8 sm:p-10 lg:p-12 rounded-2xl surface-card flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between font-mono text-xs mb-6">
                <span className="px-3 py-1 rounded-md bg-[var(--accent)]/15 text-[var(--accent)] font-semibold">
                  {t("audSeekerTag")}
                </span>
                <span className="text-[var(--text-muted)]">{t("audSeekerScans")}</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-[var(--text)] mb-4">
                {t("audSeekerTitle")}
              </h3>
              <p className="text-[var(--text-muted)] text-sm sm:text-base leading-relaxed mb-8">
                {t("audSeekerDesc")}
              </p>

              <ul className="space-y-4 text-sm text-[var(--text-muted)] mb-10">
                <li className="flex items-start gap-3">
                  <span className="font-mono text-xs text-[var(--accent)] font-semibold mt-0.5">
                    01
                  </span>
                  <span>
                    <strong className="text-[var(--text)]">{t("audSeekerP1Title")}</strong>{" "}
                    {t("audSeekerP1Desc")}
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="font-mono text-xs text-[var(--accent)] font-semibold mt-0.5">
                    02
                  </span>
                  <span>
                    <strong className="text-[var(--text)]">{t("audSeekerP2Title")}</strong>{" "}
                    {t("audSeekerP2Desc")}
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="font-mono text-xs text-[var(--accent)] font-semibold mt-0.5">
                    03
                  </span>
                  <span>
                    <strong className="text-[var(--text)]">{t("audSeekerP3Title")}</strong>{" "}
                    {t("audSeekerP3Desc")}
                  </span>
                </li>
              </ul>
            </div>

            <div className="pt-6 border-t hairline-border flex items-center justify-between">
              <span className="font-mono text-xs text-emerald-400">
                {t("audSeekerFooterLeft")}
              </span>
              <a href="#pricing" className="font-mono text-xs font-semibold text-[var(--accent)] hover:underline">
                {t("audSeekerFooterLink")}
              </a>
            </div>
          </div>

          {/* Audience 02: Job Community Admins */}
          <div className="p-8 sm:p-10 lg:p-12 rounded-2xl surface-card border-[var(--accent)]/30 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between font-mono text-xs mb-6">
                <span className="px-3 py-1 rounded-md bg-emerald-500/15 text-emerald-400 font-semibold">
                  {t("audCuratorTag")}
                </span>
                <span className="text-[var(--text-muted)]">{t("audCuratorPlatforms")}</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-[var(--text)] mb-4">
                {t("audCuratorTitle")}
              </h3>
              <p className="text-[var(--text-muted)] text-sm sm:text-base leading-relaxed mb-8">
                {t("audCuratorDesc")}
              </p>

              <ul className="space-y-4 text-sm text-[var(--text-muted)] mb-10">
                <li className="flex items-start gap-3">
                  <span className="font-mono text-xs text-emerald-400 font-semibold mt-0.5">
                    01
                  </span>
                  <span>
                    <strong className="text-[var(--text)]">{t("audCuratorP1Title")}</strong>{" "}
                    {t("audCuratorP1Desc")}
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="font-mono text-xs text-emerald-400 font-semibold mt-0.5">
                    02
                  </span>
                  <span>
                    <strong className="text-[var(--text)]">{t("audCuratorP2Title")}</strong>{" "}
                    {t("audCuratorP2Desc")}
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="font-mono text-xs text-emerald-400 font-semibold mt-0.5">
                    03
                  </span>
                  <span>
                    <strong className="text-[var(--text)]">{t("audCuratorP3Title")}</strong>{" "}
                    {t("audCuratorP3Desc")}
                  </span>
                </li>
              </ul>
            </div>

            <div className="pt-6 border-t hairline-border flex items-center justify-between">
              <span className="font-mono text-xs text-[var(--accent)]">
                {t("audCuratorFooterLeft")}
              </span>
              <button
                type="button"
                onClick={onOpenCuratorModal}
                className="font-mono text-xs font-semibold text-emerald-400 hover:underline"
              >
                {t("audCuratorFooterLink")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
