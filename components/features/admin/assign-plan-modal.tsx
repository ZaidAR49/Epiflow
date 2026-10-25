"use client";

import { useState, useTransition, useEffect } from "react";
import { useTranslations } from "next-intl";
import { X, CreditCard, Loader2 } from "lucide-react";
import { assignPlanToUserAction } from "@/lib/actions/subscriptions";
import { useToast } from "@/hooks/use-toast";

interface AssignPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: { id: string; fullName: string; email: string | null }[];
  plans: { id: string; name: string; code: string; priceMinor: number; currency: string }[];
  onSuccess: () => void;
}

export function AssignPlanModal({
  isOpen,
  onClose,
  users,
  plans,
  onSuccess,
}: AssignPlanModalProps) {
  const t = useTranslations("admin.subscriptions");
  const toast = useToast();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [selectedUserId, setSelectedUserId] = useState(users[0]?.id ?? "");
  const [selectedPlanId, setSelectedPlanId] = useState(plans[0]?.id ?? "");
  const [periodDays, setPeriodDays] = useState(30);

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
    if (!selectedUserId || !selectedPlanId) return;

    setError(null);
    startTransition(async () => {
      const res = await assignPlanToUserAction({
        userId: selectedUserId,
        planId: selectedPlanId,
        periodDays: Number(periodDays),
      });

      if (res.success) {
        toast.success(t("assignSuccess"));
        onSuccess();
        onClose();
      } else {
        setError(res.error || "Failed to assign plan");
      }
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="assign-plan-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
    >
      <div className="relative w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-[var(--accent)]" />
            <h2 id="assign-plan-modal-title" className="text-base font-bold text-[var(--text)]">
              {t("assignModalTitle")}
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

        <p className="mt-2 text-xs text-[var(--text-muted)]">
          {t("assignModalSubtitle")}
        </p>

        {error && (
          <div className="mt-3 rounded-lg bg-[var(--danger)]/15 border border-[var(--danger)]/30 p-2.5 text-xs text-[var(--danger)]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="assign-user-select" className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
              {t("selectUser")}
            </label>
            <select
              id="assign-user-select"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              required
              className="w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--text)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:outline-hidden"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName} {u.email ? `(${u.email})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="assign-plan-select" className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
              {t("selectPlan")}
            </label>
            <select
              id="assign-plan-select"
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(e.target.value)}
              required
              className="w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--text)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:outline-hidden"
            >
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {(p.priceMinor / 100).toFixed(2)} {p.currency}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="assign-period-days" className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
              Duration (Days)
            </label>
            <input
              id="assign-period-days"
              type="number"
              value={periodDays}
              onChange={(e) => setPeriodDays(Number(e.target.value))}
              min={1}
              required
              className="w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--text)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:outline-hidden"
            />
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
              disabled={isPending || !selectedUserId || !selectedPlanId}
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-xs font-bold text-white hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:outline-hidden disabled:opacity-50"
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{t("assignButton")}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
