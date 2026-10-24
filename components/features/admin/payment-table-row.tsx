"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Check, Copy, CreditCard, DollarSign } from "lucide-react";
import type { PaymentWithDetails } from "@/lib/db/queries/payments";

interface PaymentTableRowProps {
  payment: PaymentWithDetails;
}

export function PaymentTableRow({ payment }: PaymentTableRowProps) {
  const t = useTranslations("admin.payments");
  const locale = useLocale();
  const [copied, setCopied] = useState(false);

  const formattedAmount = new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US", {
    style: "currency",
    currency: payment.currency.trim() || "USD",
  }).format(payment.amountMinor / 100);

  const formattedDate = new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(payment.paidAt || payment.createdAt);

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(payment.providerPaymentId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback ignore clipboard failure
    }
  };

  const getStatusBadge = () => {
    switch (payment.status) {
      case "succeeded":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            {t("statusSucceeded")}
          </span>
        );
      case "refunded":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-400">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            {t("statusRefunded")}
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[11px] font-medium text-rose-400">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
            {t("statusFailed")}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-slate-500/30 bg-slate-500/10 px-2 py-0.5 text-[11px] font-medium text-slate-400">
            {t("statusPending")}
          </span>
        );
    }
  };

  return (
    <tr className="border-b border-[var(--border)] transition-colors hover:bg-[var(--surface-2)]/40">
      {/* Customer Info */}
      <td className="px-4 py-3.5 text-start">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--surface-2)] border border-[var(--border)] text-xs font-bold text-[var(--accent)]">
            {payment.userName.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-[var(--text)]">{payment.userName}</p>
            {payment.userEmail && (
              <p className="truncate text-[11px] text-[var(--text-muted)]" dir="ltr">
                {payment.userEmail}
              </p>
            )}
          </div>
        </div>
      </td>

      {/* Plan */}
      <td className="px-4 py-3.5 text-start">
        <span className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2 py-0.5 text-xs font-medium text-[var(--text)]">
          <CreditCard className="h-3 w-3 text-[var(--text-muted)]" />
          {payment.planName || payment.planCode || "Custom / Add-on"}
        </span>
      </td>

      {/* Amount */}
      <td className="px-4 py-3.5 text-start">
        <div className="flex items-center gap-1 font-mono text-xs font-semibold text-[var(--text)]">
          <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
          <span>{formattedAmount}</span>
        </div>
      </td>

      {/* Status */}
      <td className="px-4 py-3.5 text-start">{getStatusBadge()}</td>

      {/* Provider & ID */}
      <td className="px-4 py-3.5 text-start">
        <div className="flex items-center gap-1.5">
          <span className="rounded bg-[var(--surface-2)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] border border-[var(--border)]">
            {payment.provider}
          </span>
          <span className="font-mono text-[11px] text-[var(--text-muted)] truncate max-w-[140px]" dir="ltr">
            {payment.providerPaymentId}
          </span>
          <button
            type="button"
            onClick={handleCopyId}
            title={copied ? t("copied") : t("copyPaymentId")}
            aria-label={t("copyPaymentId")}
            className="rounded p-1 text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] transition-colors"
          >
            {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
          </button>
        </div>
      </td>

      {/* Date */}
      <td className="px-4 py-3.5 text-start text-xs text-[var(--text-muted)] whitespace-nowrap">
        {formattedDate}
      </td>
    </tr>
  );
}
