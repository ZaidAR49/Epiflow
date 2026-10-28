"use client";

import React, { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Sliders, FileText, Mail, Save, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { updateWorkflowSettingsAction } from "@/lib/actions/profile";

interface WorkflowSettingsFormProps {
  initialMetadata: {
    fullName?: string;
    cv?: string;
    sendEmail?: boolean;
    preferred_language?: "ar" | "en";
  };
}

export function WorkflowSettingsForm({ initialMetadata }: WorkflowSettingsFormProps) {
  const t = useTranslations("settings");
  const [isPending, startTransition] = useTransition();

  const [fullName, setFullName] = useState(initialMetadata.fullName || "");
  const [cv, setCv] = useState(initialMetadata.cv || "");
  const [sendEmail, setSendEmail] = useState(initialMetadata.sendEmail ?? true);

  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    startTransition(async () => {
      const result = await updateWorkflowSettingsAction({
        fullName: fullName.trim() || undefined,
        cv: cv.trim() || undefined,
        sendEmail,
      });

      if (result.success) {
        setStatusMessage({ type: "success", text: t("settingsSaved") });
      } else {
        setStatusMessage({ type: "error", text: result.message });
      }
    });
  };

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
      <div className="flex items-center gap-3 border-b border-[var(--border)] pb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20">
          <Sliders className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-[var(--text)]">{t("title")}</h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">{t("subtitle")}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        <div>
          <label htmlFor="applicantName" className="block text-sm font-medium text-[var(--text)] mb-1">
            {t("applicantName")}
          </label>
          <input
            id="applicantName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder={t("applicantNamePlaceholder")}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] transition-colors"
          />
          <p className="mt-1 text-xs text-[var(--text-muted)]">{t("applicantNameHelp")}</p>
        </div>

        <div>
          <label htmlFor="cvUrl" className="block text-sm font-medium text-[var(--text)] mb-1">
            {t("cvUrl")}
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3 text-[var(--text-muted)]">
              <FileText className="h-4 w-4" />
            </div>
            <input
              id="cvUrl"
              type="url"
              value={cv}
              onChange={(e) => setCv(e.target.value)}
              placeholder={t("cvPlaceholder")}
              dir="ltr"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] ps-10 pe-3.5 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] transition-colors"
            />
          </div>
          <p className="mt-1 text-xs text-[var(--text-muted)]">{t("cvUrlHelp")}</p>
        </div>

        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/60 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-5 items-center">
              <input
                type="checkbox"
                id="sendEmailCheckbox"
                checked={sendEmail}
                onChange={(e) => setSendEmail(e.target.checked)}
                className="h-4 w-4 rounded border-[var(--border)] bg-[var(--surface)] text-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] cursor-pointer"
              />
            </div>
            <label htmlFor="sendEmailCheckbox" className="space-y-0.5 cursor-pointer">
              <div className="flex items-center gap-1.5 text-sm font-medium text-[var(--text)]">
                <Mail className="h-4 w-4 text-[var(--accent)]" />
                <span>{t("sendEmailToggle")}</span>
              </div>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                {t("sendEmailHelp")}
              </p>
            </label>
          </div>
        </div>

        {statusMessage && (
          <div
            className={`flex items-center gap-2.5 rounded-lg p-3 text-xs font-medium border ${
              statusMessage.type === "success"
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-rose-500/10 text-rose-400 border-rose-500/20"
            }`}
          >
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[var(--accent)]/90 focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:outline-hidden disabled:opacity-50 transition-all cursor-pointer"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{t("saving")}</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>{t("saveSettings")}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
