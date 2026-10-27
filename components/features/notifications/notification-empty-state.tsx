"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { BellOff } from "lucide-react";

export function NotificationEmptyState() {
  const t = useTranslations("notifications");

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-2)]/60 text-[var(--text-muted)] mb-3">
        <BellOff className="h-6 w-6 stroke-[1.5]" />
      </div>
      <h4 className="text-xs font-bold text-[var(--text)] mb-1">
        {t("allCaughtUp")}
      </h4>
      <p className="text-[11px] leading-relaxed text-[var(--text-muted)] max-w-[220px]">
        {t("noNotificationsDesc")}
      </p>
    </div>
  );
}
