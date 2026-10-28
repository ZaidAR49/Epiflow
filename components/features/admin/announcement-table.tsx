"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Edit2,
  Trash2,
  Power,
  Sparkles,
  Wrench,
  MessageSquare,
  FileText,
  AlertOctagon,
  AlertTriangle,
  Info,
  Eye,
} from "lucide-react";
import type { SystemAnnouncement } from "@/lib/db/schema/system-announcements";
import {
  deleteAnnouncementAction,
  toggleAnnouncementActiveAction,
} from "@/lib/actions/announcements";
import { useToast } from "@/hooks/use-toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { NotificationReachModal } from "./notification-reach-modal";
import type { AdminCallerRole } from "./admin-shell";

interface AnnouncementTableProps {
  announcements: SystemAnnouncement[];
  callerRole: AdminCallerRole;
  onEdit: (announcement: SystemAnnouncement) => void;
  onRefresh: () => void;
}

function TableTypeIcon({ type, className }: { type: string; className: string }) {
  switch (type) {
    case "update":
      return <Sparkles className={className} />;
    case "maintenance":
      return <Wrench className={className} />;
    case "changelog":
      return <FileText className={className} />;
    default:
      return <MessageSquare className={className} />;
  }
}

function TableSeverityIcon({ severity, className }: { severity: string; className: string }) {
  switch (severity) {
    case "critical":
      return <AlertOctagon className={className} />;
    case "warning":
      return <AlertTriangle className={className} />;
    case "info":
    default:
      return <Info className={className} />;
  }
}

function getSeverityBadge(severity: string): { label: string; cls: string } {
  switch (severity) {
    case "critical":
      return {
        label: "Critical",
        cls: "bg-rose-500/15 text-rose-400 border-rose-500/30",
      };
    case "warning":
      return {
        label: "Warning",
        cls: "bg-amber-500/15 text-amber-400 border-amber-500/30",
      };
    case "info":
    default:
      return {
        label: "Info",
        cls: "bg-sky-500/15 text-sky-400 border-sky-500/30",
      };
  }
}

export function AnnouncementTable({
  announcements,
  callerRole,
  onEdit,
  onRefresh,
}: AnnouncementTableProps) {
  const t = useTranslations("admin.notifications");
  const toast = useToast();
  const [deleteTarget, setDeleteTarget] = useState<SystemAnnouncement | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [reachTarget, setReachTarget] = useState<{ id: string; title: string } | null>(null);
  const canMutate = callerRole === "admin" || callerRole === "editor";

  const handleToggle = async (a: SystemAnnouncement) => {
    if (!canMutate) {
      toast.error(t("viewerRestricted"));
      return;
    }
    const res = await toggleAnnouncementActiveAction({
      id: a.id,
      isActive: !a.isActive,
    });
    if (res.success) {
      toast.success(t("announcementSaved"));
      onRefresh();
    } else {
      toast.error(res.error || "Failed to update announcement");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    if (!canMutate) {
      toast.error(t("viewerRestricted"));
      return;
    }

    setIsDeleting(true);
    const res = await deleteAnnouncementAction({ id: deleteTarget.id });
    setIsDeleting(false);

    if (res.success) {
      toast.success(t("announcementDeleted"));
      setDeleteTarget(null);
      onRefresh();
    } else {
      toast.error(res.error || "Failed to delete announcement");
    }
  };

  if (announcements.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/30 p-8 text-center text-xs text-[var(--text-muted)]">
        {t("noAnnouncements")}
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
        <table className="w-full text-start text-xs">
          <thead className="bg-[var(--surface-2)]/70 text-[var(--text-muted)] border-b border-[var(--border)] uppercase text-[10px] tracking-wider font-semibold">
            <tr>
              <th className="px-4 py-3 text-start">{t("thKind")}</th>
              <th className="px-4 py-3 text-start">{t("thTitleAr")}</th>
              <th className="px-4 py-3 text-start">{t("thTitleEn")}</th>
              <th className="px-4 py-3 text-start">{t("thStatus")}</th>
              <th className="px-4 py-3 text-end">{t("thActions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)] bg-[var(--surface)] text-[var(--text)]">
            {announcements.map((a) => {
              const severity = getSeverityBadge(a.severity);

              return (
                <tr key={a.id} className="hover:bg-[var(--surface-2)]/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 rounded-md bg-[var(--surface-2)] px-2 py-0.5 text-[10px] font-semibold border border-[var(--border)]">
                        <TableTypeIcon type={a.type} className="h-3 w-3 text-purple-400" />
                        <span>{a.type}</span>
                      </span>
                      <span
                        className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold border ${severity.cls}`}
                      >
                        <TableSeverityIcon severity={a.severity} className="h-3 w-3" />
                        <span>{severity.label}</span>
                      </span>
                    </div>
                  </td>

                  <td className="px-4 py-3 text-start max-w-xs truncate font-medium" dir="rtl">
                    {a.titleAr || "—"}
                  </td>

                  <td className="px-4 py-3 text-start max-w-xs truncate font-medium" dir="ltr">
                    {a.titleEn || "—"}
                  </td>

                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => handleToggle(a)}
                      disabled={!canMutate}
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold border transition-colors ${
                        a.isActive
                          ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25"
                          : "bg-slate-500/15 text-[var(--text-muted)] border-[var(--border)] hover:bg-slate-500/25"
                      } ${!canMutate ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
                    >
                      <Power className="h-2.5 w-2.5" />
                      <span>{a.isActive ? t("activeStatus") : t("inactiveStatus")}</span>
                    </button>
                  </td>

                  <td className="px-4 py-3 text-end">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          setReachTarget({
                            id: a.id,
                            title: a.titleEn || a.titleAr || "Announcement",
                          })
                        }
                        className="rounded-lg p-1.5 text-sky-400 hover:text-sky-300 hover:bg-sky-500/10 transition-colors cursor-pointer"
                        title={t("viewReach")}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onEdit(a)}
                        disabled={!canMutate}
                        className="rounded-lg p-1.5 text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors disabled:opacity-40 cursor-pointer"
                        title={t("editAnnouncement")}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(a)}
                        disabled={!canMutate}
                        className="rounded-lg p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors disabled:opacity-40 cursor-pointer"
                        title={t("deleteAnnouncement")}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <NotificationReachModal
        isOpen={Boolean(reachTarget)}
        title={reachTarget?.title ?? null}
        announcementId={reachTarget?.id ?? null}
        onClose={() => setReachTarget(null)}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title={t("deleteAnnouncement")}
        description={t("confirmDeleteAnnouncement")}
        confirmLabel={t("deleteAnnouncement")}
        cancelLabel={t("cancel")}
        variant="danger"
        isPending={isDeleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </>
  );
}
