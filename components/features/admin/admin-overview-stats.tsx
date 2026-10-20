import { useTranslations } from "next-intl";
import { Users, PlayCircle, Layers, Activity } from "lucide-react";
import type { AdminStats } from "@/lib/db/queries/admin";

interface AdminOverviewStatsProps {
  stats: AdminStats;
}

export function AdminOverviewStats({ stats }: AdminOverviewStatsProps) {
  const t = useTranslations("admin.stats");

  const cards = [
    {
      label: t("totalUsers"),
      value: stats.totalUsers,
      subtext: `${stats.pendingUsers} ${t("pendingUsers")}`,
      icon: Users,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
    },
    {
      label: t("activeWorkflows"),
      value: `${stats.activeWorkflows} / ${stats.totalWorkflows}`,
      subtext: stats.activeWorkflows === stats.totalWorkflows ? "All running" : "Some paused",
      icon: Layers,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    {
      label: t("totalRuns"),
      value: stats.totalRuns,
      subtext: "Platform-wide executions",
      icon: PlayCircle,
      color: "text-[var(--accent)]",
      bg: "bg-[var(--accent)]/10",
      border: "border-[var(--accent)]/20",
    },
    {
      label: t("quotaConsumed"),
      value: stats.totalQuotaConsumed,
      subtext: "Total reports generated",
      icon: Activity,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <div
            key={i}
            className="flex items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm"
          >
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${c.border} ${c.bg}`}>
              <Icon className={`h-6 w-6 ${c.color}`} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-[var(--text-muted)] truncate">{c.label}</p>
              <p className="mt-0.5 text-2xl font-bold tracking-tight text-[var(--text)]">{c.value}</p>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5 truncate">{c.subtext}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
