"use client";

import { useState, useTransition, useEffect } from "react";
import { useTranslations } from "next-intl";
import { X, Sparkles, Loader2, ShieldCheck } from "lucide-react";
import type { PlanWithSubscriberCount } from "@/lib/db/queries/plans";
import type { PlanEntitlements } from "@/lib/validation/plans";
import { createPlanAction, updatePlanAction } from "@/lib/actions/plans";
import { PlanEntitlementsEditor } from "./plan-entitlements-editor";
import { PlanFormFields } from "./plan-form-fields";
import { useToast } from "@/hooks/use-toast";

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
  const [priceMinor, setPriceMinor] = useState<number>(initialData?.priceMinor ?? 0);
  const [currency, setCurrency] = useState(initialData?.currency ?? "USD");
  const [billingInterval, setBillingInterval] = useState<"month" | "year" | "lifetime" | "one_time">(
    (initialData?.billingInterval as "month" | "year" | "lifetime" | "one_time") ?? "month"
  );
  const [trialDays, setTrialDays] = useState<number>(initialData?.trialDays ?? 0);
  const [provider, setProvider] = useState(initialData?.provider ?? "");
  const [providerPriceId, setProviderPriceId] = useState(initialData?.providerPriceId ?? "");
  const [entitlements, setEntitlements] = useState<PlanEntitlements>(
    (initialData?.entitlements as PlanEntitlements) ?? { "job-xray": { runs: 5 } }
  );
  const [isActive, setIsActive] = useState<boolean>(initialData?.isActive ?? true);

  const isSystemPlan = initialData?.code === "free";
  const toast = useToast();

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
      const planPayload = {
        code: isSystemPlan ? "free" : code.trim().toLowerCase(),
        name: name.trim(),
        priceMinor: Number(priceMinor),
        currency: currency.trim().toUpperCase(),
        billingInterval,
        trialDays: Number(trialDays),
        provider: provider.trim() || "system",
        providerPriceId: providerPriceId.trim() || null,
        entitlements,
        isActive: isSystemPlan ? true : isActive,
      };

      if (initialData) {
        const res = await updatePlanAction({
          id: initialData.id,
          ...planPayload,
        });

        if (res.success) {
          toast.success(t("updateSuccess"));
          onSuccess();
          onClose();
        } else {
          setError(res.error || "Update failed");
        }
      } else {
        const res = await createPlanAction(planPayload);

        if (res.success) {
          toast.success(t("createSuccess"));
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
            {isSystemPlan && (
              <span className="inline-flex items-center gap-1 rounded-md bg-[var(--accent)]/15 px-2 py-0.5 text-[10px] font-semibold text-[var(--accent)] border border-[var(--accent)]/30">
                <ShieldCheck className="h-3 w-3" />
                {t("defaultBadge")}
              </span>
            )}
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
          <PlanFormFields
            code={code}
            setCode={setCode}
            name={name}
            setName={setName}
            priceMinor={priceMinor}
            setPriceMinor={setPriceMinor}
            currency={currency}
            setCurrency={setCurrency}
            billingInterval={billingInterval}
            setBillingInterval={setBillingInterval}
            trialDays={trialDays}
            setTrialDays={setTrialDays}
            provider={provider}
            setProvider={setProvider}
            providerPriceId={providerPriceId}
            setProviderPriceId={setProviderPriceId}
            isSystemPlan={isSystemPlan}
          />

          <PlanEntitlementsEditor
            value={entitlements}
            onChange={setEntitlements}
            availableWorkflows={availableWorkflows}
          />

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="plan-active"
              checked={isSystemPlan ? true : isActive}
              onChange={(e) => !isSystemPlan && setIsActive(e.target.checked)}
              disabled={isSystemPlan}
              className="rounded border-[var(--border)] text-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:opacity-60"
            />
            <label htmlFor="plan-active" className="text-xs text-[var(--text)] cursor-pointer">
              {t("active")}
            </label>
            {isSystemPlan && (
              <span className="text-[10px] text-[var(--text-muted)] italic">
                ({t("defaultBadge")})
              </span>
            )}
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
