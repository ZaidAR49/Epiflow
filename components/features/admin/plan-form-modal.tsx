"use client";

import { useState, useTransition, useEffect } from "react";
import { useTranslations } from "next-intl";
import { X, Sparkles, Loader2 } from "lucide-react";
import type { PlanWithSubscriberCount } from "@/lib/db/queries/plans";
import type { PlanEntitlements } from "@/lib/validation/plans";
import { createPlanAction, updatePlanAction } from "@/lib/actions/plans";
import { PlanEntitlementsEditor } from "./plan-entitlements-editor";

interface PlanFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: PlanWithSubscriberCount | null;
  availableWorkflows?: { slug: string; name: string }[];
  onSuccess: () => void;
}

export function PlanFormModal({
  isOpen,
  onClose,
  initialData,
  availableWorkflows,
  onSuccess,
}: PlanFormModalProps) {
  const t = useTranslations("admin.plans");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [code, setCode] = useState(initialData?.code ?? "");
  const [name, setName] = useState(initialData?.name ?? "");
  const [priceMinor, setPriceMinor] = useState<number>(initialData?.priceMinor ?? 1900);
  const [currency, setCurrency] = useState(initialData?.currency ?? "USD");
  const [billingInterval, setBillingInterval] = useState<"month" | "year" | "lifetime" | "one_time">(
    (initialData?.billingInterval as "month" | "year" | "lifetime" | "one_time") ?? "month"
  );
  const [trialDays, setTrialDays] = useState<number>(initialData?.trialDays ?? 0);
  const [provider, setProvider] = useState(initialData?.provider ?? "mock");
  const [entitlements, setEntitlements] = useState<PlanEntitlements>(
    (initialData?.entitlements as PlanEntitlements) ?? { "job-xray": { runs: 50 } }
  );
  const [isActive, setIsActive] = useState<boolean>(initialData?.isActive ?? true);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      if (initialData) {
        const res = await updatePlanAction({
          id: initialData.id,
          code,
          name,
          priceMinor: Number(priceMinor),
          currency,
          billingInterval,
          trialDays: Number(trialDays),
          provider,
          entitlements,
          isActive,
        });

        if (res.success) {
          onSuccess();
          onClose();
        } else {
          setError(res.error || "Update failed");
        }
      } else {
        const res = await createPlanAction({
          code,
          name,
          priceMinor: Number(priceMinor),
          currency,
          billingInterval,
          trialDays: Number(trialDays),
          provider,
          entitlements,
          isActive,
        });

        if (res.success) {
          onSuccess();
          onClose();
        } else {
          setError(res.error || "Creation failed");
        }
      }
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="plan-form-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
    >
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[var(--accent)]" />
            <h2 id="plan-form-title" className="text-base font-bold text-[var(--text)]">
              {initialData ? t("editPlan") : t("addPlan")}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-[var(--text-muted)] hover:text-[var(--text)] p-1 rounded-md focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:outline-hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-lg bg-[var(--danger)]/15 border border-[var(--danger)]/30 p-3 text-xs text-[var(--danger)]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="plan-code" className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                {t("codeLabel")}
              </label>
              <input
                id="plan-code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toLowerCase())}
                placeholder={t("codePlaceholder")}
                required
                className="w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--text)] font-mono focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:outline-hidden"
              />
            </div>

            <div>
              <label htmlFor="plan-name" className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                {t("nameLabel")}
              </label>
              <input
                id="plan-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("namePlaceholder")}
                required
                className="w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--text)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="plan-price" className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                {t("priceLabel")}
              </label>
              <input
                id="plan-price"
                type="number"
                value={priceMinor}
                onChange={(e) => setPriceMinor(Number(e.target.value))}
                min={0}
                required
                className="w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--text)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:outline-hidden"
              />
              <span className="text-[10px] text-[var(--text-muted)]">{t("priceHelp")}</span>
            </div>

            <div>
              <label htmlFor="plan-currency" className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                {t("currencyLabel")}
              </label>
              <input
                id="plan-currency"
                type="text"
                value={currency}
                onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                maxLength={3}
                required
                className="w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--text)] uppercase font-mono focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:outline-hidden"
              />
            </div>

            <div>
              <label htmlFor="plan-interval" className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                {t("intervalLabel")}
              </label>
              <select
                id="plan-interval"
                value={billingInterval}
                onChange={(e) => setBillingInterval(e.target.value as "month" | "year" | "lifetime" | "one_time")}
                className="w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--text)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:outline-hidden"
              >
                <option value="month">{t("intervalMonth")}</option>
                <option value="year">{t("intervalYear")}</option>
                <option value="lifetime">{t("intervalLifetime")}</option>
                <option value="one_time">{t("intervalOneTime")}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="plan-trial" className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                {t("trialDaysLabel")}
              </label>
              <input
                id="plan-trial"
                type="number"
                value={trialDays}
                onChange={(e) => setTrialDays(Number(e.target.value))}
                min={0}
                className="w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--text)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:outline-hidden"
              />
            </div>

            <div>
              <label htmlFor="plan-provider" className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                {t("providerLabel")}
              </label>
              <input
                id="plan-provider"
                type="text"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                placeholder="mock"
                className="w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--text)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:outline-hidden"
              />
            </div>
          </div>

          <PlanEntitlementsEditor
            value={entitlements}
            onChange={setEntitlements}
            availableWorkflows={availableWorkflows}
          />

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="plan-active"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded border-[var(--border)] text-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            />
            <label htmlFor="plan-active" className="text-xs text-[var(--text)] cursor-pointer">
              {t("active")}
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-xs text-[var(--text-muted)] hover:text-[var(--text)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:outline-hidden"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-xs font-bold text-white hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:outline-hidden disabled:opacity-50"
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{isPending ? t("saving") : t("savePlan")}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
