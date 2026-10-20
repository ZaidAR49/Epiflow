"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import {
  Workflow,
  ArrowRight,
  Activity,
  CheckCircle2,
  AlertCircle,
  ImageIcon,
} from "lucide-react";
import type { RegisteredWorkflowItem } from "@/lib/db/queries/workflows";

interface RegisteredWorkflowsCardProps {
  workflows: RegisteredWorkflowItem[];
}

export function RegisteredWorkflowsCard({ workflows }: RegisteredWorkflowsCardProps) {
  const t = useTranslations("profile");
  const locale = useLocale();

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm space-y-5">
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20">
            <Workflow className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[var(--text)]">{t("registeredWorkflows")}</h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">{t("registeredWorkflowsDesc")}</p>
          </div>
        </div>
      </div>

      {workflows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[var(--border)] p-6 text-center text-xs text-[var(--text-muted)]">
          <AlertCircle className="h-6 w-6 text-amber-400 mx-auto mb-2" />
          <p>{t("noWorkflows")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {workflows.map((wf) => {
            const isUnlimited = wf.usageLimit === null;
            return (
              <div
                key={wf.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/60 p-4 hover:border-[var(--accent)]/50 transition-all shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
                    {wf.imageUrl ? (
                      <Image
                        src={wf.imageUrl}
                        alt={wf.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <ImageIcon className="h-5 w-5 text-[var(--text-muted)]" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <span className="font-bold text-sm text-[var(--text)]">{wf.name}</span>
                      {wf.isActive ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="h-3 w-3" />
                          {t("active")}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-400 border border-amber-500/20">
                          {t("inactive")}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                      <Activity className="h-3.5 w-3.5 text-[var(--accent)]" />
                      <span>
                        {t("scansUsed")}: <strong className="text-[var(--text)]">{wf.usageCount}</strong> /{" "}
                        {isUnlimited ? t("unlimited") : wf.usageLimit}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center">
                  <Link
                    href={`/${locale}/workflows/${wf.slug}`}
                    className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[var(--accent)]/90 transition-colors"
                  >
                    <span>{t("openWorkflow")}</span>
                    <ArrowRight className="h-3.5 w-3.5 rtl:-scale-x-100" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
