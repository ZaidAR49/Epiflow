"use client";

import { useTranslations } from "next-intl";

interface PlanFormFieldsProps {
  code: string;
  setCode: (val: string) => void;
  name: string;
  setName: (val: string) => void;
  priceMinor: number;
  setPriceMinor: (val: number) => void;
  currency: string;
  setCurrency: (val: string) => void;
  billingInterval: "month" | "year" | "lifetime" | "one_time";
  setBillingInterval: (val: "month" | "year" | "lifetime" | "one_time") => void;
  trialDays: number;
  setTrialDays: (val: number) => void;
  provider: string;
  setProvider: (val: string) => void;
  providerPriceId: string;
  setProviderPriceId: (val: string) => void;
  isSystemPlan: boolean;
}

export function PlanFormFields({
  code,
  setCode,
  name,
  setName,
  priceMinor,
  setPriceMinor,
  currency,
  setCurrency,
  billingInterval,
  setBillingInterval,
  trialDays,
  setTrialDays,
  provider,
  setProvider,
  providerPriceId,
  setProviderPriceId,
  isSystemPlan,
}: PlanFormFieldsProps) {
  const t = useTranslations("admin.plans");

  return (
    <div className="space-y-4">
      {/* Code and Name */}
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
            disabled={isSystemPlan}
            className="w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--text)] font-mono focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:outline-hidden disabled:opacity-60"
          />
          {isSystemPlan && (
            <span className="text-[10px] text-[var(--text-muted)] mt-0.5 block">
              {t("systemPlanHelp")}
            </span>
          )}
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

      {/* Price, Currency, Interval */}
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

      {/* Trial Days & Provider */}
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
          <span className="text-[10px] text-[var(--text-muted)] mt-0.5 block">
            {t("trialDaysHelp")}
          </span>
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
            placeholder={t("providerPlaceholder")}
            className="w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--text)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:outline-hidden"
          />
        </div>
      </div>

      {/* Provider Variant ID */}
      <div>
        <label htmlFor="plan-provider-price-id" className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
          {t("providerPriceIdLabel")}
        </label>
        <input
          id="plan-provider-price-id"
          type="text"
          value={providerPriceId}
          onChange={(e) => setProviderPriceId(e.target.value.trim())}
          placeholder={t("providerPriceIdPlaceholder")}
          disabled={isSystemPlan}
          className="w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--text)] font-mono focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:outline-hidden disabled:opacity-60"
        />
        <span className="text-[10px] text-[var(--text-muted)] mt-0.5 block">
          {t("providerPriceIdHelp")}
        </span>
      </div>
    </div>
  );
}
