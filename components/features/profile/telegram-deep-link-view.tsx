"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { ExternalLink, Copy, Check, Clock, RefreshCw } from "lucide-react";
import type { TelegramDeepLinkData } from "@/lib/actions/telegram-link";

interface TelegramDeepLinkViewProps {
  data: TelegramDeepLinkData;
  onRefresh: () => void;
  isLoading: boolean;
}

const RESEND_COOLDOWN_SECONDS = 30;

export function TelegramDeepLinkView({
  data,
  onRefresh,
  isLoading,
}: TelegramDeepLinkViewProps) {
  const t = useTranslations("profile");
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(600); // 10 minutes
  const [cooldownLeft, setCooldownLeft] = useState<number>(RESEND_COOLDOWN_SECONDS);

  useEffect(() => {
    const expireTime = new Date(data.expiresAt).getTime();
    setCooldownLeft(RESEND_COOLDOWN_SECONDS);

    const updateTimer = () => {
      const remaining = Math.max(0, Math.floor((expireTime - Date.now()) / 1000));
      setTimeLeft(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [data.expiresAt]);

  useEffect(() => {
    if (cooldownLeft <= 0) return;
    const cooldownInterval = setInterval(() => {
      setCooldownLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(cooldownInterval);
  }, [cooldownLeft]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(data.command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback if clipboard API is restricted
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isExpired = timeLeft <= 0;
  const canResend = cooldownLeft === 0 || isExpired;

  return (
    <div className="rounded-xl border border-sky-500/30 bg-sky-500/5 p-4 space-y-4">
      {/* Timer & Regenerate Header */}
      <div className="flex items-center justify-between text-xs text-[var(--text-muted)] flex-wrap gap-2">
        <span className="flex items-center gap-1.5 font-medium text-sky-400">
          <Clock className="h-3.5 w-3.5" />
          <span>{t("expiresIn")}:</span>
          <span className="font-mono font-semibold" dir="ltr">
            {isExpired ? "0:00" : `${minutes}:${seconds.toString().padStart(2, "0")}`}
          </span>
        </span>

        {/* Resend Cooldown / Regenerate Action */}
        <div>
          {canResend ? (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
              <span>{isExpired ? t("generateNew") : t("regenerateLink")}</span>
            </button>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-[11px] text-[var(--text-muted)] font-mono">
              <RefreshCw className="h-2.5 w-2.5 text-[var(--text-muted)]" />
              <span>{t("resendIn", { seconds: cooldownLeft })}</span>
            </span>
          )}
        </div>
      </div>

      <p className="text-xs text-[var(--text-muted)] leading-relaxed">
        {t("connectingDesc")}
      </p>

      {/* 1-Click Action Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        <a
          href={isExpired ? "#" : data.deepLink}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-sky-500 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-sky-600 transition-colors ${
            isExpired ? "opacity-50 pointer-events-none" : ""
          }`}
        >
          <span>{t("openInTelegram")}</span>
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      {/* Copyable Command Block */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
          <span>{t("copyCommand")}</span>
          {copied && (
            <span className="text-emerald-400 flex items-center gap-1 font-medium">
              <Check className="h-3 w-3" />
              {t("copied")}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2">
          <code className="flex-1 font-mono text-xs text-[var(--text)] select-all truncate" dir="ltr">
            {data.command}
          </code>
          <button
            type="button"
            onClick={handleCopy}
            className="shrink-0 p-1 rounded hover:bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
            title={t("copyCommand")}
          >
            {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
