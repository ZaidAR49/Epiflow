"use client";

import React, { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Mail, CheckCircle2, AlertCircle, Shield, Loader2, Unlink } from "lucide-react";
import { disconnectWorkflowCredentialAction } from "@/lib/actions/credentials";
import type { WorkflowCredentialStatus } from "@/lib/db/queries/credentials";

interface WorkflowCredentialsCardProps {
  slug: string;
  initialCredential: WorkflowCredentialStatus | null;
}

export function WorkflowCredentialsCard({
  slug,
  initialCredential,
}: WorkflowCredentialsCardProps) {
  const t = useTranslations("credentials");
  const [credential, setCredential] = useState<WorkflowCredentialStatus | null>(
    initialCredential
  );
  const [isPending, startTransition] = useTransition();
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const isConnected = credential !== null && credential.status === "active";

  const handleDisconnect = () => {
    setStatusMessage(null);
    startTransition(async () => {
      const res = await disconnectWorkflowCredentialAction(slug, "google");
      if (res.success) {
        setCredential(null);
        setStatusMessage({ type: "success", text: t("disconnectedSuccess") });
      } else {
        setStatusMessage({
          type: "error",
          text: res.message || t("failedToDisconnect"),
        });
      }
    });
  };

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm space-y-5">
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
            <Mail className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[var(--text)]">{t("title")}</h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">{t("subtitle")}</p>
          </div>
        </div>

        <div>
          {isConnected ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {t("statusConnected")}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-500/10 px-3 py-1 text-xs font-medium text-slate-400 border border-slate-500/20">
              <AlertCircle className="h-3.5 w-3.5" />
              {t("statusNotConnected")}
            </span>
          )}
        </div>
      </div>

      {isConnected ? (
        <div className="space-y-4">
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--text-muted)]">{t("accountEmail")}</span>
              <span className="font-mono font-semibold text-[var(--text)]" dir="ltr">
                {credential.accountEmail || "user@gmail.com"}
              </span>
            </div>
            <div className="flex items-start gap-1.5 text-[11px] text-[var(--text-muted)] pt-1 border-t border-[var(--border)]/60">
              <Shield className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>{t("scopeInfo")}</span>
            </div>
          </div>

          {statusMessage && (
            <div
              className={`rounded-lg p-3 text-xs font-medium border ${
                statusMessage.type === "success"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-rose-500/10 text-rose-400 border-rose-500/20"
              }`}
            >
              {statusMessage.text}
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={handleDisconnect}
              disabled={isPending}
              type="button"
              className="inline-flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>{t("disconnecting")}</span>
                </>
              ) : (
                <>
                  <Unlink className="h-3.5 w-3.5" />
                  <span>{t("disconnectButton")}</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface-2)]/50 p-4">
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              {t("scopeInfo")}
            </p>
          </div>

          {statusMessage && (
            <div
              className={`rounded-lg p-3 text-xs font-medium border ${
                statusMessage.type === "success"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-rose-500/10 text-rose-400 border-rose-500/20"
              }`}
            >
              {statusMessage.text}
            </div>
          )}

          <div className="flex justify-start">
            <a
              href={`/api/workflows/${slug}/auth/google`}
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[var(--accent)]/90 transition-colors"
            >
              <Mail className="h-4 w-4" />
              <span>{t("connectButton")}</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
