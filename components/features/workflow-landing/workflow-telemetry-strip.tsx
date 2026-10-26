"use client";

import React from "react";
import { useTranslations } from "next-intl";

export function WorkflowTelemetryStrip() {
  const t = useTranslations("workflowLanding");

  return (
    <div className="max-w-5xl mx-auto mt-8 sm:mt-12 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 min-w-0">
      <div className="p-4 sm:p-6 rounded-xl surface-card min-w-0">
        <div className="font-heading font-bold text-xl sm:text-3xl text-[var(--text)]">
          {t("strip1Num")}
        </div>
        <div className="text-xs sm:text-sm text-[var(--text-muted)] mt-1 truncate">
          {t("strip1Label")}
        </div>
      </div>
      <div className="p-4 sm:p-6 rounded-xl surface-card min-w-0">
        <div className="font-heading font-bold text-xl sm:text-3xl text-emerald-400 tabular">
          {t("strip2Num")}
        </div>
        <div className="text-xs sm:text-sm text-[var(--text-muted)] mt-1 truncate">
          {t("strip2Label")}
        </div>
      </div>
      <div className="p-4 sm:p-6 rounded-xl surface-card min-w-0">
        <div className="font-heading font-bold text-xl sm:text-3xl text-[var(--accent)]">
          {t("strip3Num")}
        </div>
        <div className="text-xs sm:text-sm text-[var(--text-muted)] mt-1 truncate">
          {t("strip3Label")}
        </div>
      </div>
      <div className="p-4 sm:p-6 rounded-xl surface-card min-w-0">
        <div className="font-heading font-bold text-xl sm:text-3xl text-[var(--text)]">
          {t("strip4Num")}
        </div>
        <div className="text-xs sm:text-sm text-[var(--text-muted)] mt-1 truncate">
          {t("strip4Label")}
        </div>
      </div>
    </div>
  );
}
