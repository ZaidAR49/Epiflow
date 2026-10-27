"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Eye, Bell, RefreshCw } from "lucide-react";
import { getRecentDispatchedNotificationsAction } from "@/lib/actions/notifications";
import type { DispatchedNotificationSummary } from "@/lib/db/queries/user-notifications";
import { NotificationReachModal } from "./notification-reach-modal";

interface DispatchedNotificationsListProps {
  refreshTrigger?: number;
}

export function DispatchedNotificationsList({
  refreshTrigger = 0,
}: DispatchedNotificationsListProps) {
  const t = useTranslations("admin.notifications");
  const [items, setItems] = useState<DispatchedNotificationSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [reachTarget, setReachTarget] = useState<string | null>(null);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const res = await getRecentDispatchedNotificationsAction();
      if (res.success && res.items) {
        setItems(res.items);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    void (async () => {
      setLoading(true);
      try {
        const res = await getRecentDispatchedNotificationsAction();
        if (!isMounted) return;
        if (res.success && res.items) {
          setItems(res.items);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [refreshTrigger]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-[var(--accent)]" />
          <h3 className="text-xs font-bold text-[var(--text)]">
            {t("recentDispatchedTitle")}
          </h3>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={loading}
          className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors disabled:opacity-40 cursor-pointer"
          title={t("refresh")}
        >
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin text-[var(--accent)]" : ""}`} />
        </button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/30 p-4 text-center text-xs text-[var(--text-muted)]">
          {t("noDispatchedYet")}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {items.map((item, idx) => (
            <div
              key={`${item.title}-${idx}`}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/40 p-3.5 flex flex-col justify-between gap-3 hover:border-[var(--accent)]/40 transition-colors"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-block rounded-md bg-[var(--surface-2)] px-2 py-0.5 text-[10px] font-bold text-[var(--accent)] border border-[var(--border)]">
                    {item.type}
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)]">
                    {new Date(item.lastSentAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs font-semibold text-[var(--text)] truncate" title={item.title}>
                  {item.title}
                </p>
              </div>

              {/* Eye Button for Quick Reach Stats */}
              <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]/60 text-xs">
                <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
                  <span>{t("totalSent")}: <strong className="text-[var(--text)]">{item.totalSent}</strong></span>
                  <span>•</span>
                  <span>{t("totalRead")}: <strong className="text-emerald-400">{item.totalRead}</strong></span>
                </div>
                <button
                  type="button"
                  onClick={() => setReachTarget(item.title)}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-sky-400 hover:bg-sky-500/10 transition-colors cursor-pointer"
                  title={t("viewReach")}
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>{t("viewReach")}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <NotificationReachModal
        isOpen={Boolean(reachTarget)}
        title={reachTarget}
        onClose={() => setReachTarget(null)}
      />
    </div>
  );
}
