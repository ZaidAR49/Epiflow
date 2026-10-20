"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Send,
  CheckCircle2,
  AlertTriangle,
  Unlink,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  generateTelegramLinkTokenAction,
  disconnectTelegramAction,
  type TelegramDeepLinkData,
} from "@/lib/actions/telegram-link";
import { TelegramDeepLinkView } from "./telegram-deep-link-view";
import { TelegramManualForm } from "./telegram-manual-form";

interface TelegramLinkCardProps {
  telegramId: number | null;
  username: string | null;
}

export function TelegramLinkCard({ telegramId, username }: TelegramLinkCardProps) {
  const t = useTranslations("profile");
  const router = useRouter();

  const [localConnection, setLocalConnection] = useState<{
    id: number | null;
    username: string | null;
  } | null>(null);

  const connectedId = localConnection !== null ? localConnection.id : telegramId;
  const connectedUsername = localConnection !== null ? localConnection.username : username;
  const isConnected = connectedId !== null;
  const [deepLinkData, setDeepLinkData] = useState<TelegramDeepLinkData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGenerateLink = async () => {
    setErrorMessage(null);
    setIsGenerating(true);
    try {
      const res = await generateTelegramLinkTokenAction();
      if (res.success) {
        setDeepLinkData(res.data);
      } else {
        setErrorMessage(res.message);
      }
    } catch {
      setErrorMessage("Failed to initiate Telegram connection. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm(t("confirmDisconnect"))) return;

    setIsDisconnecting(true);
    try {
      const res = await disconnectTelegramAction();
      if (res.success) {
        setLocalConnection({ id: null, username: null });
        setDeepLinkData(null);
        router.refresh();
      }
    } catch {
      // Disconnect error
    } finally {
      setIsDisconnecting(false);
    }
  };

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm space-y-4 overflow-hidden">
      {/* Header */}
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

      {/* Connected State */}
      {isConnected ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-3">
              <span className="block text-xs text-[var(--text-muted)] mb-1">{t("telegramId")}</span>
              <span className="font-mono text-sm font-semibold text-[var(--text)]" dir="ltr">
                {connectedId}
              </span>
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-3">
              <span className="block text-xs text-[var(--text-muted)] mb-1">{t("telegramUsername")}</span>
              <span className="font-mono text-sm font-semibold text-[var(--text)]" dir="ltr">
                {connectedUsername ? `@${connectedUsername}` : "—"}
              </span>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={handleDisconnect}
              disabled={isDisconnecting}
              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition-colors disabled:opacity-50"
            >
              {isDisconnecting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Unlink className="h-3.5 w-3.5" />
              )}
              <span>{t("disconnectTelegram")}</span>
            </button>
          </div>
        </div>
      ) : (
        /* Not Connected State */
        <div className="space-y-4">
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            {t("telegramHelp")}
          </p>

          {errorMessage && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
              {errorMessage}
            </div>
          )}

          {/* Deep link active view */}
          {deepLinkData ? (
            <TelegramDeepLinkView
              data={deepLinkData}
              onRefresh={handleGenerateLink}
              isLoading={isGenerating}
              onConnected={(newId, newUser) => {
                setLocalConnection({ id: newId, username: newUser });
                setDeepLinkData(null);
                router.refresh();
              }}
            />
          ) : (
            <div className="flex justify-start">
              <button
                type="button"
                onClick={handleGenerateLink}
                disabled={isGenerating}
                className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-sky-600 transition-colors disabled:opacity-50"
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                <span>{t("connectTelegram")}</span>
              </button>
            </div>
          )}

          {/* Manual Entry Accordion */}
          <div className="border-t border-[var(--border)] pt-3">
            <button
              type="button"
              onClick={() => setShowManualForm(!showManualForm)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
            >
              <span>{t("orManualConnect")}</span>
              {showManualForm ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>

            {showManualForm && (
              <TelegramManualForm
                onSuccess={() => {
                  setShowManualForm(false);
                  router.refresh();
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
