"use client";

import React, { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Users, Search } from "lucide-react";
import type { AdminUserItem } from "@/lib/db/queries/admin";
import {
  updateUserStatusAction,
  updateUserQuotaAction,
  deleteUserAction,
} from "@/lib/actions/admin";
import { UserActionDialog, type UserActionDialogProps } from "./user-action-dialog";
import { UserQuotaModal } from "./user-quota-modal";
import { UserTableRow, type ActionType } from "./user-table-row";
import { useToast } from "@/hooks/use-toast";
import type { AdminCallerRole } from "./admin-shell";

interface UserManagementTableProps {
  users: AdminUserItem[];
  currentUserId: string;
  callerRole: AdminCallerRole;
}

interface PendingAction {
  type: ActionType;
  user: AdminUserItem;
}

export function UserManagementTable({ users, currentUserId, callerRole }: UserManagementTableProps) {
  const t = useTranslations("admin.users");
  const tCommon = useTranslations("common");
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [quotaUser, setQuotaUser] = useState<AdminUserItem | null>(null);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ msg: string; err?: boolean } | null>(null);

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.fullName.toLowerCase().includes(q) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.username && u.username.toLowerCase().includes(q))
    );
  });

  const handleExecuteAction = () => {
    if (!pendingAction) return;
    const { type, user } = pendingAction;

    startTransition(async () => {
      let res;
      if (type === "approve" || type === "unlock") {
        res = await updateUserStatusAction({ userId: user.id, status: "approved" });
      } else if (type === "lock") {
        res = await updateUserStatusAction({ userId: user.id, status: "locked" });
      } else if (type === "reject") {
        res = await updateUserStatusAction({ userId: user.id, status: "rejected" });
      } else if (type === "promote") {
        res = await updateUserStatusAction({ userId: user.id, role: "admin" });
      } else if (type === "demote") {
        res = await updateUserStatusAction({ userId: user.id, role: "user" });
      } else if (type === "delete") {
        res = await deleteUserAction({ userId: user.id });
      }

      setPendingAction(null);
      if (res?.success) {
        const msg = type === "delete" ? t("userDeleted") : t("statusSaved");
        setFeedback({ msg });
        toast.success(msg);
      } else {
        const err = res?.error || "Action failed";
        setFeedback({ msg: err, err: true });
        toast.error(tCommon("error"), err);
      }
    });
  };

  const handleSaveQuota = (userId: string, newLimit: number | null, resetCount: boolean) => {
    startTransition(async () => {
      const res = await updateUserQuotaAction({
        userId,
        workflowSlug: "job-xray",
        usageLimit: newLimit,
        resetCount,
      });
      setQuotaUser(null);
      if (res.success) {
        setFeedback({ msg: t("quotaSaved") });
        toast.success(t("quotaSaved"));
      } else {
        const err = res.error || "Failed";
        setFeedback({ msg: err, err: true });
        toast.error(tCommon("error"), err);
      }
    });
  };

  const getDialogConfig = (): {
    title: string;
    description: string;
    variant: UserActionDialogProps["variant"];
    confirmLabel: string;
  } => {
    if (!pendingAction) {
      return { title: "", description: "", variant: "primary", confirmLabel: "" };
    }
    const name = pendingAction.user.fullName;
    switch (pendingAction.type) {
      case "approve":
        return {
          title: t("confirmTitle"),
          description: t("confirmApprove", { name }),
          variant: "success",
          confirmLabel: t("approve"),
        };
      case "lock":
        return {
          title: t("confirmTitle"),
          description: t("confirmLock", { name }),
          variant: "warn",
          confirmLabel: t("lock"),
        };
      case "unlock":
        return {
          title: t("confirmTitle"),
          description: t("confirmUnlock", { name }),
          variant: "success",
          confirmLabel: t("unlock"),
        };
      case "reject":
        return {
          title: t("confirmTitle"),
          description: `Reject account request for ${name}?`,
          variant: "danger",
          confirmLabel: t("reject"),
        };
      case "promote":
        return {
          title: t("confirmTitle"),
          description: t("confirmPromoteAdmin", { name }),
          variant: "primary",
          confirmLabel: t("makeAdmin"),
        };
      case "demote":
        return {
          title: t("confirmTitle"),
          description: t("confirmDemoteUser", { name }),
          variant: "warn",
          confirmLabel: t("removeAdmin"),
        };
      case "delete":
        return {
          title: t("confirmTitle"),
          description: t("confirmDelete", { name }),
          variant: "danger",
          confirmLabel: t("delete"),
        };
    }
  };

  const dialogConfig = getDialogConfig();

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--border)] pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[var(--text)]">{t("title")}</h2>
            <p className="text-xs text-[var(--text-muted)]">{t("subtitle")}</p>
          </div>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute start-3 top-2.5 h-4 w-4 text-[var(--text-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] ps-9 pe-3 py-1.5 text-xs text-[var(--text)] focus:border-[var(--accent)] focus:outline-none"
          />
        </div>
      </div>

      {feedback && (
        <p className={`mt-3 text-xs ${feedback.err ? "text-rose-400" : "text-emerald-400"}`}>
          {feedback.msg}
        </p>
      )}

      {/* High-Clarity Table */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-start text-xs">
          <thead>
            <tr className="border-b border-[var(--border)] text-[var(--text-muted)]">
              <th className="pb-3 text-start font-medium">{t("thUser")}</th>
              <th className="pb-3 text-start font-medium">{t("thRole")}</th>
              <th className="pb-3 text-start font-medium">{t("thStatus")}</th>
              <th className="pb-3 text-start font-medium">{t("thQuota")}</th>
              <th className="pb-3 text-end font-medium">{t("thActions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]/50">
            {filteredUsers.map((u) => (
              <UserTableRow
                key={u.id}
                user={u}
                isSelf={u.id === currentUserId}
                callerRole={callerRole}
                onAction={(type, user) => setPendingAction({ type, user })}
                onOpenQuota={(user) => setQuotaUser(user)}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Confirmation Dialog */}
      <UserActionDialog
        isOpen={pendingAction !== null}
        onClose={() => setPendingAction(null)}
        onConfirm={handleExecuteAction}
        title={dialogConfig.title}
        description={dialogConfig.description}
        confirmLabel={dialogConfig.confirmLabel}
        cancelLabel={t("confirmCancel")}
        variant={dialogConfig.variant}
        isPending={isPending}
      />

      {/* Quota Modal */}
      {quotaUser && (
        <UserQuotaModal
          key={quotaUser.id}
          user={quotaUser}
          onClose={() => setQuotaUser(null)}
          onSave={handleSaveQuota}
          isPending={isPending}
        />
      )}
    </div>
  );
}
