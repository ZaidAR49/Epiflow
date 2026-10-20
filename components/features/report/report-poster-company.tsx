"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { User, Building2, ExternalLink } from "lucide-react";
import type { StructuredReport } from "@/lib/validation/report";

interface ReportPosterCompanyProps {
  poster: StructuredReport["poster"];
  company: StructuredReport["company"];
}

export function ReportPosterCompany({
  poster,
  company,
}: ReportPosterCompanyProps) {
  const t = useTranslations("report");

  return (
    <div className="space-y-6">
      {/* Poster Profile */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2.5">
          <User className="h-4 w-4 text-[var(--accent)]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text)]">
            {t("posterDetails")}
          </h3>
        </div>

        {poster.isCompanyPost ? (
          <p className="text-xs text-[var(--text-muted)] italic">
            {t("companyPostedNotice")}
          </p>
        ) : (
          <div className="space-y-2 text-xs">
            {poster.name && (
              <p className="font-bold text-sm text-[var(--text)]">
                {poster.name}
              </p>
            )}
            {poster.title && (
              <p className="text-[var(--text-muted)]">{poster.title}</p>
            )}
            {poster.experienceSummary && (
              <p className="text-[var(--text)] text-xs leading-relaxed border-t border-[var(--border)] pt-2">
                {poster.experienceSummary}
              </p>
            )}
            {poster.education && (
              <p className="text-[var(--text-muted)] text-[11px]">
                🎓 {poster.education}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Company Profile */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2.5">
          <Building2 className="h-4 w-4 text-emerald-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text)]">
            {t("companyPulse")}
          </h3>
        </div>

        <div className="space-y-2 text-xs">
          <p className="font-bold text-sm text-[var(--text)]">
            {company.name}
          </p>
          {company.bio && (
            <p className="text-[var(--text-muted)] text-xs leading-relaxed">
              {company.bio}
            </p>
          )}
          <div className="space-y-1 pt-2 border-t border-[var(--border)] text-[11px] text-[var(--text-muted)]">
            <p>
              <span className="font-semibold text-[var(--text)]">
                {t("companyIndustry")}:{" "}
              </span>
              {company.industry}
            </p>
            <p>
              <span className="font-semibold text-[var(--text)]">
                {t("companySize")}:{" "}
              </span>
              {company.size}
            </p>
            <p>
              <span className="font-semibold text-[var(--text)]">
                {t("companyLocations")}:{" "}
              </span>
              {company.geographicPresence}
            </p>
          </div>

          {company.website && (
            <a
              href={
                company.website.startsWith("http")
                  ? company.website
                  : `https://${company.website}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--accent)] hover:underline"
            >
              <span>{t("visitCompanyWebsite")}</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
