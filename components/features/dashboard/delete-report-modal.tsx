"use client";

import React, { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Trash2, AlertTriangle, Loader2, X } from "lucide-react";

interface DeleteReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
  roleTitle?: string;
  companyName?: string;
}

export function DeleteReportModal({
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
  roleTitle,
  companyName,
}: DeleteReportModalProps) {
  const t = useTranslations("dashboard");

  // Handle Escape key and body scroll lock
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isDeleting) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isDeleting, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-report-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity"
        onClick={() => {
          if (!isDeleting) onClose();
        }}
        aria-hidden="true"
      />

      {/* Modal Dialog Content */}
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-rose-500/30 bg-[var(--surface)] p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
        {/* Header Icon & Close */}
        <div className="flex items-start justify-between">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <Trash2 className="h-5 w-5" />
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:outline-hidden transition-colors disabled:opacity-50"
            aria-label={t("cancel")}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-2 text-start">
          <h3 id="delete-report-title" className="text-base font-bold text-[var(--text)]">
            {t("deleteConfirmTitle")}
          </h3>

          {(roleTitle || companyName) && (
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/60 px-3 py-2 text-xs font-semibold text-[var(--text)] truncate">
              {roleTitle} {companyName ? `• ${companyName}` : ""}
            </div>
          )}

          <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-300">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
            <p className="leading-relaxed">{t("deleteConfirmDesc")}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="inline-flex items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2.5 text-xs font-semibold text-[var(--text)] hover:bg-[var(--surface-2)]/80 focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:outline-hidden transition-colors disabled:opacity-50"
          >
            {t("cancel")}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-rose-600/20 hover:bg-rose-700 focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:outline-hidden transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{t("deleting")}</span>
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                <span>{t("confirmDelete")}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
