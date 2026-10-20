"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Send, CheckCircle2, AlertTriangle, ExternalLink } from "lucide-react";

interface TelegramLinkCardProps {
  telegramId: number | null;
  username: string | null;
}

export function TelegramLinkCard({ telegramId, username }: TelegramLinkCardProps) {
  const t = useTranslations("profile");
  const isConnected = telegramId !== null;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Send className="h-5 w-5" />
          </div>
          <h3 className="text-base font-bold text-[var(--text)]">{t("telegramSection")}</h3>
        </div>
        <div>
          {isConnected ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {t("telegramConnected")}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-500/10 px-3 py-1 text-xs font-medium text-slate-400 border border-slate-500/20">
              <AlertTriangle className="h-3.5 w-3.5" />
              {t("telegramNotConnected")}
            </span>
          )}
        </div>
      </div>

      {isConnected ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-3">
            <span className="block text-xs text-[var(--text-muted)] mb-1">{t("telegramId")}</span>
            <span className="font-mono text-sm font-semibold text-[var(--text)]" dir="ltr">
              {telegramId}
            </span>
          </div>
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-3">
            <span className="block text-xs text-[var(--text-muted)] mb-1">{t("telegramUsername")}</span>
            <span className="font-mono text-sm font-semibold text-[var(--text)]" dir="ltr">
              {username ? `@${username}` : "—"}
            </span>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface-2)]/50 p-4 text-center">
          <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto leading-relaxed">
            {t("telegramHelp")}
          </p>
          <div className="mt-3 flex justify-center">
            <a
              href="https://t.me"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--accent)] hover:underline"
            >
              <span>Telegram Bot</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
