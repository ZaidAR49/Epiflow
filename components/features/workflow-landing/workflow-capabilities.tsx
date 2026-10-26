"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";

export function WorkflowCapabilities() {
  const t = useTranslations("workflowLanding");
  const [bilingualLang, setBilingualLang] = useState<"en" | "ar">("en");

  return (
    <section id="features" className="py-12 sm:py-20 lg:py-28 border-b hairline-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-w-0">
        {/* Section Heading */}
        <div className="max-w-3xl mb-10 sm:mb-16 lg:mb-20 text-start min-w-0">
          <span className="font-mono text-xs uppercase tracking-widest text-[var(--accent)]">
            {t("capEyebrow")}
          </span>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-[var(--text)] mt-3 mb-4 break-words">
            {t("capTitle")}
          </h2>
          <p className="text-[var(--text-muted)] text-sm sm:text-base lg:text-lg leading-relaxed">
            {t("capSubtitle")}
          </p>
        </div>

        {/* 3x2 Spacious Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 text-start min-w-0">
          {/* Card 01 */}
          <div className="p-6 sm:p-8 rounded-xl surface-card hover:bg-[var(--surface-2)]/60 transition-all flex flex-col justify-between min-w-0">
            <div>
              <div className="flex items-center justify-between font-mono text-xs mb-5 sm:mb-6">
                <span className="text-[var(--accent)] font-semibold text-sm">{t("cap1Num")}</span>
                <span className="text-[var(--text-muted)]">{t("cap1Tag")}</span>
              </div>
              <h3 className="text-xl font-bold text-[var(--text)] mb-3">
                {t("cap1Title")}
              </h3>
              <p className="text-[var(--text-muted)] text-sm leading-relaxed mb-8">
                {t("cap1Desc")}
              </p>
            </div>
            <div className="pt-4 border-t hairline-border font-mono text-xs text-emerald-400">
              {t("cap1Footer")}
            </div>
          </div>

          {/* Card 02 */}
          <div className="p-6 sm:p-8 rounded-xl surface-card hover:bg-[var(--surface-2)]/60 transition-all flex flex-col justify-between min-w-0">
            <div>
              <div className="flex items-center justify-between font-mono text-xs mb-5 sm:mb-6">
                <span className="text-[var(--accent)] font-semibold text-sm">{t("cap2Num")}</span>
                <span className="text-[var(--text-muted)]">{t("cap2Tag")}</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-[var(--text)] mb-2.5 sm:mb-3 break-words">
                {t("cap2Title")}
              </h3>
              <p className="text-[var(--text-muted)] text-xs sm:text-sm leading-relaxed mb-6 sm:mb-8">
                {t("cap2Desc")}
              </p>
            </div>
            <div className="pt-3.5 sm:pt-4 border-t hairline-border font-mono text-xs text-emerald-400">
              {t("cap2Footer")}
            </div>
          </div>

          {/* Card 03 */}
          <div className="p-6 sm:p-8 rounded-xl surface-card hover:bg-[var(--surface-2)]/60 transition-all flex flex-col justify-between min-w-0">
            <div>
              <div className="flex items-center justify-between font-mono text-xs mb-5 sm:mb-6">
                <span className="text-[var(--accent)] font-semibold text-sm">{t("cap3Num")}</span>
                <span className="text-[var(--text-muted)]">{t("cap3Tag")}</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-[var(--text)] mb-2.5 sm:mb-3 break-words">
                {t("cap3Title")}
              </h3>
              <p className="text-[var(--text-muted)] text-xs sm:text-sm leading-relaxed mb-6 sm:mb-8">
                {t("cap3Desc")}
              </p>
            </div>
            <div className="pt-3.5 sm:pt-4 border-t hairline-border font-mono text-xs text-[var(--accent)]">
              {t("cap3Footer")}
            </div>
          </div>

          {/* Card 04 */}
          <div className="p-6 sm:p-8 rounded-xl surface-card hover:bg-[var(--surface-2)]/60 transition-all flex flex-col justify-between min-w-0">
            <div>
              <div className="flex items-center justify-between font-mono text-xs mb-5 sm:mb-6">
                <span className="text-[var(--accent)] font-semibold text-sm">{t("cap4Num")}</span>
                <span className="text-[var(--text-muted)]">{t("cap4Tag")}</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-[var(--text)] mb-2.5 sm:mb-3 break-words">
                {t("cap4Title")}
              </h3>
              <p className="text-[var(--text-muted)] text-xs sm:text-sm leading-relaxed mb-6 sm:mb-8">
                {t("cap4Desc")}
              </p>
            </div>
            <div className="pt-3.5 sm:pt-4 border-t hairline-border font-mono text-xs text-amber-400">
              {t("cap4Footer")}
            </div>
          </div>

          {/* Card 05 */}
          <div className="p-6 sm:p-8 rounded-xl surface-card hover:bg-[var(--surface-2)]/60 transition-all flex flex-col justify-between min-w-0">
            <div>
              <div className="flex items-center justify-between font-mono text-xs mb-5 sm:mb-6">
                <span className="text-[var(--accent)] font-semibold text-sm">{t("cap5Num")}</span>
                <span className="text-[var(--text-muted)]">{t("cap5Tag")}</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-[var(--text)] mb-2.5 sm:mb-3 break-words">
                {t("cap5Title")}
              </h3>
              <p className="text-[var(--text-muted)] text-xs sm:text-sm leading-relaxed mb-6 sm:mb-8">
                {t("cap5Desc")}
              </p>
            </div>
            <div className="pt-3.5 sm:pt-4 border-t hairline-border font-mono text-xs text-[var(--text)]">
              {t("cap5Footer")}
            </div>
          </div>

          {/* Card 06: Interactive Bilingual Switcher */}
          <div className="p-6 sm:p-8 rounded-xl surface-card hover:bg-[var(--surface-2)]/60 transition-all flex flex-col justify-between min-w-0">
            <div>
              <div className="flex items-center justify-between font-mono text-xs mb-5 sm:mb-6">
                <span className="text-[var(--accent)] font-semibold text-sm">{t("cap6Num")}</span>
                <div className="inline-flex rounded-md bg-[var(--bg)] p-0.5 border hairline-border">
                  <button
                    type="button"
                    onClick={() => setBilingualLang("en")}
                    className={`px-2.5 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                      bilingualLang === "en"
                        ? "bg-[var(--accent)] text-white"
                        : "text-[var(--text-muted)] hover:text-[var(--text)]"
                    }`}
                  >
                    EN
                  </button>
                  <button
                    type="button"
                    onClick={() => setBilingualLang("ar")}
                    className={`px-2.5 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                      bilingualLang === "ar"
                        ? "bg-[var(--accent)] text-white"
                        : "text-[var(--text-muted)] hover:text-[var(--text)]"
                    }`}
                  >
                    AR
                  </button>
                </div>
              </div>
              <h3 className="text-xl font-bold text-[var(--text)] mb-3">
                {t("cap6Title")}
              </h3>
              <p className="text-[var(--text-muted)] text-sm leading-relaxed mb-6">
                {t("cap6Desc")}
              </p>
            </div>
            <div
              dir={bilingualLang === "ar" ? "rtl" : "ltr"}
              className="p-3.5 rounded-lg bg-[var(--bg)] border hairline-border font-mono text-xs text-emerald-400 transition-all"
            >
              {bilingualLang === "ar" ? t("cap6SampleAr") : t("cap6SampleEn")}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
