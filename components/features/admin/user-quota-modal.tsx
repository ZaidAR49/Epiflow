"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Sliders, X, Save } from "lucide-react";
import type { AdminUserItem } from "@/lib/db/queries/admin";

export interface UserQuotaModalProps {
  user: AdminUserItem | null;
  onClose: () => void;
  onSave: (userId: string, newLimit: number | null, resetCount: boolean) => void;
  isPending?: boolean;
}

export function UserQuotaModal({
  user,
  onClose,
  onSave,
  isPending = false,
}: UserQuotaModalProps) {
  const t = useTranslations("admin.users");
  const [newLimit, setNewLimit] = useState<string>(() =>
    user?.usageLimit !== null && user?.usageLimit !== undefined
      ? String(user.usageLimit)
      : ""
  );
  const [resetCount, setResetCount] = useState<boolean>(false);

  useEffect(() => {
    if (!user) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isPending) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [user, isPending, onClose]);

  if (!user) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = newLimit.trim() === "" ? null : parseInt(newLimit, 10);
    onSave(user.id, Number.isNaN(parsed) ? null : parsed, resetCount);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-quota-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div className="w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)]/15 text-[var(--accent)]">
              <Sliders className="h-4 w-4" />
            </div>
            <div>
              <h3 id="user-quota-modal-title" className="text-xs font-bold text-[var(--text)]">
                {t("adjustQuota")}
              </h3>
              <p className="text-[11px] text-[var(--text-muted)] truncate max-w-[200px]">
                {user.fullName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded p-1 text-[var(--text-muted)] hover:text-[var(--text)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:outline-hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="quota-limit-input" className="block text-xs font-medium text-[var(--text-muted)]">
              {t("scanLimitLabel", { unlimited: t("unlimited") })}
            </label>
            <input
              id="quota-limit-input"
              type="number"
              min="0"
              value={newLimit}
              onChange={(e) => setNewLimit(e.target.value)}
              placeholder={t("quotaPlaceholder")}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--text)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/50 p-2.5">
            <input
              type="checkbox"
              id="resetCounterModal"
              checked={resetCount}
              onChange={(e) => setResetCount(e.target.checked)}
              className="rounded border-[var(--border)] accent-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            />
            <label htmlFor="resetCounterModal" className="text-xs text-[var(--text)] cursor-pointer">
              {t("resetQuotaDesc")}
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="rounded-lg border border-[var(--border)] px-3.5 py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:outline-hidden"
            >
              {t("confirmCancel")}
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[var(--accent)]/90 focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:outline-hidden disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{isPending ? t("savingQuota") : t("saveQuota")}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
