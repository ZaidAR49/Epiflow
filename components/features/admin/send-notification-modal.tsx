"use client";

import React, { useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { X, Send } from "lucide-react";
import { SendNotificationForm } from "./send-notification-form";
import type { AdminCallerRole } from "./admin-shell";

interface SendNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDispatched?: () => void;
  callerRole: AdminCallerRole;
}

export function SendNotificationModal({
  isOpen,
  onClose,
  onDispatched,
  callerRole,
}: SendNotificationModalProps) {
  if (!isOpen) return null;

  return (
    <SendNotificationModalContent
      onClose={onClose}
      onDispatched={onDispatched}
      callerRole={callerRole}
    />
  );
}

function SendNotificationModalContent({
  onClose,
  onDispatched,
  callerRole,
}: Omit<SendNotificationModalProps, "isOpen">) {
  const t = useTranslations("admin.notifications");

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const handleDispatched = () => {
    onDispatched?.();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-0"
      role="dialog"
      aria-modal="true"
      aria-labelledby="send-notification-modal-title"
    >
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border)] mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20">
              <Send className="h-5 w-5 rtl:-scale-x-100" />
            </div>
            <div>
              <h3 id="send-notification-modal-title" className="text-sm font-bold text-[var(--text)]">
                {t("newNotification")}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
            aria-label={t("close")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <SendNotificationForm
          callerRole={callerRole}
          onDispatched={handleDispatched}
          onCancel={onClose}
        />
      </div>
    </div>
  );
}
