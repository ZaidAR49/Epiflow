"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { LegalLayout } from "./legal-layout";
import {
  Sparkles,
  ShieldCheck,
  RefreshCw,
  XCircle,
  HelpCircle,
  Mail,
  Building,
} from "lucide-react";

export function RefundView() {
  const t = useTranslations("refund");

  const tocItems = [
    { id: "sec-1", label: t("tocGuarantee") },
    { id: "sec-2", label: t("tocEligibility") },
    { id: "sec-3", label: t("tocProcess") },
    { id: "sec-4", label: t("tocCancellation") },
    { id: "sec-5", label: t("tocDisputes") },
    { id: "sec-6", label: t("tocContact") },
  ];

  return (
    <LegalLayout
      badge={t("badge")}
      title={t("title")}
      subtitle={t("subtitle")}
      tocItems={tocItems}
    >
      {/* Section 1: 14-Day Money-Back Guarantee */}
      <section id="sec-1" className="scroll-mt-28 space-y-4">
        <div className="flex items-center gap-2.5 text-base font-bold text-[var(--text)] border-b border-[var(--border)] pb-2">
          <Sparkles className="h-5 w-5 text-emerald-400" />
          <h2>{t("sec1Title")}</h2>
        </div>
        <p className="text-[var(--text-muted)] leading-relaxed">{t("sec1Lead")}</p>
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-xs sm:text-sm text-emerald-300/90 leading-relaxed">
          {t("sec1Notice")}
        </div>
      </section>

      {/* Section 2: Eligibility & Fair Usage */}
      <section id="sec-2" className="scroll-mt-28 space-y-4">
        <div className="flex items-center gap-2.5 text-base font-bold text-[var(--text)] border-b border-[var(--border)] pb-2">
          <ShieldCheck className="h-5 w-5 text-[var(--accent)]" />
          <h2>{t("sec2Title")}</h2>
        </div>
        <p className="text-[var(--text-muted)] leading-relaxed">{t("sec2Lead")}</p>
        <ul className="space-y-2 text-xs sm:text-sm text-[var(--text-muted)] list-disc ps-5 leading-relaxed">
          <li>{t("sec2Item1")}</li>
          <li>{t("sec2Item2")}</li>
          <li>{t("sec2Item3")}</li>
        </ul>
      </section>

      {/* Section 3: How to Request a Refund */}
      <section id="sec-3" className="scroll-mt-28 space-y-4">
        <div className="flex items-center gap-2.5 text-base font-bold text-[var(--text)] border-b border-[var(--border)] pb-2">
          <RefreshCw className="h-5 w-5 text-[var(--accent)]" />
          <h2>{t("sec3Title")}</h2>
        </div>
        <p className="text-[var(--text-muted)] leading-relaxed">{t("sec3Lead")}</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--accent)]/15 text-[var(--accent)] text-xs font-bold">
              1
            </span>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">{t("sec3Step1")}</p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--accent)]/15 text-[var(--accent)] text-xs font-bold">
              2
            </span>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">{t("sec3Step2")}</p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--accent)]/15 text-[var(--accent)] text-xs font-bold">
              3
            </span>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">{t("sec3Step3")}</p>
          </div>
        </div>
      </section>

      {/* Section 4: Subscription Cancellation */}
      <section id="sec-4" className="scroll-mt-28 space-y-4">
        <div className="flex items-center gap-2.5 text-base font-bold text-[var(--text)] border-b border-[var(--border)] pb-2">
          <XCircle className="h-5 w-5 text-rose-400" />
          <h2>{t("sec4Title")}</h2>
        </div>
        <p className="text-[var(--text-muted)] leading-relaxed">{t("sec4Lead")}</p>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-3 text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
          <p>{t("sec4P1")}</p>
          <p>{t("sec4P2")}</p>
        </div>
      </section>

      {/* Section 5: Disputes & Chargeback Prevention */}
      <section id="sec-5" className="scroll-mt-28 space-y-4">
        <div className="flex items-center gap-2.5 text-base font-bold text-[var(--text)] border-b border-[var(--border)] pb-2">
          <HelpCircle className="h-5 w-5 text-amber-400" />
          <h2>{t("sec5Title")}</h2>
        </div>
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
          {t("sec5Lead")}
        </div>
      </section>

      {/* Section 6: Contact & Merchant Information */}
      <section id="sec-6" className="scroll-mt-28 space-y-4">
        <div className="flex items-center gap-2.5 text-base font-bold text-[var(--text)] border-b border-[var(--border)] pb-2">
          <Mail className="h-5 w-5 text-[var(--accent)]" />
          <h2>{t("sec6Title")}</h2>
        </div>
        <p className="text-[var(--text-muted)] leading-relaxed">{t("sec6Lead")}</p>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2 text-[var(--text)]">
            <Mail className="h-4 w-4 text-[var(--accent)]" />
            <a
              href="mailto:billing@epiflow.io"
              className="text-[var(--accent)] hover:underline font-mono"
              dir="ltr"
            >
              {t("sec6Email")}
            </a>
          </div>
          <div className="flex items-start gap-2 text-[var(--text-muted)]">
            <Building className="h-4 w-4 text-[var(--text-muted)] mt-0.5 shrink-0" />
            <span>{t("sec6Merchant")}</span>
          </div>
        </div>
      </section>
    </LegalLayout>
  );
}
