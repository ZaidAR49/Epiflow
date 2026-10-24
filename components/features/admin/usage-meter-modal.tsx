"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { X, Gauge, AlertCircle, Loader2 } from "lucide-react";
import { createUsageMeterAction } from "@/lib/actions/usage-meters";

interface UsageMeterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UsageMeterModal({ isOpen, onClose }: UsageMeterModalProps) {
  const t = useTranslations("admin.usageMeters");
  const [key, setKey] = useState("");
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetAndClose = () => {
    setKey("");
    setName("");
    setUnit("");
    setError(null);
    setIsSubmitting(false);
    onClose();
  };

  // Keyboard navigation: Escape key dismisses modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        resetAndClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const result = await createUsageMeterAction({
      key: key.trim().toLowerCase(),
      name: name.trim(),
      unit: unit.trim(),
    });

    if (result.success) {
      resetAndClose();
    } else {
      setError(result.error || "Failed to create meter");
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="usage-meter-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20">
              <Gauge className="h-5 w-5" />
            </div>
            <div>
              <h3 id="usage-meter-modal-title" className="text-base font-bold text-[var(--text)]">
                {t("modalTitle")}
              </h3>
              <p className="text-xs text-[var(--text-muted)]">{t("modalSubtitle")}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={resetAndClose}
            aria-label={t("cancel")}
            className="rounded-lg p-1 text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            role="alert"
            className="mt-4 flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Key Input */}
          <div>
            <label
              htmlFor="usage-meter-key-input"
              className="block text-xs font-semibold text-[var(--text)] mb-1"
            >
              {t("keyLabel")} <span className="text-rose-400">*</span>
            </label>
            <input
              id="usage-meter-key-input"
              type="text"
              required
              autoFocus
              value={key}
              onChange={(e) => setKey(e.target.value.toLowerCase().replace(/\s+/g, "_"))}
              placeholder={t("keyPlaceholder")}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-xs font-mono text-[var(--text)] placeholder-[var(--text-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            />
            <p className="mt-1 text-[11px] text-[var(--text-muted)]">{t("keyHelp")}</p>
          </div>

          {/* Name Input */}
          <div>
            <label
              htmlFor="usage-meter-name-input"
              className="block text-xs font-semibold text-[var(--text)] mb-1"
            >
              {t("nameLabel")} <span className="text-rose-400">*</span>
            </label>
            <input
              id="usage-meter-name-input"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("namePlaceholder")}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            />
          </div>

          {/* Unit Input */}
          <div>
            <label
              htmlFor="usage-meter-unit-input"
              className="block text-xs font-semibold text-[var(--text)] mb-1"
            >
              {t("unitLabel")} <span className="text-rose-400">*</span>
            </label>
            <input
              id="usage-meter-unit-input"
              type="text"
              required
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder={t("unitPlaceholder")}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={resetAndClose}
              disabled={isSubmitting}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2 text-xs font-medium text-[var(--text)] hover:bg-[var(--surface-2)]/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:opacity-50"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-4 py-2 text-xs font-medium text-white shadow-sm hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>{t("saving")}</span>
                </>
              ) : (
                <span>{t("saveMeter")}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
