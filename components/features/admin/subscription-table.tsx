"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Ban, Calendar, User as UserIcon } from "lucide-react";
import type { SubscriptionWithDetails } from "@/lib/db/queries/subscriptions";
import { cancelSubscriptionAction } from "@/lib/actions/subscriptions";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/hooks/use-toast";

interface SubscriptionTableProps {
  subscriptions: SubscriptionWithDetails[];
  onActionComplete?: () => void;
}

export function SubscriptionTable({
  subscriptions,
  onActionComplete,
}: SubscriptionTableProps) {
  const t = useTranslations("admin.subscriptions");
  const tCommon = useTranslations("common");
  const toast = useToast();
  const [isPending, startTransition] = useTransition();
  const [cancelingSub, setCancelingSub] = useState<SubscriptionWithDetails | null>(null);

  const handleConfirmCancel = () => {
    if (!cancelingSub) return;
    const subToCancel = cancelingSub;

    startTransition(async () => {
      const res = await cancelSubscriptionAction({ subscriptionId: subToCancel.id });
      if (res.success) {
        toast.success(t("cancelSuccess"));
        setCancelingSub(null);
        if (onActionComplete) {
          onActionComplete();
        }
      } else {
        toast.error(tCommon("error"), res.error);
      }
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400 border border-emerald-500/20">
            {t("statusActive")}
          </span>
        );
      case "trialing":
        return (
          <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2 py-0.5 text-[11px] font-medium text-blue-400 border border-blue-500/20">
            {t("statusTrialing")}
          </span>
        );
      case "canceled":
        return (
          <span className="inline-flex items-center rounded-full bg-rose-500/10 px-2 py-0.5 text-[11px] font-medium text-rose-400 border border-rose-500/20">
            {t("statusCanceled")}
          </span>
        );
      case "past_due":
        return (
          <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-400 border border-amber-500/20">
            {t("statusPastDue")}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-slate-500/10 px-2 py-0.5 text-[11px] font-medium text-slate-400 border border-slate-500/20">
            {status}
          </span>
        );
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "—";
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(date));
  };

  return (
    <div className="overflow-x-auto min-w-0">
      <table className="w-full text-start border-collapse">
        <thead>
          <tr className="border-b border-[var(--border)] bg-[var(--surface-2)]/30 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            <th className="px-4 py-2.5 text-start">{t("thUser")}</th>
            <th className="px-4 py-2.5 text-start">{t("thPlan")}</th>
            <th className="px-4 py-2.5 text-start">{t("thStatus")}</th>
            <th className="px-4 py-2.5 text-start">{t("thPeriod")}</th>
            <th className="px-4 py-2.5 text-start">{t("thProvider")}</th>
            <th className="px-4 py-2.5 text-start">{t("thActions")}</th>
          </tr>
        </thead>
        <tbody>
          {subscriptions.length === 0 ? (
            <tr>
              <td
                colSpan={6}
                className="px-4 py-8 text-center text-xs text-[var(--text-muted)]"
              >
                {t("noSubscriptions")}
              </td>
            </tr>
          ) : (
            subscriptions.map((sub) => (
              <tr
                key={sub.id}
                className="border-b border-[var(--border)] hover:bg-[var(--surface-2)]/50 transition-colors"
              >
                <td className="px-4 py-3 text-xs whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--surface-2)] text-[var(--accent)] font-bold text-xs shrink-0">
                      <UserIcon className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-[var(--text)] truncate">
                        {sub.userName}
                      </div>
                      <div className="text-[10px] text-[var(--text-muted)] truncate">
                        {sub.userEmail || "No email"}
                      </div>
                    </div>
                  </div>
                </td>

                <td className="px-4 py-3 text-xs whitespace-nowrap">
                  <div className="font-semibold text-[var(--text)]">
                    {sub.planName}
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)] font-mono">
                    {(sub.planPriceMinor / 100).toFixed(2)} {sub.planCurrency} / {sub.billingInterval}
                  </div>
                </td>

                <td className="px-4 py-3 text-xs whitespace-nowrap">
                  {getStatusBadge(sub.status)}
                </td>

                <td className="px-4 py-3 text-xs text-[var(--text-muted)] whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3 w-3 text-[var(--text-muted)]" />
                    <span>
                      {formatDate(sub.currentPeriodStart)} → {formatDate(sub.currentPeriodEnd)}
                    </span>
                  </div>
                </td>

                <td className="px-4 py-3 text-xs text-[var(--text)] font-mono whitespace-nowrap">
                  <span className="rounded bg-[var(--surface-2)] px-1.5 py-0.5 text-[10px]">
                    {sub.provider}
                  </span>
                </td>

                <td className="px-4 py-3 text-xs whitespace-nowrap">
                  {sub.status !== "canceled" && (
                    <button
                      type="button"
                      onClick={() => setCancelingSub(sub)}
                      disabled={isPending}
                      className="inline-flex items-center gap-1 rounded-md border border-rose-500/30 px-2.5 py-1 text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <Ban className="h-3 w-3" />
                      <span>{t("cancelSubscription")}</span>
                    </button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {cancelingSub && (
        <ConfirmDialog
          isOpen={Boolean(cancelingSub)}
          onClose={() => setCancelingSub(null)}
          onConfirm={handleConfirmCancel}
          title={t("cancelSubscription")}
          description={t("cancelPrompt", {
            name: cancelingSub.userName || cancelingSub.userEmail || "user",
          })}
          confirmLabel={t("cancelSubscription")}
          cancelLabel={tCommon("cancel")}
          variant="danger"
          isPending={isPending}
        />
      )}
    </div>
  );
}
