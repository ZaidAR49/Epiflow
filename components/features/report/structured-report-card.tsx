"use client";

import React from "react";
import { useTranslations } from "next-intl";
import {
  Briefcase,
  AlertTriangle,
  Info,
  MapPin,
  Clock,
} from "lucide-react";
import type { StructuredReport, OpportunityMetadata } from "@/lib/validation/report";
import { ReportHeaderActions } from "./report-header-actions";
import { ReportPosterCompany } from "./report-poster-company";

interface StructuredReportCardProps {
  report: StructuredReport;
  metadata?: OpportunityMetadata;
  sourceUrl?: string;
  onDraftEmail?: () => void;
  onClose?: () => void;
}

export function StructuredReportCard({
  report,
  metadata,
  sourceUrl,
  onDraftEmail,
  onClose,
}: StructuredReportCardProps) {
  const t = useTranslations("report");

  const role = report.role;
  const poster = report.poster;
  const company = report.company;
  const flags = report.flags || [];

  return (
    <div className="space-y-6">
      {/* Sticky Action Header & Email Alert Banner */}
      <ReportHeaderActions
        report={report}
        metadata={metadata}
        sourceUrl={sourceUrl}
        onDraftEmail={onDraftEmail}
        onClose={onClose}
      />

      {/* Flags & Red Flags Banner */}
      {flags.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
            {t("flagsDetected", { count: flags.length })}
          </h3>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {flags.map((flag, idx) => {
              const isWarning = flag.type === "warning";
              return (
                <div
                  key={idx}
                  className={`flex items-start gap-2.5 rounded-xl border p-3 text-xs leading-relaxed ${
                    isWarning
                      ? "border-amber-500/30 bg-amber-500/10 text-amber-200"
                      : "border-sky-500/30 bg-sky-500/10 text-sky-200"
                  }`}
                >
                  {isWarning ? (
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                  ) : (
                    <Info className="h-4 w-4 shrink-0 text-sky-400 mt-0.5" />
                  )}
                  <div>
                    <span className="font-bold">{flag.label}: </span>
                    <span>{flag.observation}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Grid: Layer 1 (Role) & Layer 2 (Poster & Company) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Layer 1: Role Overview (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3">
              <Briefcase className="h-4 w-4 text-[var(--accent)]" />
              <h3 className="text-sm font-bold text-[var(--text)]">
                {t("roleOverview")}
              </h3>
            </div>

            <p className="text-sm leading-relaxed text-[var(--text)]">
              {role.summary}
            </p>

            {/* Badges strip */}
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="inline-flex items-center gap-1 rounded-md bg-[var(--surface-2)] px-2.5 py-1 font-medium text-[var(--text-muted)] border border-[var(--border)]">
                <MapPin className="h-3 w-3" />
                {role.location}
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-[var(--surface-2)] px-2.5 py-1 font-medium text-[var(--text-muted)] border border-[var(--border)]">
                <Clock className="h-3 w-3" />
                {role.jobType}
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-[var(--surface-2)] px-2.5 py-1 font-medium text-[var(--text-muted)] border border-[var(--border)]">
                {role.experienceLevel}
              </span>
            </div>

            {/* Responsibilities */}
            {role.responsibilities?.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  {t("responsibilities")}
                </h4>
                <ul className="space-y-1.5 text-xs text-[var(--text)]">
                  {role.responsibilities.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] shrink-0 mt-1.5" />
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Requirements */}
            {role.requirements?.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  {t("requirements")}
                </h4>
                <ul className="space-y-1.5 text-xs text-[var(--text)]">
                  {role.requirements.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5" />
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Preferred Skills */}
            {role.preferredSkills && role.preferredSkills.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  {t("preferredSkills")}
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {role.preferredSkills.map((skill, i) => (
                    <span
                      key={i}
                      className="rounded-md border border-[var(--border)] bg-[var(--surface-2)]/80 px-2 py-0.5 text-xs font-semibold text-[var(--accent)]"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Layer 2: Poster & Company Details (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <ReportPosterCompany poster={poster} company={company} />
        </div>
      </div>

      {/* Verify notice footer */}
      <p className="text-center text-[11px] text-[var(--text-muted)] pt-2">
        {t("verifyNotice")}
      </p>
    </div>
  );
}
