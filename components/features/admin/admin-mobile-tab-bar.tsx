"use client";

import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import {
  LayoutDashboard,
  Layers,
  Users,
  CreditCard,
  Receipt,
  Gauge,
  ShieldCheck,
  ArrowLeft,
  Bell,
} from "lucide-react";
import type { AdminTab } from "./admin-sidebar";

const TAB_CONFIG: {
  id: AdminTab;
  icon: React.ElementType;
  color: string;
}[] = [
  { id: "overview", icon: LayoutDashboard, color: "text-[var(--accent)]" },
  { id: "workflows", icon: Layers, color: "text-purple-400" },
  { id: "plans", icon: CreditCard, color: "text-sky-400" },
  { id: "subscriptions", icon: ShieldCheck, color: "text-emerald-400" },
  { id: "payments", icon: Receipt, color: "text-amber-400" },
  { id: "usageMeters", icon: Gauge, color: "text-rose-400" },
  { id: "users", icon: Users, color: "text-indigo-400" },
  { id: "notifications", icon: Bell, color: "text-violet-400" },
];

const TAB_LABEL_KEYS: Record<AdminTab, string> = {
  overview: "overviewTab",
  workflows: "workflowsTab",
  plans: "plansTab",
  subscriptions: "subscriptionsTab",
  payments: "paymentsTab",
  usageMeters: "usageMetersTab",
  users: "usersTab",
  notifications: "notificationsTab",
};

interface AdminMobileTabBarProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  pendingUsers: number;
}

export function AdminMobileTabBar({
  activeTab,
  onTabChange,
  pendingUsers,
}: AdminMobileTabBarProps) {
  const t = useTranslations("admin");
  const locale = useLocale();

  return (
    <div className="md:hidden border-b border-[var(--border)] bg-[var(--surface)]">
      {/* Mobile Top Context Strip */}
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-[var(--border)]/50 bg-[var(--surface-2)]/30">
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-flex items-center gap-1 rounded-md bg-[var(--accent)]/15 px-1.5 py-0.5 text-[10px] font-bold text-[var(--accent)] border border-[var(--accent)]/30 shrink-0">
            <ShieldCheck className="h-3 w-3" />
            <span>{t("badgeOwner")}</span>
          </span>
          <span className="text-xs font-bold text-[var(--text)] truncate">{t("title")}</span>
        </div>
        <Link
          href={`/${locale}/profile`}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--accent)] hover:underline shrink-0"
        >
          <ArrowLeft className="h-3 w-3 rtl:-scale-x-100" />
          <span>{t("backToProfile")}</span>
        </Link>
      </div>

      {/* Mobile Tab Scroll Bar */}
      <div className="flex overflow-x-auto gap-1.5 px-3 py-2 scrollbar-hide">
      {TAB_CONFIG.map(({ id, icon: Icon, color }) => {
        const isActive = activeTab === id;
        const label = t(TAB_LABEL_KEYS[id]);
        const hasBadge = id === "users" && pendingUsers > 0;

        return (
          <button
            key={id}
            type="button"
            onClick={() => onTabChange(id)}
            className={`
              flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all shrink-0 cursor-pointer
              ${isActive
                ? "bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30"
                : "text-[var(--text-muted)] hover:bg-[var(--surface-2)] border border-transparent"
              }
            `}
          >
            <div className="relative">
              <Icon className={`h-3.5 w-3.5 ${isActive ? color : ""}`} />
              {hasBadge && (
                <span className="absolute -top-1 -end-1 h-1.5 w-1.5 rounded-full bg-rose-500" />
              )}
            </div>
            <span>{label}</span>
          </button>
        );
      })}
      </div>
    </div>
  );
}
