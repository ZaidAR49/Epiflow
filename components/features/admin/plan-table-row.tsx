"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { Edit2, Play, Pause, Users, ShieldCheck } from "lucide-react";
import type { PlanWithSubscriberCount } from "@/lib/db/queries/plans";
import { togglePlanActiveAction } from "@/lib/actions/plans";

interface PlanTableRowProps {
  plan: PlanWithSubscriberCount;
  onEdit: (plan: PlanWithSubscriberCount) => void;
  onStatusChange?: () => void;
}

export function PlanTableRow({ plan, onEdit, onStatusChange }: PlanTableRowProps) {
  const t = useTranslations("admin.plans");
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      const res = await togglePlanActiveAction(plan.id);
      if (res.success && onStatusChange) {
        onStatusChange();
      }
    });
  };

  const formattedPrice = (plan.priceMinor / 100).toLocaleString(undefined, {
    style: "currency",
    currency: plan.currency || "USD",
  });

  return (
    <tr className="border-b border-[var(--border)] hover:bg-[var(--surface-2)]/50 transition-colors">
      <td className="px-4 py-3 text-xs font-mono font-medium text-[var(--accent)] whitespace-nowrap">
        {plan.code}
      </td>

      <td className="px-4 py-3 text-xs font-semibold text-[var(--text)] whitespace-nowrap">
        {plan.name}
      </td>

      <td className="px-4 py-3 text-xs font-bold text-[var(--text)] whitespace-nowrap">
        {formattedPrice}
      </td>

      <td className="px-4 py-3 text-xs text-[var(--text-muted)] whitespace-nowrap capitalize">
        {plan.billingInterval}
      </td>

      <td className="px-4 py-3 text-xs text-[var(--text)] whitespace-nowrap">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--surface-2)] px-2.5 py-0.5 font-medium">
          <Users className="h-3 w-3 text-[var(--text-muted)]" />
          {plan.activeSubscriptionsCount}
        </span>
      </td>

      <td className="px-4 py-3 text-xs whitespace-nowrap">
        {plan.isActive ? (
          <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400 border border-emerald-500/20">
            {t("active")}
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-400 border border-amber-500/20">
            {t("inactive")}
          </span>
        )}
      </td>

      <td className="px-4 py-3 text-xs whitespace-nowrap">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onEdit(plan)}
            className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-xs font-medium text-[var(--text)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
          >
            <Edit2 className="h-3 w-3" />
            <span>{t("editPlan")}</span>
          </button>

          {plan.code === "free" ? (
            <span
              className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1 text-xs font-medium text-[var(--text-muted)] cursor-not-allowed select-none"
              title={t("cannotDeactivateDefault")}
            >
              <ShieldCheck className="h-3 w-3 text-[var(--accent)]" />
              <span>{t("defaultBadge")}</span>
            </span>
          ) : (
            <button
              type="button"
              onClick={handleToggle}
              disabled={isPending}
              className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                plan.isActive
                  ? "border border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                  : "border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
              }`}
            >
              {plan.isActive ? (
                <>
                  <Pause className="h-3 w-3" />
                  <span>{t("pausePlan")}</span>
                </>
              ) : (
                <>
                  <Play className="h-3 w-3" />
                  <span>{t("activatePlan")}</span>
                </>
              )}
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
