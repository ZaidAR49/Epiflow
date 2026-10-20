"use client";

import React, { useState, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  History,
  Search,
  ExternalLink,
  Mail,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Filter,
  Trash2,
} from "lucide-react";
import type { JobRun } from "@/lib/db/schema/job-runs";
import type { StructuredReport } from "@/lib/validation/report";

interface HistoryArchiveProps {
  runs: JobRun[];
  selectedRunId?: string;
  onSelectRun: (run: JobRun) => void;
  onDeleteRun?: (run: JobRun) => void;
}

type FilterTab = "all" | "completed" | "email" | "failed";

export function HistoryArchive({
  runs,
  selectedRunId,
  onSelectRun,
  onDeleteRun,
}: HistoryArchiveProps) {
  const t = useTranslations("dashboard");
  const locale = useLocale();

  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");

  const filteredRuns = useMemo(() => {
    const q = query.trim().toLowerCase();

    return runs.filter((run) => {
      const report = run.report as StructuredReport | null;
      const roleTitle = report?.role?.title?.toLowerCase() || "";
      const companyName = report?.role?.company?.toLowerCase() || "";
      const rawUrl = run.url.toLowerCase();

      // Query filter
      if (
        q &&
        !roleTitle.includes(q) &&
        !companyName.includes(q) &&
        !rawUrl.includes(q)
      ) {
        return false;
      }

      // Tab filter
      if (activeFilter === "completed") return run.status === "completed";
      if (activeFilter === "failed") return run.status === "failed";
      if (activeFilter === "email") {
        return (
          run.status === "completed" &&
          // Check if metadata has hrEmail or text mentions email
          Boolean((run.report as { metadata?: { hrEmail?: string } })?.metadata?.hrEmail)
        );
      }

      return true;
    });
  }, [runs, query, activeFilter]);

  const formatDate = (date: Date | string) => {
    try {
      const d = typeof date === "string" ? new Date(date) : date;
      return new Intl.DateTimeFormat(locale, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(d);
    } catch {
      return "";
    }
  };

  return (
    <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl space-y-5">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--border)] pb-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--accent)]/15 text-[var(--accent)]">
            <History className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-[var(--text)]">
              {t("historyTitle")}
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              {t("historySubtitle")}
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute start-3 top-2.5 h-3.5 w-3.5 text-[var(--text-muted)]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchHistoryPlaceholder")}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/60 ps-8 pe-3 py-1.5 text-xs text-[var(--text)] placeholder-[var(--text-muted)]/60 focus:border-[var(--accent)] focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <Filter className="h-3.5 w-3.5 text-[var(--text-muted)] me-1" />
        <button
          type="button"
          onClick={() => setActiveFilter("all")}
          className={`rounded-lg px-2.5 py-1 font-semibold transition-colors ${
            activeFilter === "all"
              ? "bg-[var(--accent)] text-white shadow-xs"
              : "bg-[var(--surface-2)]/60 text-[var(--text-muted)] hover:text-[var(--text)]"
          }`}
        >
          {t("filterAll")} ({runs.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter("completed")}
          className={`rounded-lg px-2.5 py-1 font-semibold transition-colors ${
            activeFilter === "completed"
              ? "bg-[var(--accent)] text-white shadow-xs"
              : "bg-[var(--surface-2)]/60 text-[var(--text-muted)] hover:text-[var(--text)]"
          }`}
        >
          {t("filterCompleted")}
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter("email")}
          className={`rounded-lg px-2.5 py-1 font-semibold transition-colors ${
            activeFilter === "email"
              ? "bg-emerald-600 text-white shadow-xs"
              : "bg-[var(--surface-2)]/60 text-[var(--text-muted)] hover:text-[var(--text)]"
          }`}
        >
          {t("filterWithEmail")}
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter("failed")}
          className={`rounded-lg px-2.5 py-1 font-semibold transition-colors ${
            activeFilter === "failed"
              ? "bg-rose-600 text-white shadow-xs"
              : "bg-[var(--surface-2)]/60 text-[var(--text-muted)] hover:text-[var(--text)]"
          }`}
        >
          {t("filterFailed")}
        </button>
      </div>

      {/* Runs List */}
      {runs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] p-12 text-center text-xs text-[var(--text-muted)]">
          {t("noHistory")}
        </div>
      ) : filteredRuns.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] p-10 text-center text-xs text-[var(--text-muted)]">
          {t("noMatchingHistory")}
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredRuns.map((run) => {
            const report = run.report as StructuredReport | null;
            const role = report?.role;
            const isSelected = selectedRunId === run.id;
            const hasEmail = Boolean(
              (run.report as { metadata?: { hrEmail?: string } })?.metadata?.hrEmail
            );

            return (
              <div
                key={run.id}
                className={`group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border p-4 transition-all ${
                  isSelected
                    ? "border-[var(--accent)] bg-[var(--accent)]/10 ring-1 ring-[var(--accent)]/40 shadow-md"
                    : "border-[var(--border)] bg-[var(--surface-2)]/40 hover:border-[var(--accent)]/40 hover:bg-[var(--surface-2)]/80"
                }`}
              >
                {/* Left: Role, Company, and Email Badge */}
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-sm text-[var(--text)] truncate">
                      {role?.title || "LinkedIn Job Scan"}
                    </span>
                    {hasEmail && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/30">
                        <Mail className="h-3 w-3" />
                        <span>Email Found</span>
                      </span>
                    )}
                    {run.status === "completed" ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Done</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-400">
                        <XCircle className="h-3 w-3" />
                        <span>Failed</span>
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-[var(--text-muted)] truncate">
                    {role?.company ? `${role.company} • ` : ""}
                    <span className="font-mono text-[11px] opacity-75">
                      {run.url.length > 55
                        ? `${run.url.slice(0, 55)}...`
                        : run.url}
                    </span>
                  </p>
                </div>

                {/* Right: Date & Actions */}
                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  <div className="hidden md:flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
                    <Clock className="h-3 w-3" />
                    <span>{formatDate(run.createdAt)}</span>
                  </div>

                  <a
                    href={run.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--accent)] transition-colors"
                    title={t("originalPost")}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>

                  {run.status === "completed" && Boolean(run.report) && (
                    <button
                      type="button"
                      onClick={() => onSelectRun(run)}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all shadow-xs ${
                        isSelected
                          ? "bg-[var(--accent)] text-white"
                          : "bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
                      }`}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>{t("viewReport")}</span>
                    </button>
                  )}

                  {onDeleteRun && (
                    <button
                      type="button"
                      onClick={() => onDeleteRun(run)}
                      className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:text-rose-400 hover:border-rose-500/30 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title={t("deleteReport")}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
