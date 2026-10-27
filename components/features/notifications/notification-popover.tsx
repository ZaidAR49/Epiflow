"use client";

import React, { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { CheckCheck, Bell } from "lucide-react";
import type { UserNotification } from "@/lib/db/schema/user-notifications";
import { NotificationItem } from "./notification-item";
import { NotificationEmptyState } from "./notification-empty-state";

interface NotificationPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: UserNotification[];
  unreadCount: number;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDelete: (id: string) => void;
}

export function NotificationPopover({
  isOpen,
  onClose,
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
}: NotificationPopoverProps) {
  const t = useTranslations("notifications");
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on Escape and handle outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={popoverRef}
      role="dialog"
      aria-label={t("title")}
      aria-modal="false"
      className="absolute end-0 top-full mt-2 z-50 w-80 sm:w-96 max-w-[calc(100vw-2rem)] rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl shadow-black/40 backdrop-blur-xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3 bg-[var(--surface-2)]/50">
        <div className="flex items-center gap-2 min-w-0">
          <Bell className="h-4 w-4 text-[var(--accent)] shrink-0" />
          <h3 className="text-xs font-bold text-[var(--text)] tracking-tight truncate">
            {t("title")}
          </h3>
          {unreadCount > 0 && (
            <span className="inline-flex items-center justify-center rounded-full bg-[var(--accent)]/15 px-2 py-0.5 text-[10px] font-bold text-[var(--accent)] border border-[var(--accent)]/30">
              {unreadCount}
            </span>
          )}
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={onMarkAllAsRead}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface)] transition-colors focus:outline-hidden focus:ring-1 focus:ring-[var(--accent)]"
            title={t("markAllRead")}
          >
            <CheckCheck className="h-3 w-3 text-emerald-400" />
            <span>{t("markAllRead")}</span>
          </button>
        )}
      </div>

      {/* Notifications scroll list */}
      <div className="max-h-96 overflow-y-auto divide-y divide-[var(--border)] focus:outline-hidden">
        {notifications.length === 0 ? (
          <NotificationEmptyState />
        ) : (
          notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkAsRead={onMarkAsRead}
              onDelete={onDelete}
              onClose={onClose}
            />
          ))
        )}
      </div>
    </div>
  );
}
