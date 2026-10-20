"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { ExternalLink, Copy, Check, Clock, RefreshCw } from "lucide-react";
import {
  checkTelegramStatusAction,
  type TelegramDeepLinkData,
} from "@/lib/actions/telegram-link";

interface TelegramDeepLinkViewProps {
  data: TelegramDeepLinkData;
  onRefresh: () => void;
  isLoading: boolean;
  onConnected: (telegramId: number, username: string | null) => void;
}

const RESEND_COOLDOWN_SECONDS = 30;

export function TelegramDeepLinkView({
  data,
  onRefresh,
  isLoading,
  onConnected,
}: TelegramDeepLinkViewProps) {
  const t = useTranslations("profile");
  const [copied, setCopied] = useState(false);
  const [isCheckingManual, setIsCheckingManual] = useState(false);
  const [manualStatusNotice, setManualStatusNotice] = useState<string | null>(null);

  const [timeLeft, setTimeLeft] = useState<number>(() => {
    return Math.max(0, Math.floor((new Date(data.expiresAt).getTime() - Date.now()) / 1000));
  });
  const [cooldownLeft, setCooldownLeft] = useState<number>(() => {
    const createdAt = new Date(data.expiresAt).getTime() - 10 * 60 * 1000;
    const elapsed = Math.floor((Date.now() - createdAt) / 1000);
    return Math.max(0, RESEND_COOLDOWN_SECONDS - elapsed);
  });

  // Dual countdown timers (token expiration and fast-resend cooldown)
  useEffect(() => {
    const expireTime = new Date(data.expiresAt).getTime();
    const createdAt = expireTime - 10 * 60 * 1000;

    const interval = setInterval(() => {
      const now = Date.now();
      const remainingExpire = Math.max(0, Math.floor((expireTime - now) / 1000));
      const elapsed = Math.floor((now - createdAt) / 1000);
      const remainingCooldown = Math.max(0, RESEND_COOLDOWN_SECONDS - elapsed);

      setTimeLeft(remainingExpire);
      setCooldownLeft(remainingCooldown);
    }, 1000);

    return () => clearInterval(interval);
  }, [data.expiresAt]);

  const isExpired = timeLeft <= 0;
  const canResend = cooldownLeft === 0 || isExpired;

  // Background light-polling every 3 seconds to auto-detect Telegram confirmation
  useEffect(() => {
    if (isExpired) return;

    let isMounted = true;
    const pollInterval = setInterval(async () => {
      try {
        const res = await checkTelegramStatusAction();
        if (isMounted && res.success && res.data.isConnected && res.data.telegramId) {
          clearInterval(pollInterval);
          onConnected(res.data.telegramId, res.data.username);
        }
      } catch {
        // Silently continue polling
      }
    }, 3000);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
    };
  }, [isExpired, onConnected]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(data.command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback if clipboard API is restricted
    }
  };

  const handleManualCheck = async () => {
    setIsCheckingManual(true);
    setManualStatusNotice(null);
    try {
      const res = await checkTelegramStatusAction();
      if (res.success && res.data.isConnected && res.data.telegramId) {
        setManualStatusNotice(t("nowConnected"));
        setTimeout(() => {
          onConnected(res.data.telegramId!, res.data.username);
        }, 800);
      } else {
        setManualStatusNotice(t("notConnectedYet"));
        setTimeout(() => setManualStatusNotice(null), 3500);
      }
    } catch {
      setManualStatusNotice(t("notConnectedYet"));
      setTimeout(() => setManualStatusNotice(null), 3500);
    } finally {
      setIsCheckingManual(false);
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="rounded-xl border border-sky-500/30 bg-sky-500/5 p-4 space-y-4 overflow-hidden">
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

      {/* 1-Click Action & Manual Refresh Status Buttons - Stacking ensures 100% containment */}
      <div className="flex flex-col gap-2.5 w-full">
        <a
          href={isExpired ? "#" : data.deepLink}
          target="_blank"
          rel="noopener noreferrer"
          className={`w-full inline-flex items-center justify-center gap-2 rounded-lg bg-sky-500 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-sky-600 transition-colors ${
            isExpired ? "opacity-50 pointer-events-none" : ""
          }`}
        >
          <span>{t("openInTelegram")}</span>
          <ExternalLink className="h-4 w-4" />
        </a>

        <button
          type="button"
          onClick={handleManualCheck}
          disabled={isCheckingManual || isExpired}
          className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-2 text-xs font-semibold text-[var(--text)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isCheckingManual ? "animate-spin text-[var(--accent)]" : ""}`} />
          <span>{isCheckingManual ? t("checkingStatus") : t("checkStatus")}</span>
        </button>
      </div>

      {manualStatusNotice && (
        <p className="text-center text-xs font-medium text-amber-400">
          {manualStatusNotice}
        </p>
      )}

      {/* Real-time Status Listening Pulse */}
      {!isExpired && (
        <div className="flex items-center gap-2 rounded-lg bg-[var(--surface-2)]/60 border border-emerald-500/20 px-3 py-2">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[11px] font-medium text-emerald-400">
            {t("listeningForBot")}
          </span>
        </div>
      )}

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
