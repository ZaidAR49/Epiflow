"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";

import type { AdminStats, AdminWorkflowItem, AdminUserItem } from "@/lib/db/queries/admin";
import type { WorkflowChannelItem } from "@/lib/db/queries/workflow-channels";
import type { PlanWithSubscriberCount } from "@/lib/db/queries/plans";
import type { SubscriptionWithDetails } from "@/lib/db/queries/subscriptions";
import type { PaymentWithDetails, PaymentStats } from "@/lib/db/queries/payments";
import type { UsageMeterWithDetails } from "@/lib/db/queries/usage-meters";

import { AdminSidebar, type AdminTab } from "./admin-sidebar";
import { AdminMobileTabBar } from "./admin-mobile-tab-bar";
import { AdminOverviewStats } from "./admin-overview-stats";
import { WorkflowManagementCard } from "./workflow-management-card";
import { PlanManagementCard } from "./plan-management-card";
import { SubscriptionManagementCard } from "./subscription-management-card";
import { PaymentLedgerCard } from "./payment-ledger-card";
import { UsageMetersCard } from "./usage-meters-card";
import { UserManagementTable } from "./user-management-table";

interface AdminShellProps {
  stats: AdminStats;
  workflows: AdminWorkflowItem[];
  users: AdminUserItem[];
  channels: WorkflowChannelItem[];
  plans: PlanWithSubscriberCount[];
  subscriptions: SubscriptionWithDetails[];
  payments: PaymentWithDetails[];
  paymentStats: PaymentStats;
  usageMeters: UsageMeterWithDetails[];
  currentUserId: string;
}

export function AdminShell({
  stats,
  workflows,
  users,
  channels,
  plans,
  subscriptions,
  payments,
  paymentStats,
  usageMeters,
  currentUserId,
}: AdminShellProps) {
  const t = useTranslations("admin");
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");

  const availableWorkflows = workflows.map((w) => ({ slug: w.slug, name: w.name }));

  const planOptions = plans.map((p) => ({
    id: p.id,
    name: p.name,
    code: p.code,
    priceMinor: p.priceMinor,
    currency: p.currency,
  }));

  const userOptions = users.map((u) => ({
    id: u.id,
    fullName: u.fullName,
    email: u.email,
  }));

  const pendingUsers = stats.pendingUsers;

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">

      {/* Mobile tab bar */}
      <AdminMobileTabBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        pendingUsers={pendingUsers}
      />

      {/* Body: sidebar + content */}
      <div className="flex flex-1 overflow-hidden">
        <AdminSidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          pendingUsers={pendingUsers}
        />

        {/* Main content panel */}
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-bold text-[var(--text)] mb-1">{t("overviewTab")}</h2>
                <p className="text-xs text-[var(--text-muted)]">{t("subtitle")}</p>
              </div>
              <AdminOverviewStats stats={stats} />
            </div>
          )}

          {activeTab === "workflows" && (
            <div className="space-y-6">
              <SectionHeader title={t("workflowsTab")} />
              <WorkflowManagementCard workflows={workflows} channels={channels} />
            </div>
          )}

          {activeTab === "plans" && (
            <div className="space-y-6">
              <SectionHeader title={t("plansTab")} />
              <PlanManagementCard plans={plans} availableWorkflows={availableWorkflows} />
            </div>
          )}

          {activeTab === "subscriptions" && (
            <div className="space-y-6">
              <SectionHeader title={t("subscriptionsTab")} />
              <SubscriptionManagementCard
                subscriptions={subscriptions}
                users={userOptions}
                plans={planOptions}
              />
            </div>
          )}

          {activeTab === "payments" && (
            <div className="space-y-6">
              <SectionHeader title={t("paymentsTab")} />
              <PaymentLedgerCard payments={payments} stats={paymentStats} />
            </div>
          )}

          {activeTab === "usageMeters" && (
            <div className="space-y-6">
              <SectionHeader title={t("usageMetersTab")} />
              <UsageMetersCard meters={usageMeters} />
            </div>
          )}

          {activeTab === "users" && (
            <div className="space-y-6">
              <SectionHeader title={t("usersTab")} count={pendingUsers > 0 ? pendingUsers : undefined} />
              <UserManagementTable users={users} currentUserId={currentUserId} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function SectionHeader({ title, count }: { title: string; count?: number }) {
  return (
    <div className="flex items-center gap-3">
      <h2 className="text-base font-bold text-[var(--text)]">{title}</h2>
      {count !== undefined && count > 0 && (
        <span className="inline-flex items-center justify-center h-5 min-w-5 rounded-full bg-rose-500/15 px-1.5 text-[10px] font-bold text-rose-400 border border-rose-500/30">
          {count}
        </span>
      )}
    </div>
  );
}
