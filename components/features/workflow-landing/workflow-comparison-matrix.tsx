"use client";

import React from "react";
import { useTranslations } from "next-intl";

export function WorkflowComparisonMatrix() {
  const t = useTranslations("workflowLanding");

  const rows = [
    {
      cap: t("compRow1Cap"),
      manual: t("compRow1Manual"),
      xray: t("compRow1Xray"),
      isNum: true,
    },
    {
      cap: t("compRow2Cap"),
      manual: t("compRow2Manual"),
      xray: t("compRow2Xray"),
      isNum: false,
    },
    {
      cap: t("compRow3Cap"),
      manual: t("compRow3Manual"),
      xray: t("compRow3Xray"),
      isNum: false,
    },
    {
      cap: t("compRow4Cap"),
      manual: t("compRow4Manual"),
      xray: t("compRow4Xray"),
      isNum: false,
    },
    {
      cap: t("compRow5Cap"),
      manual: t("compRow5Manual"),
      xray: t("compRow5Xray"),
      isNum: false,
    },
  ];

  return (
    <section id="comparison" className="py-24 lg:py-32 border-b hairline-border">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-16 lg:mb-20">
          <span className="font-mono text-xs uppercase tracking-widest text-[var(--accent)]">
            {t("compEyebrow")}
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[var(--text)] mt-3 mb-5">
            {t("compTitle")}
          </h2>
          <p className="text-[var(--text-muted)] text-lg">
            {t("compSubtitle")}
          </p>
        </div>

        {/* Spacious Comparison Table */}
        <div className="surface-card rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-start border-collapse">
              <thead>
                <tr className="border-b hairline-border bg-[var(--bg)]/60 font-mono text-xs uppercase tracking-wider">
                  <th className="py-5 px-6 sm:px-8 text-start text-[var(--text-muted)] w-1/4">
                    {t("compThCapability")}
                  </th>
                  <th className="py-5 px-6 sm:px-8 text-start text-[var(--text-muted)] w-3/8">
                    {t("compThManual")}
                  </th>
                  <th className="py-5 px-6 sm:px-8 text-start text-[var(--accent)] font-semibold bg-[var(--accent)]/10 w-3/8">
                    {t("compThXray")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y hairline-border text-sm">
                {rows.map((row, idx) => (
                  <tr key={idx}>
                    <td className="py-5 px-6 sm:px-8 font-medium text-[var(--text)]">
                      {row.cap}
                    </td>
                    <td
                      className={`py-5 px-6 sm:px-8 text-[var(--text-muted)] ${
                        row.isNum ? "font-mono tabular" : ""
                      }`}
                    >
                      {row.manual}
                    </td>
                    <td
                      className={`py-5 px-6 sm:px-8 bg-[var(--accent)]/5 ${
                        row.isNum
                          ? "font-mono font-semibold text-emerald-400 tabular"
                          : "text-[var(--text)] font-medium"
                      }`}
                    >
                      {row.xray}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
