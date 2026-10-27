"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  Info,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Zap,
  ExternalLink,
  Trash2,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
import type { UserNotification } from "@/lib/db/schema/user-notifications";

interface NotificationItemProps {
  notification: UserNotification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  onClose?: () => void;
}

function getTypeIcon(type: string): { icon: LucideIcon; color: string; bg: string } {
  switch (type.toLowerCase()) {
    case "access_approved":
    case "success":
      return { icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10" };
    case "quota_low":
    case "warning":
    case "maintenance":
      return { icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/10" };
    case "update":
    case "feature":
      return { icon: Sparkles, color: "text-purple-400", bg: "bg-purple-500/10" };
    case "system":
    case "alert":
      return { icon: Zap, color: "text-[var(--accent)]", bg: "bg-[var(--accent)]/10" };
    default:
      return { icon: Info, color: "text-sky-400", bg: "bg-sky-500/10" };
  }
}

function formatTimeAgo(
  date: Date,
  t: (key: string, values?: Record<string, string | number>) => string
): string {
  const now = Date.now();
  const diffSec = Math.floor((now - new Date(date).getTime()) / 1000);

  if (diffSec < 60) return t("justNow");
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return t("minutesAgo", { count: diffMin });
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return t("hoursAgo", { count: diffHours });
  const diffDays = Math.floor(diffHours / 24);
  return t("daysAgo", { count: diffDays });
}

export function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  onClose,
}: NotificationItemProps) {
  const t = useTranslations("notifications");
  const locale = useLocale();
  const [isExpanded, setIsExpanded] = useState(false);
  const isUnread = !notification.readAt;
  const { icon: Icon, color, bg } = getTypeIcon(notification.type);
  const timeStr = formatTimeAgo(notification.createdAt, t);

  const handleToggleExpand = () => {
    if (isUnread) {
      onMarkAsRead(notification.id);
    }
    setIsExpanded((prev) => !prev);
  };

  const handleLinkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isUnread) {
      onMarkAsRead(notification.id);
    }
    if (onClose) {
      onClose();
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(notification.id);
  };

  const formattedDate = new Date(notification.createdAt).toLocaleString(
    locale === "ar" ? "ar-EG" : "en-US",
    {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );

  return (
    <div
      role="button"
      tabIndex={0}
      aria-expanded={isExpanded}
      onClick={handleToggleExpand}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleToggleExpand();
        }
      }}
      className={`group relative flex flex-col p-3.5 transition-colors border-b border-[var(--border)] last:border-b-0 cursor-pointer focus:outline-hidden focus-visible:bg-[var(--surface-2)]/80 ${
        isUnread
          ? "bg-[var(--accent)]/5 hover:bg-[var(--accent)]/10"
          : "hover:bg-[var(--surface-2)]/30 opacity-90 hover:opacity-100"
      }`}
    >
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          {/* Notification Type Icon */}
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/5 ${bg} ${color}`}
          >
            <Icon className="h-4 w-4" />
          </div>

          <div className="flex-1 min-w-0 space-y-1">
            {/* Title & Unread indicator */}
            <div className="flex items-center gap-2">
              <p
                className={`text-xs font-semibold leading-snug text-start ${
                  isUnread
                    ? "text-[var(--text)] font-bold"
                    : "text-[var(--text-muted)]"
                } ${isExpanded ? "" : "line-clamp-2"}`}
              >
                {notification.title}
              </p>
              {isUnread && (
                <span
                  className="h-2 w-2 shrink-0 rounded-full bg-[var(--accent)]"
                  aria-label={t("unread")}
                />
              )}
            </div>

            {/* Notification Body */}
            {notification.body && (
              <p
                className={`leading-relaxed text-start ${
                  isExpanded
                    ? "text-xs text-[var(--text)]/90 whitespace-pre-line pt-1"
                    : "text-[11px] text-[var(--text-muted)] line-clamp-2"
                }`}
              >
                {notification.body}
              </p>
            )}

            {/* Footer with time and link */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1 text-[10px] text-[var(--text-muted)]/80">
              <span title={formattedDate}>{isExpanded ? formattedDate : timeStr}</span>

              {notification.link && (
                notification.link.startsWith("/") ? (
                  <Link
                    href={`/${locale}${notification.link}`}
                    onClick={handleLinkClick}
                    className="inline-flex items-center gap-1 font-semibold text-[var(--accent)] hover:underline focus:outline-hidden"
                  >
                    <span>{t("viewDetails")}</span>
                    <ExternalLink className="h-2.5 w-2.5 rtl:-scale-x-100" />
                  </Link>
                ) : (
                  <a
                    href={notification.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleLinkClick}
                    className="inline-flex items-center gap-1 font-semibold text-[var(--accent)] hover:underline focus:outline-hidden"
                  >
                    <span>{t("viewDetails")}</span>
                    <ExternalLink className="h-2.5 w-2.5 rtl:-scale-x-100" />
                  </a>
                )
              )}
            </div>
          </div>
        </div>

        {/* Action Controls: Expand chevron & Delete button */}
        <div className="flex items-center gap-1 shrink-0 pt-0.5">
          <button
            type="button"
            onClick={handleDelete}
            className="p-1 rounded-md text-[var(--text-muted)] hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer focus:outline-hidden focus-visible:ring-1 focus-visible:ring-rose-400"
            title={t("deleteNotification")}
            aria-label={t("deleteNotification")}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>

          <span
            className="p-1 text-[var(--text-muted)]/70 hover:text-[var(--text)] transition-colors"
            title={isExpanded ? t("collapse") : t("expand")}
            aria-hidden="true"
          >
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform duration-200 ${
                isExpanded ? "rotate-180" : ""
              }`}
            />
          </span>
        </div>
      </div>
    </div>
  );
}
