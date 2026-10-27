"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Copy, Check, Calendar, Globe, FileText, Fingerprint } from "lucide-react";
import type { AdminUserItem } from "@/lib/db/queries/admin";

interface UserExpandedDetailsProps {
  user: AdminUserItem;
}

export function UserExpandedDetails({ user: u }: UserExpandedDetailsProps) {
  const t = useTranslations("admin.users");
  const [copied, setCopied] = useState(false);

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(u.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const formattedCreated = new Date(u.createdAt).toLocaleString();
  const formattedUpdated = u.updatedAt ? new Date(u.updatedAt).toLocaleString() : "—";
  const langDisplay =
    u.preferredLanguage === "ar"
      ? "العربية (Arabic)"
      : u.preferredLanguage === "en"
      ? "English"
      : u.preferredLanguage || "—";

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/40 p-4 space-y-3 animate-in fade-in-0 duration-150">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--border)]">
        {/* User UUID with Copy button */}
        <div className="flex items-center gap-2 min-w-0">
          <Fingerprint className="h-4 w-4 text-[var(--accent)] shrink-0" />
          <span className="text-xs font-semibold text-[var(--text-muted)]">
            {t("userIdLabel")}:
          </span>
          <code className="rounded bg-[var(--surface)] px-2 py-0.5 text-xs font-mono font-bold text-[var(--text)] border border-[var(--border)] select-all truncate max-w-xs sm:max-w-md">
            {u.id}
          </code>
          <button
            type="button"
            onClick={handleCopyId}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-colors cursor-pointer"
            title={copied ? t("copiedId") : t("copyId")}
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-bold">{t("copiedId")}</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>{t("copyId")}</span>
              </>
            )}
          </button>
        </div>

        {/* Telegram Info */}
        {u.telegramId && (
          <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
            <span className="text-[10px] uppercase font-bold text-sky-400">Telegram ID:</span>
            <span className="font-mono text-[var(--text)]">{u.telegramId}</span>
            {u.username && <span className="text-sky-400">(@{u.username})</span>}
          </div>
        )}
      </div>

      {/* Grid of extra metadata */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="flex items-start gap-2">
          <Calendar className="h-3.5 w-3.5 text-[var(--text-muted)] mt-0.5 shrink-0" />
          <div>
            <p className="text-[11px] font-semibold text-[var(--text-muted)]">
              {t("joinedDate")}
            </p>
            <p className="font-medium text-[var(--text)]">{formattedCreated}</p>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <Calendar className="h-3.5 w-3.5 text-[var(--text-muted)] mt-0.5 shrink-0" />
          <div>
            <p className="text-[11px] font-semibold text-[var(--text-muted)]">
              {t("lastUpdated")}
            </p>
            <p className="font-medium text-[var(--text)]">{formattedUpdated}</p>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <Globe className="h-3.5 w-3.5 text-[var(--text-muted)] mt-0.5 shrink-0" />
          <div>
            <p className="text-[11px] font-semibold text-[var(--text-muted)]">
              {t("preferredLang")}
            </p>
            <p className="font-medium text-[var(--text)]">{langDisplay}</p>
          </div>
        </div>
      </div>

      {/* Reason for Access */}
      <div className="flex items-start gap-2 pt-1">
        <FileText className="h-3.5 w-3.5 text-[var(--text-muted)] mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <span className="text-[11px] font-semibold text-[var(--text-muted)] me-2">
            {t("reasonForAccess")}:
          </span>
          <span className="text-xs text-[var(--text)]">
            {u.reasonForAccess || t("noReasonGiven")}
          </span>
        </div>
      </div>
    </div>
  );
}
