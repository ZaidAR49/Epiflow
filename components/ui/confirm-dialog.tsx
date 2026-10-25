"use client";

import React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { AlertTriangle, ShieldAlert, Loader2, X } from "lucide-react";

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "primary";
  isPending?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "primary",
  isPending = false,
}: ConfirmDialogProps) {
  const variantIcons = {
    danger: <AlertTriangle className="h-6 w-6 text-rose-400" />,
    warning: <AlertTriangle className="h-6 w-6 text-amber-400" />,
    primary: <ShieldAlert className="h-6 w-6 text-[var(--accent)]" />,
  };

  const btnStyles = {
    danger: "bg-rose-600 hover:bg-rose-500 text-white focus-visible:ring-rose-400 shadow-rose-900/30",
    warning: "bg-amber-600 hover:bg-amber-500 text-white focus-visible:ring-amber-400 shadow-amber-900/30",
    primary: "bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white focus-visible:ring-[var(--accent)] shadow-indigo-900/30",
  };

  const iconContainers = {
    danger: "border-rose-500/20 bg-rose-500/10",
    warning: "border-amber-500/20 bg-amber-500/10",
    primary: "border-[var(--accent)]/20 bg-[var(--accent)]/10",
  };

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => !open && !isPending && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs transition-opacity duration-200 animate-in fade-in" />
        <DialogPrimitive.Content
          className="fixed top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl animate-in zoom-in-95 duration-200 focus:outline-hidden"
          onPointerDownOutside={(e) => isPending && e.preventDefault()}
          onEscapeKeyDown={(e) => isPending && e.preventDefault()}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${iconContainers[variant]}`}
              >
                {variantIcons[variant]}
              </div>
              <div>
                <DialogPrimitive.Title className="text-sm font-bold text-[var(--text)]">
                  {title}
                </DialogPrimitive.Title>
              </div>
            </div>
            <DialogPrimitive.Close
              disabled={isPending}
              onClick={onClose}
              className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)] transition-colors focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:outline-hidden disabled:opacity-40"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </DialogPrimitive.Close>
          </div>

          <DialogPrimitive.Description className="mt-4 text-xs leading-relaxed text-[var(--text-muted)]">
            {description}
          </DialogPrimitive.Description>

          <div className="mt-6 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/80 px-4 py-2 text-xs font-semibold text-[var(--text)] hover:bg-[var(--surface-2)] hover:border-[var(--accent)]/40 transition-colors focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:outline-hidden disabled:opacity-50"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isPending}
              className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold shadow-md transition-all focus-visible:ring-2 focus-visible:outline-hidden disabled:opacity-50 cursor-pointer ${btnStyles[variant]}`}
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{confirmLabel}</span>
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
