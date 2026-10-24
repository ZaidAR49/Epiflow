"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { LegalLayout } from "./legal-layout";
import {
  FileCheck2,
  Cpu,
  Layers,
  AlertOctagon,
  ShieldAlert,
  Copyright,
  CreditCard,
  HelpCircle,
  Scale,
  UserX,
  Building,
  Mail,
} from "lucide-react";

export function TermsView() {
  const t = useTranslations("terms");

  const tocItems = [
    { id: "sec-1", label: t("tocAcceptance") },
    { id: "sec-2", label: t("tocServices") },
    { id: "sec-3", label: t("tocThirdParties") },
    { id: "sec-4", label: t("tocConduct") },
    { id: "sec-5", label: t("tocIp") },
    { id: "sec-6", label: t("tocPayments") },
    { id: "sec-7", label: t("tocDisclaimers") },
    { id: "sec-8", label: t("tocLiability") },
    { id: "sec-9", label: t("tocIndemnity") },
    { id: "sec-10", label: t("tocTermination") },
    { id: "sec-11", label: t("tocGoverning") },
    { id: "sec-12", label: t("tocContact") },
  ];

  return (
    <LegalLayout
      badge={t("badge")}
      title={t("title")}
      subtitle={t("subtitle")}
      tocItems={tocItems}
    >
      {/* Section 1: Acceptance */}
      <section id="sec-1" className="scroll-mt-28 space-y-4">
        <div className="flex items-center gap-2.5 text-base font-bold text-[var(--text)] border-b border-[var(--border)] pb-2">
          <FileCheck2 className="h-5 w-5 text-[var(--accent)]" />
          <h2>{t("sec1Title")}</h2>
        </div>
        <p className="text-[var(--text-muted)]">{t("sec1Lead")}</p>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
          {t("sec1Age")}
        </div>
      </section>

      {/* Section 2: Services & Quotas */}
      <section id="sec-2" className="scroll-mt-28 space-y-4">
        <div className="flex items-center gap-2.5 text-base font-bold text-[var(--text)] border-b border-[var(--border)] pb-2">
          <Cpu className="h-5 w-5 text-[var(--accent)]" />
          <h2>{t("sec2Title")}</h2>
        </div>
        <p className="text-[var(--text-muted)]">{t("sec2P1")}</p>
        <p className="text-[var(--text-muted)]">{t("sec2P2")}</p>
      </section>

      {/* Section 3: Third Parties & Disclaimers */}
      <section id="sec-3" className="scroll-mt-28 space-y-6">
        <div className="flex items-center gap-2.5 text-base font-bold text-[var(--text)] border-b border-[var(--border)] pb-2">
          <Layers className="h-5 w-5 text-[var(--accent)]" />
          <h2>{t("sec3Title")}</h2>
        </div>
        <p className="text-[var(--text-muted)]">{t("sec3Lead")}</p>

        {/* LinkedIn Trademark */}
        <div className="rounded-xl border border-sky-500/30 bg-sky-500/5 p-5 space-y-2">
          <h3 className="text-sm font-bold text-sky-300">
            {t("linkedInTitle")}
          </h3>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
            {t("linkedInP1")}
          </p>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            {t("linkedInP2")}
          </p>
        </div>

        {/* Public Scraping & Warranty */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-3">
          <h3 className="text-sm font-bold text-[var(--text)]">
            {t("scrapingTitle")}
          </h3>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
            {t("scrapingP1")}
          </p>
          <ul className="space-y-1.5 text-xs text-[var(--text-muted)] list-disc ps-5">
            <li>{t("scrapingItem1")}</li>
            <li>{t("scrapingItem2")}</li>
            <li>{t("scrapingItem3")}</li>
          </ul>
        </div>

        {/* Google Workspace & Drafts */}
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 space-y-2">
          <h3 className="text-sm font-bold text-amber-300">
            {t("googleTitle")}
          </h3>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
            {t("googleP1")}
          </p>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
            {t("googleP2")}
          </p>
        </div>

        {/* AI Intelligence & Verify Before Applying */}
        <div className="rounded-xl border border-purple-500/30 bg-purple-500/5 p-5 space-y-2">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-purple-400" />
            <h3 className="text-sm font-bold text-purple-300">
              {t("aiTitle")}
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
            {t("aiP1")}
          </p>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed font-medium">
            {t("aiP2")}
          </p>
        </div>
      </section>

      {/* Section 4: Acceptable Use */}
      <section id="sec-4" className="scroll-mt-28 space-y-4">
        <div className="flex items-center gap-2.5 text-base font-bold text-[var(--text)] border-b border-[var(--border)] pb-2">
          <AlertOctagon className="h-5 w-5 text-[var(--accent)]" />
          <h2>{t("sec4Title")}</h2>
        </div>
        <p className="text-[var(--text-muted)]">{t("sec4Lead")}</p>
        <ul className="space-y-2 text-xs sm:text-sm text-[var(--text-muted)] list-disc ps-5">
          <li>{t("sec4Item1")}</li>
          <li>{t("sec4Item2")}</li>
          <li>{t("sec4Item3")}</li>
          <li>{t("sec4Item4")}</li>
          <li>{t("sec4Item5")}</li>
        </ul>
      </section>

      {/* Section 5: Intellectual Property */}
      <section id="sec-5" className="scroll-mt-28 space-y-4">
        <div className="flex items-center gap-2.5 text-base font-bold text-[var(--text)] border-b border-[var(--border)] pb-2">
          <Copyright className="h-5 w-5 text-[var(--accent)]" />
          <h2>{t("sec5Title")}</h2>
        </div>
        <p className="text-[var(--text-muted)]">{t("sec5P1")}</p>
        <p className="text-[var(--text-muted)]">{t("sec5P2")}</p>
      </section>

      {/* Section 6: Payments Notice */}
      <section id="sec-6" className="scroll-mt-28 space-y-4">
        <div className="flex items-center gap-2.5 text-base font-bold text-[var(--text)] border-b border-[var(--border)] pb-2">
          <CreditCard className="h-5 w-5 text-[var(--accent)]" />
          <h2>{t("sec6Title")}</h2>
        </div>
        <p className="text-[var(--text-muted)]">{t("sec6P1")}</p>
        <p className="text-[var(--text-muted)]">{t("sec6P2")}</p>
      </section>

      {/* Section 7: Disclaimers */}
      <section id="sec-7" className="scroll-mt-28 space-y-4">
        <div className="flex items-center gap-2.5 text-base font-bold text-[var(--text)] border-b border-[var(--border)] pb-2">
          <HelpCircle className="h-5 w-5 text-[var(--accent)]" />
          <h2>{t("sec7Title")}</h2>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-3 text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
          <p>{t("sec7P1")}</p>
          <p>{t("sec7P2")}</p>
        </div>
      </section>

      {/* Section 8: Liability */}
      <section id="sec-8" className="scroll-mt-28 space-y-4">
        <div className="flex items-center gap-2.5 text-base font-bold text-[var(--text)] border-b border-[var(--border)] pb-2">
          <Scale className="h-5 w-5 text-[var(--accent)]" />
          <h2>{t("sec8Title")}</h2>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-3 text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
          <p>{t("sec8P1")}</p>
          <p>{t("sec8P2")}</p>
        </div>
      </section>

      {/* Section 9: Indemnification */}
      <section id="sec-9" className="scroll-mt-28 space-y-4">
        <div className="flex items-center gap-2.5 text-base font-bold text-[var(--text)] border-b border-[var(--border)] pb-2">
          <ShieldAlert className="h-5 w-5 text-[var(--accent)]" />
          <h2>{t("sec9Title")}</h2>
        </div>
        <p className="text-[var(--text-muted)]">{t("sec9P1")}</p>
      </section>

      {/* Section 10: Termination */}
      <section id="sec-10" className="scroll-mt-28 space-y-4">
        <div className="flex items-center gap-2.5 text-base font-bold text-[var(--text)] border-b border-[var(--border)] pb-2">
          <UserX className="h-5 w-5 text-[var(--accent)]" />
          <h2>{t("sec10Title")}</h2>
        </div>
        <p className="text-[var(--text-muted)]">{t("sec10P1")}</p>
        <p className="text-[var(--text-muted)]">{t("sec10P2")}</p>
      </section>

      {/* Section 11: Governing Law */}
      <section id="sec-11" className="scroll-mt-28 space-y-4">
        <div className="flex items-center gap-2.5 text-base font-bold text-[var(--text)] border-b border-[var(--border)] pb-2">
          <Building className="h-5 w-5 text-[var(--accent)]" />
          <h2>{t("sec11Title")}</h2>
        </div>
        <p className="text-[var(--text-muted)]">{t("sec11P1")}</p>
        <p className="text-[var(--text-muted)]">{t("sec11P2")}</p>
      </section>

      {/* Section 12: Contact */}
      <section id="sec-12" className="scroll-mt-28 space-y-4">
        <div className="flex items-center gap-2.5 text-base font-bold text-[var(--text)] border-b border-[var(--border)] pb-2">
          <Mail className="h-5 w-5 text-[var(--accent)]" />
          <h2>{t("sec12Title")}</h2>
        </div>
        <p className="text-[var(--text-muted)]">{t("sec12P1")}</p>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-xs sm:text-sm space-y-1">
          <p className="font-semibold text-[var(--text)]">{t("sec12Email")}</p>
          <p className="text-[var(--text-muted)]">{t("sec12Address")}</p>
        </div>
      </section>
    </LegalLayout>
  );
}
