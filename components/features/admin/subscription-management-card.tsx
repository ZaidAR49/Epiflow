"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { CreditCard, Plus, Search } from "lucide-react";
import type { SubscriptionWithDetails } from "@/lib/db/queries/subscriptions";
import { SubscriptionTable } from "./subscription-table";
import { AssignPlanModal } from "./assign-plan-modal";
import type { AdminCallerRole } from "./admin-shell";

interface SubscriptionManagementCardProps {
  subscriptions: SubscriptionWithDetails[];
  users: { id: string; fullName: string; email: string | null }[];
  plans: { id: string; name: string; code: string; priceMinor: number; currency: string }[];
  callerRole: AdminCallerRole;
}

export function SubscriptionManagementCard({
  subscriptions,
  users,
  plans,
  callerRole,
}: SubscriptionManagementCardProps) {
  const t = useTranslations("admin.subscriptions");
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  const filtered = subscriptions.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.userName.toLowerCase().includes(q) ||
      (s.userEmail && s.userEmail.toLowerCase().includes(q)) ||
      s.planName.toLowerCase().includes(q) ||
      s.status.toLowerCase().includes(q)
    );
  });

  const handleRefresh = () => {
    router.refresh();
  };

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-[var(--accent)]" />
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
              placeholder="Search subscriptions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-48 sm:w-64 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] ps-8 pe-3 py-1.5 text-xs text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-hidden focus:border-[var(--accent)]"
            />
          </div>

          {callerRole !== "viewer" && (
            <button
              type="button"
              onClick={() => setIsAssignModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:opacity-90 transition-opacity shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>{t("assignPlan")}</span>
            </button>
          )}
        </div>
      </div>

      <div className="mt-4">
        <SubscriptionTable
          subscriptions={filtered}
          onActionComplete={handleRefresh}
          callerRole={callerRole}
        />
      </div>

      {callerRole !== "viewer" && (
        <AssignPlanModal
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          users={users}
          plans={plans}
          onSuccess={handleRefresh}
        />
      )}
    </div>
  );
}
