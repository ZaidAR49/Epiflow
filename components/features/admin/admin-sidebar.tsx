"use client";

import React, { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { useTranslations, useLocale } from "next-intl";
import {
  LayoutDashboard,
  Layers,
  Users,
  CreditCard,
  Receipt,
  Gauge,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  ArrowLeft,
  LogOut,
  Loader2,
} from "lucide-react";

export type AdminTab =
  | "overview"
  | "workflows"
  | "plans"
  | "subscriptions"
  | "payments"
  | "usageMeters"
  | "users";

interface AdminSidebarProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  pendingUsers: number;
}

const TAB_CONFIG: {
  id: AdminTab;
  icon: React.ElementType;
  color: string;
  activeBg: string;
  activeBorder: string;
}[] = [
  {
    id: "overview",
    icon: LayoutDashboard,
    color: "text-[var(--accent)]",
    activeBg: "bg-[var(--accent)]/10",
    activeBorder: "border-[var(--accent)]/40",
  },
  {
    id: "workflows",
    icon: Layers,
    color: "text-purple-400",
    activeBg: "bg-purple-500/10",
    activeBorder: "border-purple-500/30",
  },
  {
    id: "plans",
    icon: CreditCard,
    color: "text-sky-400",
    activeBg: "bg-sky-500/10",
    activeBorder: "border-sky-500/30",
  },
  {
    id: "subscriptions",
    icon: ShieldCheck,
    color: "text-emerald-400",
    activeBg: "bg-emerald-500/10",
    activeBorder: "border-emerald-500/30",
  },
  {
    id: "payments",
    icon: Receipt,
    color: "text-amber-400",
    activeBg: "bg-amber-500/10",
    activeBorder: "border-amber-500/30",
  },
  {
    id: "usageMeters",
    icon: Gauge,
    color: "text-rose-400",
    activeBg: "bg-rose-500/10",
    activeBorder: "border-rose-500/30",
  },
  {
    id: "users",
    icon: Users,
    color: "text-indigo-400",
    activeBg: "bg-indigo-500/10",
    activeBorder: "border-indigo-500/40",
  },
];

const TAB_LABEL_KEYS: Record<AdminTab, string> = {
  overview: "overviewTab",
  workflows: "workflowsTab",
  plans: "plansTab",
  subscriptions: "subscriptionsTab",
  payments: "paymentsTab",
  usageMeters: "usageMetersTab",
  users: "usersTab",
};

export function AdminSidebar({
  activeTab,
  onTabChange,
  pendingUsers,
}: AdminSidebarProps) {
  const t = useTranslations("admin");
  const tAuth = useTranslations("auth");
  const locale = useLocale();
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("admin-sidebar-collapsed") === "true";
  });
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    try {
      await signOut({ callbackUrl: `/${locale}/sign-in` });
    } catch {
      setIsLoggingOut(false);
    }
  };

  const handleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("admin-sidebar-collapsed", String(next));
  };

  return (
    <aside
      className={`
        hidden md:flex flex-col shrink-0 border-e border-[var(--border)] bg-[var(--surface)] transition-all duration-300
        ${collapsed ? "w-16" : "w-64"}
      `}
    >
      {/* Sidebar Header: Role Badge + Title & Collapse Toggle */}
      <div className="p-3.5 border-b border-[var(--border)]/50 shrink-0">
        {!collapsed ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1 rounded-md bg-[var(--accent)]/15 px-2 py-0.5 text-[10px] font-bold text-[var(--accent)] border border-[var(--accent)]/30 shrink-0">
                <ShieldCheck className="h-3 w-3" />
                <span>{t("badgeOwner")}</span>
              </span>
              <button
                type="button"
                onClick={handleCollapse}
                className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors cursor-pointer shrink-0"
                aria-label={t("collapseSidebar")}
                title={t("collapseSidebar")}
              >
                <ChevronLeft className="h-4 w-4 rtl:-scale-x-100" />
              </button>
            </div>
            <h2 className="text-xs font-bold text-[var(--text)] leading-snug">
              {t("title")}
            </h2>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={handleCollapse}
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
              aria-label={t("expandSidebar")}
              title={t("expandSidebar")}
            >
              <ChevronRight className="h-4 w-4 rtl:-scale-x-100" />
            </button>
            <span
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30"
              title={`${t("badgeOwner")} — ${t("title")}`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
            </span>
          </div>
        )}
      </div>

      {/* Nav Items (Scrollable) */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1" aria-label="Admin navigation">
        {TAB_CONFIG.map(({ id, icon: Icon, color, activeBg, activeBorder }) => {
          const isActive = activeTab === id;
          const label = t(TAB_LABEL_KEYS[id]);
          const hasBadge = id === "users" && pendingUsers > 0;

          return (
            <button
              key={id}
              type="button"
              onClick={() => onTabChange(id)}
              aria-current={isActive ? "page" : undefined}
              className={`
                w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all duration-150 cursor-pointer
                ${
                  isActive
                    ? `${activeBg} border ${activeBorder} text-[var(--text)]`
                    : "text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)] border border-transparent"
                }
                ${collapsed ? "justify-center" : ""}
              `}
              title={collapsed ? label : undefined}
            >
              <div className="relative shrink-0">
                <Icon className={`h-4 w-4 ${isActive ? color : "text-[var(--text-muted)]"} transition-colors`} />
                {hasBadge && (
                  <span className="absolute -top-1 -end-1 h-2 w-2 rounded-full bg-rose-500 ring-1 ring-[var(--surface)] animate-pulse" />
                )}
              </div>
              {!collapsed && (
                <span className="flex-1 text-start truncate">{label}</span>
              )}
              {!collapsed && hasBadge && (
                <span className="inline-flex items-center justify-center h-4 min-w-4 rounded-full bg-rose-500/15 px-1 text-[9px] font-bold text-rose-400 border border-rose-500/30">
                  {pendingUsers}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer: Return to Profile + Sign Out + Status */}
      <div className="p-2 border-t border-[var(--border)]/50 shrink-0 space-y-1">
        <Link
          href={`/${locale}/profile`}
          className={`
            w-full flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/80 px-2.5 py-1.5 text-xs font-semibold text-[var(--text)] hover:bg-[var(--surface-2)] hover:border-[var(--accent)]/40 hover:text-[var(--accent)] transition-colors
            ${collapsed ? "justify-center" : ""}
          `}
          title={collapsed ? t("backToProfile") : undefined}
        >
          <ArrowLeft className="h-3.5 w-3.5 rtl:-scale-x-100 shrink-0 text-[var(--accent)]" />
          {!collapsed && <span className="truncate">{t("backToProfile")}</span>}
        </Link>

        <button
          type="button"
          onClick={handleSignOut}
          disabled={isLoggingOut}
          className={`
            w-full flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 px-2.5 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 hover:text-rose-200 transition-colors cursor-pointer disabled:opacity-50
            ${collapsed ? "justify-center" : ""}
          `}
          title={collapsed ? tAuth("signOut") : undefined}
        >
          {isLoggingOut ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0 text-rose-400" />
          ) : (
            <LogOut className="h-3.5 w-3.5 rtl:-scale-x-100 shrink-0 text-rose-400" />
          )}
          {!collapsed && <span className="truncate">{tAuth("signOut")}</span>}
        </button>

        {!collapsed && (
          <div className="flex items-center gap-2 px-2 py-1 pt-0.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="text-[10px] text-[var(--text-muted)] truncate">{t("systemOperational")}</span>
          </div>
        )}
      </div>
    </aside>
  );
}
