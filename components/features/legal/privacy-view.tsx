"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { LegalLayout } from "./legal-layout";
import { ThirdPartyDisclosures } from "./third-party-disclosures";
import { ShieldCheck, UserCheck, HardDrive, Key, Cookie, Scale, Mail } from "lucide-react";

export function PrivacyView() {
  const t = useTranslations("privacy");

  const tocItems = [
    { id: "sec-1", label: t("tocOverview") },
    { id: "sec-2", label: t("tocThirdParties") },
    { id: "sec-3", label: t("tocPurpose") },
    { id: "sec-4", label: t("tocSecurity") },
    { id: "sec-5", label: t("tocRetention") },
    { id: "sec-6", label: t("tocCookies") },
    { id: "sec-7", label: t("tocRights") },
    { id: "sec-8", label: t("tocContact") },
  ];

  return (
    <LegalLayout
      badge={t("badge")}
      title={t("title")}
      subtitle={t("subtitle")}
      tocItems={tocItems}
    >
      {/* Section 1: Overview */}
      <section id="sec-1" className="scroll-mt-28 space-y-4">
        <div className="flex items-center gap-2.5 text-base font-bold text-[var(--text)] border-b border-[var(--border)] pb-2">
          <UserCheck className="h-5 w-5 text-[var(--accent)]" />
          <h2>{t("sec1Title")}</h2>
        </div>
        <p className="text-[var(--text-muted)]">{t("sec1Lead")}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <h3 className="text-xs font-bold text-[var(--text)] uppercase tracking-wider mb-1 text-[var(--accent)]">
              {t("sec1Item1Title")}
            </h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              {t("sec1Item1Desc")}
            </p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <h3 className="text-xs font-bold text-[var(--text)] uppercase tracking-wider mb-1 text-[var(--accent)]">
              {t("sec1Item2Title")}
            </h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              {t("sec1Item2Desc")}
            </p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <h3 className="text-xs font-bold text-[var(--text)] uppercase tracking-wider mb-1 text-[var(--accent)]">
              {t("sec1Item3Title")}
            </h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              {t("sec1Item3Desc")}
            </p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <h3 className="text-xs font-bold text-[var(--text)] uppercase tracking-wider mb-1 text-[var(--accent)]">
              {t("sec1Item4Title")}
            </h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              {t("sec1Item4Desc")}
            </p>
          </div>
        </div>
      </section>

      {/* Section 2: Third Parties */}
      <section id="sec-2" className="scroll-mt-28 space-y-4">
        <div className="flex items-center gap-2.5 text-base font-bold text-[var(--text)] border-b border-[var(--border)] pb-2">
          <HardDrive className="h-5 w-5 text-[var(--accent)]" />
          <h2>{t("sec2Title")}</h2>
        </div>
        <p className="text-[var(--text-muted)]">{t("sec2Lead")}</p>
        <ThirdPartyDisclosures />
      </section>

      {/* Section 3: Purposes */}
      <section id="sec-3" className="scroll-mt-28 space-y-4">
        <div className="flex items-center gap-2.5 text-base font-bold text-[var(--text)] border-b border-[var(--border)] pb-2">
          <Scale className="h-5 w-5 text-[var(--accent)]" />
          <h2>{t("sec3Title")}</h2>
        </div>
        <p className="text-[var(--text-muted)]">{t("sec3Lead")}</p>
        <ul className="space-y-2.5 text-xs sm:text-sm text-[var(--text-muted)] list-disc ps-5">
          <li>{t("sec3Contract")}</li>
          <li>{t("sec3Consent")}</li>
          <li>{t("sec3Legitimate")}</li>
          <li>{t("sec3Compliance")}</li>
        </ul>
      </section>

      {/* Section 4: Security */}
      <section id="sec-4" className="scroll-mt-28 space-y-4">
        <div className="flex items-center gap-2.5 text-base font-bold text-[var(--text)] border-b border-[var(--border)] pb-2">
          <Key className="h-5 w-5 text-[var(--accent)]" />
          <h2>{t("sec4Title")}</h2>
        </div>
        <p className="text-[var(--text-muted)]">{t("sec4P1")}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[var(--text-muted)]">
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
            {t("sec4Item1")}
          </div>
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
            {t("sec4Item2")}
          </div>
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
            {t("sec4Item3")}
          </div>
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
            {t("sec4Item4")}
          </div>
        </div>
      </section>

      {/* Section 5: Retention */}
      <section id="sec-5" className="scroll-mt-28 space-y-4">
        <div className="flex items-center gap-2.5 text-base font-bold text-[var(--text)] border-b border-[var(--border)] pb-2">
          <ShieldCheck className="h-5 w-5 text-[var(--accent)]" />
          <h2>{t("sec5Title")}</h2>
        </div>
        <p className="text-[var(--text-muted)]">{t("sec5P1")}</p>
        <p className="text-[var(--text-muted)]">{t("sec5P2")}</p>
      </section>

      {/* Section 6: Cookies */}
      <section id="sec-6" className="scroll-mt-28 space-y-4">
        <div className="flex items-center gap-2.5 text-base font-bold text-[var(--text)] border-b border-[var(--border)] pb-2">
          <Cookie className="h-5 w-5 text-[var(--accent)]" />
          <h2>{t("sec6Title")}</h2>
        </div>
        <p className="text-[var(--text-muted)]">{t("sec6P1")}</p>
        <p className="text-[var(--text-muted)]">{t("sec6P2")}</p>
      </section>

      {/* Section 7: User Rights */}
      <section id="sec-7" className="scroll-mt-28 space-y-4">
        <div className="flex items-center gap-2.5 text-base font-bold text-[var(--text)] border-b border-[var(--border)] pb-2">
          <UserCheck className="h-5 w-5 text-[var(--accent)]" />
          <h2>{t("sec7Title")}</h2>
        </div>
        <p className="text-[var(--text-muted)]">{t("sec7Lead")}</p>
        <ul className="space-y-2 text-xs sm:text-sm text-[var(--text-muted)] list-disc ps-5">
          <li>{t("sec7Right1")}</li>
          <li>{t("sec7Right2")}</li>
          <li>{t("sec7Right3")}</li>
          <li>{t("sec7Right4")}</li>
          <li>{t("sec7Right5")}</li>
        </ul>
      </section>

      {/* Section 8: Contact */}
      <section id="sec-8" className="scroll-mt-28 space-y-4">
        <div className="flex items-center gap-2.5 text-base font-bold text-[var(--text)] border-b border-[var(--border)] pb-2">
          <Mail className="h-5 w-5 text-[var(--accent)]" />
          <h2>{t("sec8Title")}</h2>
        </div>
        <p className="text-[var(--text-muted)]">{t("sec8P1")}</p>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-xs sm:text-sm space-y-1">
          <p className="font-semibold text-[var(--text)]">{t("sec8Email")}</p>
          <p className="text-[var(--text-muted)]">{t("sec8Address")}</p>
        </div>
      </section>
    </LegalLayout>
  );
}
