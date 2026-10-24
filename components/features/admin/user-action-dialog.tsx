"use client";

import React, { useEffect } from "react";
import { AlertTriangle, ShieldAlert, CheckCircle2, Lock, X } from "lucide-react";

export interface UserActionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  variant?: "danger" | "warn" | "primary" | "success";
  isPending?: boolean;
}

export function UserActionDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  cancelLabel,
  variant = "primary",
  isPending = false,
}: UserActionDialogProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isPending) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isPending, onClose]);

  if (!isOpen) return null;

  const icons = {
    danger: <AlertTriangle className="h-6 w-6 text-rose-400" />,
    warn: <Lock className="h-6 w-6 text-amber-400" />,
    success: <CheckCircle2 className="h-6 w-6 text-emerald-400" />,
    primary: <ShieldAlert className="h-6 w-6 text-[var(--accent)]" />,
  };

  const btnStyles = {
    danger: "bg-rose-600 hover:bg-rose-500 text-white focus-visible:ring-rose-400",
    warn: "bg-amber-600 hover:bg-amber-500 text-white focus-visible:ring-amber-400",
    success: "bg-emerald-600 hover:bg-emerald-500 text-white focus-visible:ring-emerald-400",
    primary: "bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white focus-visible:ring-[var(--accent)]",
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-action-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-2)]">
              {icons[variant]}
            </div>
            <div>
              <h3 id="user-action-dialog-title" className="text-sm font-bold text-[var(--text)]">
                {title}
              </h3>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">Confirmation Required</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            aria-label="Close"
            className="rounded-lg p-1 text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:outline-hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-4 text-xs leading-relaxed text-[var(--text)]">{description}</p>

        <div className="mt-6 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2 text-xs font-medium text-[var(--text)] hover:bg-[var(--surface)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:outline-hidden transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className={`rounded-lg px-4 py-2 text-xs font-semibold shadow-sm transition-colors disabled:opacity-50 focus-visible:ring-2 focus-visible:outline-hidden ${btnStyles[variant]}`}
          >
            {isPending ? "Processing..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
