"use client";

import React from "react";
import { useTranslations } from "next-intl";
import {
  CheckCircle2,
  Lock,
  Unlock,
  ShieldCheck,
  ShieldAlert,
  Sliders,
  XCircle,
  Trash2,
  Send,
} from "lucide-react";
import type { AdminUserItem } from "@/lib/db/queries/admin";

import type { AdminCallerRole } from "./admin-shell";

export type ActionType =
  | "approve"
  | "lock"
  | "unlock"
  | "reject"
  | "promote"
  | "demote"
  | "delete";

interface UserTableRowProps {
  user: AdminUserItem;
  isSelf: boolean;
  callerRole: AdminCallerRole;
  onAction: (type: ActionType, user: AdminUserItem) => void;
  onOpenQuota: (user: AdminUserItem) => void;
}

export function UserTableRow({
  user: u,
  isSelf,
  callerRole,
  onAction,
  onOpenQuota,
}: UserTableRowProps) {
  const t = useTranslations("admin.users");

  return (
    <tr className="hover:bg-[var(--surface-2)]/30 transition-colors">
      <td className="py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--surface-2)] font-semibold text-[var(--text)] border border-[var(--border)]">
            {u.fullName.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-[var(--text)]">
              {u.fullName} {isSelf && <span className="text-[10px] text-[var(--accent)]">(You)</span>}
            </p>
            <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)] flex-wrap">
              <span>{u.email ?? "No email"}</span>
              {u.telegramId && (
                <span
                  className="inline-flex items-center gap-1 rounded bg-sky-500/10 px-1.5 py-0.5 text-[10px] font-medium text-sky-400 border border-sky-500/20"
                  dir="ltr"
                  title="Telegram Connected"
                >
                  <Send className="h-2.5 w-2.5" />
                  {u.username ? `@${u.username}` : u.telegramId}
                </span>
              )}
            </div>
          </div>
        </div>
      </td>

      {/* Role */}
      <td className="py-3">
        <span
          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium border ${
            u.role === "admin"
              ? "bg-[var(--accent)]/15 text-[var(--accent)] border-[var(--accent)]/30"
              : "bg-[var(--surface-2)] text-[var(--text-muted)] border-[var(--border)]"
          }`}
        >
          {u.role === "admin" && <ShieldCheck className="h-3 w-3" />}
          {u.role === "admin" ? t("roleAdmin") : t("roleUser")}
        </span>
      </td>

      {/* Status */}
      <td className="py-3">
        <span
          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium border ${
            u.status === "approved"
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              : u.status === "pending"
              ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
              : "bg-rose-500/10 text-rose-400 border-rose-500/20"
          }`}
        >
          {u.status === "approved"
            ? t("statusApproved")
            : u.status === "pending"
            ? t("statusPending")
            : u.status === "locked"
            ? t("statusLocked")
            : t("statusRejected")}
        </span>
      </td>

      {/* Quota Button — hidden for viewers */}
      <td className="py-3 text-[var(--text)]">
        {callerRole !== "viewer" && (
          <button
            type="button"
            onClick={() => onOpenQuota(u)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/60 px-2.5 py-1 text-xs text-[var(--text)] hover:border-[var(--accent)] transition-colors"
            title={t("adjustQuota")}
          >
            <Sliders className="h-3 w-3 text-[var(--accent)]" />
            <span>
              {u.usageCount} / {u.usageLimit !== null ? u.usageLimit : t("unlimited")}
            </span>
          </button>
        )}
        {callerRole === "viewer" && (
          <span className="text-xs text-[var(--text-muted)]">
            {u.usageCount} / {u.usageLimit !== null ? u.usageLimit : t("unlimited")}
          </span>
        )}
      </td>

      {/* Actions — conditional by callerRole */}
      <td className="py-3 text-end">
        <div className="inline-flex items-center gap-1.5 flex-wrap justify-end">
          {/* Approval Actions — admin + editor (editor cannot act on admins) */}
          {callerRole !== "viewer" && u.status === "pending" && (callerRole === "admin" || u.role !== "admin") && (
            <>
              <button
                type="button"
                onClick={() => onAction("approve", u)}
                className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500/25 transition-colors"
              >
                <CheckCircle2 className="h-3 w-3" />
                <span>{t("approve")}</span>
              </button>
              <button
                type="button"
                onClick={() => onAction("reject", u)}
                className="inline-flex items-center gap-1 rounded-md bg-rose-500/15 border border-rose-500/30 px-2.5 py-1 text-[11px] font-semibold text-rose-300 hover:bg-rose-500/25 transition-colors"
              >
                <XCircle className="h-3 w-3" />
                <span>{t("reject")}</span>
              </button>
            </>
          )}

          {/* Unlock — admin + editor (editor cannot act on admins) */}
          {callerRole !== "viewer" && u.status === "locked" && (callerRole === "admin" || u.role !== "admin") && (
            <button
              type="button"
              onClick={() => onAction("unlock", u)}
              className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500/25 transition-colors"
            >
              <Unlock className="h-3 w-3" />
              <span>{t("unlock")}</span>
            </button>
          )}

          {/* Lock — admin + editor (editor cannot act on admins) */}
          {callerRole !== "viewer" && u.status === "approved" && !isSelf && (callerRole === "admin" || u.role !== "admin") && (
            <button
              type="button"
              onClick={() => onAction("lock", u)}
              className="inline-flex items-center gap-1.5 rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-300 hover:bg-amber-500/20 transition-colors"
            >
              <Lock className="h-3 w-3" />
              <span>{t("lock")}</span>
            </button>
          )}

          {/* Promote / Demote — admin only */}
          {callerRole === "admin" && !isSelf && (
            <button
              type="button"
              onClick={() => onAction(u.role === "admin" ? "demote" : "promote", u)}
              className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1 text-[11px] font-medium text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--accent)] transition-colors"
            >
              {u.role === "admin" ? (
                <>
                  <ShieldAlert className="h-3 w-3 text-amber-400" />
                  <span>{t("removeAdmin")}</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-3 w-3 text-[var(--accent)]" />
                  <span>{t("makeAdmin")}</span>
                </>
              )}
            </button>
          )}

          {/* Delete — admin only */}
          {callerRole === "admin" && (
            <button
              type="button"
              onClick={() => onAction("delete", u)}
              className="inline-flex items-center gap-1.5 rounded-md border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-[11px] font-semibold text-rose-300 hover:bg-rose-500/20 transition-colors"
              title="Delete User"
            >
              <Trash2 className="h-3 w-3" />
              <span className="hidden xl:inline">{t("delete")}</span>
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
