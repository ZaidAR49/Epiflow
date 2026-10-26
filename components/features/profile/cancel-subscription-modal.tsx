"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  ShieldAlert,
  X,
  AlertTriangle,
  CreditCard,
  Ban,
  Clock,
  Loader2,
} from "lucide-react";

interface CancelSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isCanceling: boolean;
  planName: string;
}

export function CancelSubscriptionModal({
  isOpen,
  onClose,
  onConfirm,
  isCanceling,
  planName,
}: CancelSubscriptionModalProps) {
  const t = useTranslations("profile");
  const [hasAcknowledged, setHasAcknowledged] = useState(false);

  const handleClose = React.useCallback(() => {
    if (isCanceling) return;
    setHasAcknowledged(false);
    onClose();
  }, [isCanceling, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isCanceling) {
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isCanceling, handleClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cancel-modal-title"
      aria-describedby="cancel-modal-description"
    >
      <div className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-2xl border border-rose-500/30 bg-[var(--surface)] p-6 sm:p-8 shadow-2xl text-start space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[var(--border)] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <h2
                id="cancel-modal-title"
                className="text-lg sm:text-xl font-extrabold text-[var(--text)] tracking-tight"
              >
                {t("cancelModalTitle")}
              </h2>
              <p
                id="cancel-modal-description"
                className="text-xs text-[var(--text-muted)] mt-0.5"
              >
                {t("cancelModalSubtitle")}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={isCanceling}
            aria-label="Close"
            className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 4 Strict Warning Cards */}
        <div className="space-y-3">
          {/* 1. Immediate Quota Downgrade */}
          <div className="flex items-start gap-3 rounded-xl border border-rose-500/20 bg-rose-500/5 p-3.5">
            <Ban className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5 text-xs">
              <h3 className="font-bold text-rose-300">
                {t("cancelWarn1Title")}
              </h3>
              <p className="text-[var(--text-muted)] leading-relaxed">
                {t("cancelWarn1Desc", { plan: planName })}
              </p>
            </div>
          </div>

          {/* 2. Premium Features Deactivated */}
          <div className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/60 p-3.5">
            <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5 text-xs">
              <h3 className="font-bold text-[var(--text)]">
                {t("cancelWarn2Title")}
              </h3>
              <p className="text-[var(--text-muted)] leading-relaxed">
                {t("cancelWarn2Desc")}
              </p>
            </div>
          </div>

          {/* 3. No Prorated Refunds */}
          <div className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/60 p-3.5">
            <Clock className="h-4 w-4 text-[var(--text-muted)] shrink-0 mt-0.5" />
            <div className="space-y-0.5 text-xs">
              <h3 className="font-bold text-[var(--text)]">
                {t("cancelWarn3Title")}
              </h3>
              <p className="text-[var(--text-muted)] leading-relaxed">
                {t("cancelWarn3Desc")}
              </p>
            </div>
          </div>

          {/* 4. Automatic Billing Stops */}
          <div className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5">
            <CreditCard className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5 text-xs">
              <h3 className="font-bold text-emerald-300">
                {t("cancelWarn4Title")}
              </h3>
              <p className="text-[var(--text-muted)] leading-relaxed">
                {t("cancelWarn4Desc")}
              </p>
            </div>
          </div>
        </div>

        {/* Strict Double Acknowledgment Checkbox */}
        <label
          htmlFor="cancel-ack-checkbox"
          className="flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 cursor-pointer select-none transition-colors hover:bg-rose-500/15"
        >
          <input
            id="cancel-ack-checkbox"
            type="checkbox"
            checked={hasAcknowledged}
            onChange={(e) => setHasAcknowledged(e.target.checked)}
            disabled={isCanceling}
            className="mt-0.5 h-4 w-4 rounded border-rose-500/40 text-rose-600 focus:ring-rose-500 bg-[var(--bg)] cursor-pointer"
          />
          <span className="text-xs font-semibold text-rose-200 leading-snug">
            {t("cancelModalAcknowledge")}
          </span>
        </label>

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 pt-2 border-t border-[var(--border)]">
          <button
            type="button"
            onClick={handleClose}
            disabled={isCanceling}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-xs font-semibold text-[var(--text)] hover:bg-[var(--surface-2)]/80 focus-visible:ring-2 focus-visible:ring-[var(--accent)] transition-colors text-center"
          >
            {t("cancelModalKeepBtn")}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={!hasAcknowledged || isCanceling}
            className={`w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md ${
              hasAcknowledged && !isCanceling
                ? "bg-rose-600 text-white hover:bg-rose-700 active:scale-[0.98] shadow-rose-900/30"
                : "bg-rose-950/40 text-rose-400/50 border border-rose-900/30 cursor-not-allowed"
            }`}
          >
            {isCanceling ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{t("cancelingSub")}</span>
              </>
            ) : (
              <span>{t("cancelModalConfirmBtn")}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
