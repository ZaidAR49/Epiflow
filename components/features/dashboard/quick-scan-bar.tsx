"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Search, Sparkles, Clipboard, ArrowRight, AlertCircle, Globe } from "lucide-react";

interface QuickScanBarProps {
  onScan: (url: string, language: "ar" | "en") => void;
  isScanning: boolean;
  remainingQuota: number | null;
  preferredLanguage?: "ar" | "en";
}

const LINKEDIN_REGEX =
  /^https?:\/\/(www\.)?(linkedin\.com\/(posts|feed\/update|jobs\/view)\/|lnkd\.in\/)[\w\-_?&=%#./]+$/i;

export function QuickScanBar({
  onScan,
  isScanning,
  remainingQuota,
  preferredLanguage = "ar",
}: QuickScanBarProps) {
  const t = useTranslations("dashboard");

  const [url, setUrl] = useState("");
  const [reportLang, setReportLang] = useState<"ar" | "en">(preferredLanguage);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text.trim());
        setErrorMsg(null);
      }
    } catch {
      // Clipboard permission denied or unavailable
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = url.trim();

    if (!cleanUrl) {
      setErrorMsg(t("inputPlaceholder"));
      return;
    }

    if (!LINKEDIN_REGEX.test(cleanUrl)) {
      setErrorMsg(t("invalidUrlFeedback"));
      return;
    }

    setErrorMsg(null);
    onScan(cleanUrl, reportLang);
  };

  return (
    <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 shadow-2xl relative overflow-hidden space-y-4">
      {/* Background Subtle Gradient Glow */}
      <div className="absolute top-0 end-0 -mt-8 -me-8 h-48 w-48 rounded-full bg-[var(--accent)]/10 blur-3xl pointer-events-none" />

      {/* Top Bar: Title & Quota Meter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-2)]/60 px-3 py-1 text-xs font-semibold text-[var(--accent)] mb-2">
            <Sparkles className="h-3 w-3" />
            <span>{t("quickScan")}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text)]">
            {t("title")}
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1 max-w-xl">
            {t("subtitle")}
          </p>
        </div>

        {/* Quota Badge */}
        <div className="self-start sm:self-auto rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/80 px-3.5 py-2 text-xs font-semibold text-[var(--text)] shadow-xs">
          <span className="text-[var(--text-muted)]">Quota: </span>
          <span className="font-bold text-[var(--accent)]">
            {remainingQuota !== null
              ? t("quotaRemaining", { count: remainingQuota })
              : t("unlimitedQuota")}
          </span>
        </div>
      </div>

      {/* Main Input Form */}
      <form onSubmit={handleSubmit} className="space-y-3 pt-2">
        <div className="relative flex flex-col sm:flex-row items-stretch gap-2.5 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)]/60 p-2 shadow-inner focus-within:border-[var(--accent)] focus-within:ring-2 focus-within:ring-[var(--accent)]/20 transition-all">
          <div className="relative flex flex-1 items-center">
            <Search className="ms-3 h-4 w-4 shrink-0 text-[var(--text-muted)] pointer-events-none" />
            <input
              type="url"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              placeholder={t("inputPlaceholder")}
              disabled={isScanning}
              className="w-full bg-transparent px-3 py-2.5 text-sm font-medium text-[var(--text)] placeholder-[var(--text-muted)]/60 focus:outline-none"
            />
            {/* Quick Paste Button */}
            <button
              type="button"
              onClick={handlePaste}
              disabled={isScanning}
              title={t("pasteClipboard")}
              className="me-2 inline-flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--accent)] transition-colors shadow-xs"
            >
              <Clipboard className="h-3.5 w-3.5" />
              <span className="hidden md:inline">{t("pasteClipboard")}</span>
            </button>
          </div>

          {/* Language Selection Pill */}
          <div className="flex items-center gap-1 self-center rounded-xl bg-[var(--surface)] border border-[var(--border)] p-1 text-xs font-semibold">
            <Globe className="ms-2 h-3.5 w-3.5 text-[var(--text-muted)]" />
            <button
              type="button"
              onClick={() => setReportLang("ar")}
              disabled={isScanning}
              className={`rounded-lg px-2.5 py-1 transition-all ${
                reportLang === "ar"
                  ? "bg-[var(--accent)] text-white shadow-xs"
                  : "text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
            >
              العربية
            </button>
            <button
              type="button"
              onClick={() => setReportLang("en")}
              disabled={isScanning}
              className={`rounded-lg px-2.5 py-1 transition-all ${
                reportLang === "en"
                  ? "bg-[var(--accent)] text-white shadow-xs"
                  : "text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
            >
              EN
            </button>
          </div>

          {/* Submit Analyze Button */}
          <button
            type="submit"
            disabled={isScanning || !url.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-3 text-sm font-bold text-white shadow-md shadow-[var(--accent)]/20 hover:bg-[var(--accent)]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <span>{isScanning ? "Scanning..." : t("analyzeButton")}</span>
            <ArrowRight className="h-4 w-4 rtl:-scale-x-100" />
          </button>
        </div>

        {/* Validation Error Message */}
        {errorMsg && (
          <div className="flex items-center gap-2 text-xs font-medium text-[var(--danger)] animate-in fade-in duration-150">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </form>
    </div>
  );
}
