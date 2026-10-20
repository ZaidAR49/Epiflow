"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Sparkles,
  Mail,
  FileText,
  Check,
  Download,
  ExternalLink,
  Copy,
} from "lucide-react";
import type { StructuredReport, OpportunityMetadata } from "@/lib/validation/report";

interface ReportHeaderActionsProps {
  report: StructuredReport;
  metadata?: OpportunityMetadata;
  sourceUrl?: string;
  onDraftEmail?: () => void;
  onClose?: () => void;
}

export function ReportHeaderActions({
  report,
  metadata,
  sourceUrl,
  onDraftEmail,
  onClose,
}: ReportHeaderActionsProps) {
  const t = useTranslations("report");
  const tCommon = useTranslations("common");

  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedMarkdown, setCopiedMarkdown] = useState(false);

  const role = report.role;
  const company = report.company;
  const hrEmail = metadata?.hrEmail;

  const handleCopyEmail = () => {
    if (!hrEmail) return;
    navigator.clipboard.writeText(hrEmail);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleCopyMarkdown = () => {
    const md =
      `# ${role.title} at ${role.company}\n\n` +
      `**Location**: ${role.location} | **Type**: ${role.jobType}\n\n` +
      `## Summary\n${role.summary}\n\n` +
      `## Responsibilities\n${role.responsibilities.map((r) => `- ${r}`).join("\n")}\n\n` +
      `## Requirements\n${role.requirements.map((r) => `- ${r}`).join("\n")}\n\n` +
      `## Company\n${company.name} - ${company.industry} (${company.size})\n\n` +
      (hrEmail ? `**Direct Application**: ${hrEmail}\n` : "");

    navigator.clipboard.writeText(md);
    setCopiedMarkdown(true);
    setTimeout(() => setCopiedMarkdown(false), 2000);
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${role.company.toLowerCase().replace(/\s+/g, "-")}-report.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Sticky Action Header */}
      <div className="sticky top-16 z-20 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/90 p-4 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)]/15 text-[var(--accent)]">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-[var(--text)]">
              {role.title}
            </h2>
            <p className="text-xs font-medium text-[var(--text-muted)]">
              {role.company} {role.location ? `• ${role.location}` : ""}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {hrEmail && (
            <button
              type="button"
              onClick={onDraftEmail}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-500 transition-colors"
            >
              <Mail className="h-3.5 w-3.5" />
              <span>{t("draftGmail")}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopyMarkdown}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/60 px-2.5 py-1.5 text-xs font-semibold text-[var(--text)] hover:border-[var(--accent)] transition-colors"
          >
            {copiedMarkdown ? (
              <Check className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <FileText className="h-3.5 w-3.5 text-[var(--text-muted)]" />
            )}
            <span>{copiedMarkdown ? tCommon("copied") : t("copyMarkdown")}</span>
          </button>

          <button
            type="button"
            onClick={handleExportJson}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/60 px-2.5 py-1.5 text-xs font-semibold text-[var(--text)] hover:border-[var(--accent)] transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-[var(--text-muted)]" />
            <span>{t("exportJson")}</span>
          </button>

          {sourceUrl && (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/60 px-2.5 py-1.5 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--accent)] transition-colors"
              title="Open LinkedIn Post"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-xs font-semibold text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
            >
              {t("closeViewer")}
            </button>
          )}
        </div>
      </div>

      {/* HR Direct Contact Alert Banner */}
      {hrEmail && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-emerald-300">
                {t("emailFoundAlert")}
              </h3>
              <p className="text-xs text-emerald-200/80">
                {t("directApplicationEmail")}:{" "}
                <span className="font-mono font-bold text-white select-all">
                  {hrEmail}
                </span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyEmail}
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-950/40 px-3 py-1.5 text-xs font-semibold text-emerald-200 hover:bg-emerald-900/60 transition-colors"
            >
              {copiedEmail ? (
                <Check className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              <span>{copiedEmail ? tCommon("copied") : tCommon("copy")}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
