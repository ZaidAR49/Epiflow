"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Eye, Send, CheckCircle2, X, Loader2 } from "lucide-react";
import { getNotificationReachAction } from "@/lib/actions/notifications";
import { getAnnouncementReachAction } from "@/lib/actions/announcements";
import type { NotificationReach } from "@/lib/db/queries/user-notifications";

interface NotificationReachModalProps {
  isOpen: boolean;
  title: string | null;
  announcementId?: string | null;
  onClose: () => void;
}

export function NotificationReachModal({
  isOpen,
  title,
  announcementId,
  onClose,
}: NotificationReachModalProps) {
  const t = useTranslations("admin.notifications");
  const [loading, setLoading] = useState(false);
  const [reach, setReach] = useState<NotificationReach | null>(null);

  useEffect(() => {
    if (!isOpen || (!title && !announcementId)) return;

    let isMounted = true;
    void (async () => {
      setLoading(true);
      try {
        if (announcementId) {
          const res = await getAnnouncementReachAction(announcementId);
          if (!isMounted) return;
          if (res.success && res.reach) {
            setReach(res.reach);
          } else {
            setReach({ title: title || "Announcement", totalSent: 0, totalRead: 0, readRate: 0 });
          }
        } else if (title) {
          const res = await getNotificationReachAction(title);
          if (!isMounted) return;
          if (res.success && res.reach) {
            setReach(res.reach);
          } else {
            setReach({ title, totalSent: 0, totalRead: 0, readRate: 0 });
          }
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
  }, [isOpen, title, announcementId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !title) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reach-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-0 duration-150"
    >
      <div className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)]">
              <Eye className="h-4 w-4" />
            </div>
            <h3 id="reach-modal-title" className="text-sm font-bold text-[var(--text)]">
              {t("reachTitle")}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
            aria-label={t("close")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Target notification title */}
        <div>
          <p className="text-[11px] font-semibold text-[var(--text-muted)] mb-1">
            {t("notificationTitleLabel")}:
          </p>
          <p className="text-xs font-bold text-[var(--text)] rounded-lg bg-[var(--surface-2)] px-3 py-2 border border-[var(--border)] truncate">
            {title}
          </p>
        </div>

        {/* Content: Loading or Stats */}
        {loading ? (
          <div className="flex items-center justify-center py-6 text-[var(--text-muted)] gap-2 text-xs">
            <Loader2 className="h-4 w-4 animate-spin text-[var(--accent)]" />
            <span>{t("loadingReach")}</span>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {/* Total Sent */}
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/50 p-3 text-start">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--text-muted)] mb-1">
                  <Send className="h-3.5 w-3.5 text-[var(--accent)]" />
                  <span>{t("totalSent")}</span>
                </div>
                <p className="text-xl font-bold text-[var(--text)]">
                  {reach?.totalSent ?? 0}
                </p>
              </div>

              {/* Total Read */}
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/50 p-3 text-start">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--text-muted)] mb-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  <span>{t("totalRead")}</span>
                </div>
                <p className="text-xl font-bold text-emerald-400">
                  {reach?.totalRead ?? 0}
                </p>
              </div>
            </div>

            {/* Read Rate Bar */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/30 p-3 space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-[var(--text-muted)]">{t("readRate")}</span>
                <span className="font-bold text-[var(--text)]">{reach?.readRate ?? 0}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-[var(--surface-2)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-400 transition-all duration-300"
                  style={{ width: `${Math.min(100, reach?.readRate ?? 0)}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-1">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-lg bg-[var(--surface-2)] px-4 py-2 text-xs font-semibold text-[var(--text)] hover:bg-[var(--surface-2)]/80 transition-colors border border-[var(--border)] cursor-pointer"
          >
            {t("close")}
          </button>
        </div>
      </div>
    </div>
  );
}
