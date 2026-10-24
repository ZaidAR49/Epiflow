"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Layers, Plus, Search } from "lucide-react";
import type { PlanWithSubscriberCount } from "@/lib/db/queries/plans";
import { PlanTableRow } from "./plan-table-row";
import { PlanFormModal } from "./plan-form-modal";

interface PlanManagementCardProps {
  plans: PlanWithSubscriberCount[];
  availableWorkflows?: { slug: string; name: string }[];
}

export function PlanManagementCard({
  plans,
  availableWorkflows = [{ slug: "job-xray", name: "JobPost X-Ray" }],
}: PlanManagementCardProps) {
  const t = useTranslations("admin.plans");
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlanWithSubscriberCount | null>(null);

  const filteredPlans = plans.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.code.toLowerCase().includes(q) ||
      p.billingInterval.toLowerCase().includes(q)
    );
  });

  const handleOpenCreate = () => {
    setEditingPlan(null);
    setIsModalOpen(true);
  };

  const handleEdit = (plan: PlanWithSubscriberCount) => {
    setEditingPlan(plan);
    setIsModalOpen(true);
  };

  const handleSuccess = () => {
    router.refresh();
  };

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-[var(--accent)]" />
            <h2 className="text-base font-bold text-[var(--text)]">
              {t("title")}
            </h2>
          </div>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            {t("subtitle")}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Filter plans..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-48 sm:w-64 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] ps-8 pe-3 py-1.5 text-xs text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-hidden focus:border-[var(--accent)]"
            />
          </div>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:opacity-90 transition-opacity shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>{t("addPlan")}</span>
          </button>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto min-w-0">
        <table className="w-full text-start border-collapse">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--surface-2)]/30 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              <th className="px-4 py-2.5 text-start">{t("thCode")}</th>
              <th className="px-4 py-2.5 text-start">{t("thName")}</th>
              <th className="px-4 py-2.5 text-start">{t("thPrice")}</th>
              <th className="px-4 py-2.5 text-start">{t("thInterval")}</th>
              <th className="px-4 py-2.5 text-start">{t("thSubscribers")}</th>
              <th className="px-4 py-2.5 text-start">{t("thStatus")}</th>
              <th className="px-4 py-2.5 text-start">{t("thActions")}</th>
            </tr>
          </thead>
          <tbody>
            {filteredPlans.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-xs text-[var(--text-muted)]"
                >
                  {t("noPlans")}
                </td>
              </tr>
            ) : (
              filteredPlans.map((plan) => (
                <PlanTableRow
                  key={plan.id}
                  plan={plan}
                  onEdit={handleEdit}
                  onStatusChange={handleSuccess}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      <PlanFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={editingPlan}
        availableWorkflows={availableWorkflows}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
