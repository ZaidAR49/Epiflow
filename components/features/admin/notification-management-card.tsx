"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Sparkles, Send, Plus } from "lucide-react";
import type { SystemAnnouncement } from "@/lib/db/schema/system-announcements";
import { AnnouncementTable } from "./announcement-table";
import { AnnouncementModal } from "./announcement-modal";
import { SendNotificationModal } from "./send-notification-modal";
import { DispatchedNotificationsList } from "./dispatched-notifications-list";
import type { AdminCallerRole } from "./admin-shell";

interface NotificationManagementCardProps {
  initialAnnouncements: SystemAnnouncement[];
  callerRole: AdminCallerRole;
}

export function NotificationManagementCard({
  initialAnnouncements,
  callerRole,
}: NotificationManagementCardProps) {
  const t = useTranslations("admin.notifications");
  const [subTab, setSubTab] = useState<"announcements" | "send">("announcements");
  const [announcements, setAnnouncements] = useState<SystemAnnouncement[]>(
    initialAnnouncements
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] =
    useState<SystemAnnouncement | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);

  const canMutate = callerRole === "admin" || callerRole === "editor";

  const handleOpenNew = () => {
    setEditingAnnouncement(null);
    setIsModalOpen(true);
  };

  const handleEdit = (a: SystemAnnouncement) => {
    setEditingAnnouncement(a);
    setIsModalOpen(true);
  };

  const handleSuccess = (updated: SystemAnnouncement) => {
    setAnnouncements((prev) => {
      const exists = prev.some((x) => x.id === updated.id);
      if (exists) {
        return prev.map((x) => (x.id === updated.id ? updated : x));
      }
      return [updated, ...prev];
    });
  };

  return (
    <div className="space-y-6">
      {/* Header card with subtab toggles and action button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <div>
          <h2 className="text-base font-bold text-[var(--text)] mb-1">{t("title")}</h2>
          <p className="text-xs text-[var(--text-muted)] max-w-xl">{t("subtitle")}</p>
        </div>

        {subTab === "announcements" && canMutate && (
          <button
            type="button"
            onClick={handleOpenNew}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[var(--accent)]/90 transition-all shrink-0 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>{t("newAnnouncement")}</span>
          </button>
        )}

        {subTab === "send" && canMutate && (
          <button
            type="button"
            onClick={() => setIsSendModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[var(--accent)]/90 transition-all shrink-0 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>{t("newNotification")}</span>
          </button>
        )}
      </div>

      {/* Sub tabs */}
      <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2">
        <button
          type="button"
          onClick={() => setSubTab("announcements")}
          className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
            subTab === "announcements"
              ? "bg-[var(--accent)]/10 text-[var(--accent)]"
              : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]"
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>{t("announcementsSection")}</span>
          <span className="ms-1 rounded-full bg-[var(--surface-2)] px-1.5 py-0.2 text-[10px] text-[var(--text-muted)] border border-[var(--border)]">
            {announcements.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab("send")}
          className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
            subTab === "send"
              ? "bg-[var(--accent)]/10 text-[var(--accent)]"
              : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]"
          }`}
        >
          <Send className="h-3.5 w-3.5 rtl:-scale-x-100" />
          <span>{t("sendNotificationSection")}</span>
        </button>
      </div>

      {/* Content panel */}
      {subTab === "announcements" && (
        <AnnouncementTable
          announcements={announcements}
          callerRole={callerRole}
          onEdit={handleEdit}
          onRefresh={() => {
            // State is updated optimistically or via revalidation
          }}
        />
      )}

      {subTab === "send" && (
        <div className="space-y-6">
          <DispatchedNotificationsList refreshTrigger={refreshCount} />
        </div>
      )}

      {/* Announcement Modal */}
      <AnnouncementModal
        isOpen={isModalOpen}
        initialData={editingAnnouncement}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
      />

      {/* Send In-App Notification Modal */}
      <SendNotificationModal
        isOpen={isSendModalOpen}
        onClose={() => setIsSendModalOpen(false)}
        onDispatched={() => setRefreshCount((prev) => prev + 1)}
        callerRole={callerRole}
      />
    </div>
  );
}
