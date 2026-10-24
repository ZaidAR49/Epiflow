"use client";

import { useState, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Receipt, Search, DollarSign, Filter } from "lucide-react";
import type { PaymentWithDetails, PaymentStats } from "@/lib/db/queries/payments";
import { PaymentTableRow } from "./payment-table-row";

interface PaymentLedgerCardProps {
  payments: PaymentWithDetails[];
  stats: PaymentStats;
}

export function PaymentLedgerCard({ payments, stats }: PaymentLedgerCardProps) {
  const t = useTranslations("admin.payments");
  const locale = useLocale();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const formattedTotalVolume = new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US", {
    style: "currency",
    currency: "USD",
  }).format(stats.totalVolumeMinor / 100);

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const matchesStatus = statusFilter === "all" || p.status === statusFilter;
      if (!matchesStatus) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        p.userName.toLowerCase().includes(q) ||
        (p.userEmail && p.userEmail.toLowerCase().includes(q)) ||
        p.providerPaymentId.toLowerCase().includes(q) ||
        (p.planName && p.planName.toLowerCase().includes(q)) ||
        (p.planCode && p.planCode.toLowerCase().includes(q))
      );
    });
  }, [payments, searchQuery, statusFilter]);

  const filterTabs = [
    { key: "all", label: t("filterAll"), count: payments.length },
    { key: "succeeded", label: t("filterSucceeded"), count: stats.succeededCount },
    { key: "refunded", label: t("filterRefunded"), count: stats.refundedCount },
    {
      key: "failed",
      label: t("filterFailed"),
      count: payments.filter((p) => p.status === "failed").length,
    },
  ];

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
      {/* Header with Metrics */}
      <div className="flex flex-col gap-4 border-b border-[var(--border)] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
            <Receipt className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-[var(--text)]">{t("title")}</h2>
              <span className="rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-xs font-medium text-[var(--text-muted)] border border-[var(--border)]">
                {payments.length}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">{t("subtitle")}</p>
          </div>
        </div>

        {/* Volume & Count Badges */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5">
            <DollarSign className="h-4 w-4 text-emerald-400" />
            <div className="text-start">
              <p className="text-[10px] uppercase font-semibold text-[var(--text-muted)] tracking-wider">
                {t("totalVolume")}
              </p>
              <p className="text-xs font-bold text-[var(--text)] font-mono">{formattedTotalVolume}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col gap-3 border-b border-[var(--border)] p-4 sm:flex-row sm:items-center sm:justify-between bg-[var(--surface-2)]/20">
        {/* Status Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Filter payments by status">
          {filterTabs.map((tab) => {
            const isActive = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setStatusFilter(tab.key)}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
                  isActive
                    ? "bg-[var(--accent)] text-white shadow-sm"
                    : "border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] rounded-full px-1.5 py-0.2 ${isActive ? "bg-white/20" : "bg-[var(--surface-2)]"}`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="pointer-events-none absolute start-3 top-2.5 h-3.5 w-3.5 text-[var(--text-muted)]" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchPlaceholder")}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] py-1.5 pe-3 ps-8 text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          />
        </div>
      </div>

      {/* Ledger Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-start">
          <thead className="border-b border-[var(--border)] bg-[var(--surface-2)]/40 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            <tr>
              <th scope="col" className="px-4 py-3 text-start">{t("thCustomer")}</th>
              <th scope="col" className="px-4 py-3 text-start">{t("thPlan")}</th>
              <th scope="col" className="px-4 py-3 text-start">{t("thAmount")}</th>
              <th scope="col" className="px-4 py-3 text-start">{t("thStatus")}</th>
              <th scope="col" className="px-4 py-3 text-start">{t("thProvider")}</th>
              <th scope="col" className="px-4 py-3 text-start">{t("thDate")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {filteredPayments.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-xs text-[var(--text-muted)]">
                  {t("noPayments")}
                </td>
              </tr>
            ) : (
              filteredPayments.map((p) => <PaymentTableRow key={p.id} payment={p} />)
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
