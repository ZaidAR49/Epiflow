"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Bell } from "lucide-react";
import { useNotifications } from "@/hooks/use-notifications";
import { NotificationPopover } from "./notification-popover";

interface NotificationBellProps {
  isSignedIn?: boolean;
}

export function NotificationBell({ isSignedIn = false }: NotificationBellProps) {
  const t = useTranslations("notifications");
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const handleClose = React.useCallback(() => setIsOpen(false), []);
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications(isSignedIn);

  if (!isSignedIn) {
    return null;
  }

  const badgeText = unreadCount > 99 ? "99+" : unreadCount.toString();

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={t("title")}
        title={t("title")}
        className={`relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-2)]/60 text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--accent)]/50 hover:bg-[var(--surface-2)] transition-all shadow-xs cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-[var(--accent)] ${
          isOpen ? "border-[var(--accent)] text-[var(--accent)] bg-[var(--surface-2)]" : ""
        }`}
      >
        <Bell className="h-4 w-4" />

        {unreadCount > 0 && (
          <span className="absolute -top-1 -end-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--accent)] px-1 text-[9px] font-bold text-white shadow-xs animate-pulse">
            {badgeText}
          </span>
        )}
      </button>

      <NotificationPopover
        isOpen={isOpen}
        onClose={handleClose}
        notifications={notifications}
        unreadCount={unreadCount}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={markAllAsRead}
        onDelete={deleteNotification}
      />
    </div>
  );
}
