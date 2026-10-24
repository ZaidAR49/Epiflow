"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Gauge, Plus, Workflow } from "lucide-react";
import type { UsageMeterWithDetails } from "@/lib/db/queries/usage-meters";
import { UsageMeterModal } from "./usage-meter-modal";

interface UsageMetersCardProps {
  meters: UsageMeterWithDetails[];
}

export function UsageMetersCard({ meters }: UsageMetersCardProps) {
  const t = useTranslations("admin.usageMeters");
  const locale = useLocale();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
      dateStyle: "medium",
    }).format(date);
  };

  return (
    <>
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
        {/* Card Header */}
        <div className="flex flex-col gap-4 border-b border-[var(--border)] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--accent)]/20 bg-[var(--accent)]/10 text-[var(--accent)]">
              <Gauge className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-[var(--text)]">{t("title")}</h2>
                <span className="rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-xs font-medium text-[var(--text-muted)] border border-[var(--border)]">
                  {meters.length}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">{t("subtitle")}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3.5 py-2 text-xs font-medium text-white shadow-sm hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] transition-colors self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            <span>{t("addMeter")}</span>
          </button>
        </div>

        {/* Meters Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-start">
            <thead className="border-b border-[var(--border)] bg-[var(--surface-2)]/40 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              <tr>
                <th scope="col" className="px-4 py-3 text-start">{t("thKey")}</th>
                <th scope="col" className="px-4 py-3 text-start">{t("thName")}</th>
                <th scope="col" className="px-4 py-3 text-start">{t("thUnit")}</th>
                <th scope="col" className="px-4 py-3 text-start">{t("thWorkflowsCount")}</th>
                <th scope="col" className="px-4 py-3 text-start">{t("thCreatedAt")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {meters.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-xs text-[var(--text-muted)]">
                    {t("noMeters")}
                  </td>
                </tr>
              ) : (
                meters.map((meter) => (
                  <tr
                    key={meter.id}
                    className="border-b border-[var(--border)] transition-colors hover:bg-[var(--surface-2)]/40"
                  >
                    {/* Key */}
                    <td className="px-4 py-3.5 text-start">
                      <span className="font-mono text-xs font-semibold text-[var(--accent)] bg-[var(--accent)]/10 px-2 py-0.5 rounded border border-[var(--accent)]/20" dir="ltr">
                        {meter.key}
                      </span>
                    </td>

                    {/* Display Name */}
                    <td className="px-4 py-3.5 text-start text-xs font-medium text-[var(--text)]">
                      {meter.name}
                    </td>

                    {/* Unit */}
                    <td className="px-4 py-3.5 text-start">
                      <span className="rounded bg-[var(--surface-2)] px-2 py-0.5 text-xs text-[var(--text-muted)] border border-[var(--border)]">
                        {meter.unit}
                      </span>
                    </td>

                    {/* Workflows Count */}
                    <td className="px-4 py-3.5 text-start">
                      <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-2 py-0.5 text-xs font-medium text-[var(--text)]">
                        <Workflow className="h-3 w-3 text-[var(--text-muted)]" />
                        {meter.workflowsCount}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3.5 text-start text-xs text-[var(--text-muted)] whitespace-nowrap">
                      {formatDate(meter.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <UsageMeterModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
