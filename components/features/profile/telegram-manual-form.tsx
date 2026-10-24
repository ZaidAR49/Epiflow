"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, AlertCircle, HelpCircle } from "lucide-react";
import { linkTelegramManuallyAction } from "@/lib/actions/telegram-link";

interface TelegramManualFormProps {
  onSuccess: () => void;
}

export function TelegramManualForm({ onSuccess }: TelegramManualFormProps) {
  const t = useTranslations("profile");
  const [telegramIdInput, setTelegramIdInput] = useState("");
  const [usernameInput, setUsernameInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const parsedId = Number(telegramIdInput.trim());
    if (!telegramIdInput.trim() || isNaN(parsedId) || parsedId <= 0) {
      setErrorMessage("Please enter a valid positive numeric Telegram ID");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await linkTelegramManuallyAction({
        telegramId: parsedId,
        username: usernameInput.trim() || undefined,
      });

      if (res.success) {
        onSuccess();
      } else {
        if (res.errorCode === "TELEGRAM_ALREADY_LINKED") {
          setErrorMessage(t("alreadyLinkedError"));
        } else {
          setErrorMessage(res.message);
        }
      }
    } catch {
      setErrorMessage("Failed to link Telegram ID. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 pt-2">
      {errorMessage && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div>
        <label htmlFor="telegram-manual-id" className="block text-xs font-medium text-[var(--text-muted)] mb-1">
          {t("manualIdLabel")} <span className="text-rose-400">*</span>
        </label>
        <input
          id="telegram-manual-id"
          type="text"
          value={telegramIdInput}
          onChange={(e) => setTelegramIdInput(e.target.value)}
          placeholder="e.g. 2076665816"
          dir="ltr"
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:outline-hidden"
          required
        />
      </div>

      <div>
        <label htmlFor="telegram-manual-username" className="block text-xs font-medium text-[var(--text-muted)] mb-1">
          {t("manualUsernameLabel")}
        </label>
        <input
          id="telegram-manual-username"
          type="text"
          value={usernameInput}
          onChange={(e) => setUsernameInput(e.target.value)}
          placeholder="@username"
          dir="ltr"
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:outline-hidden"
        />
      </div>

      <div className="flex items-center justify-between gap-2 pt-1">
        <p className="flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
          <HelpCircle className="h-3 w-3 shrink-0" />
          <span>{t("telegramHelpFindId")}</span>
        </p>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3.5 py-1.5 text-xs font-semibold text-white hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:outline-hidden disabled:opacity-50 transition-all shrink-0 cursor-pointer"
        >
          {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          <span>{t("saveTelegramId")}</span>
        </button>
      </div>
    </form>
  );
}
