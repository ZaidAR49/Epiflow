"use client";

import React from "react";
import { useTranslations } from "next-intl";
import {
  Mail,
  Globe,
  Bot,
  Send,
  Database,
  Lock,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

export function ThirdPartyDisclosures() {
  const t = useTranslations("privacy");
  const tLegal = useTranslations("legalCommon");

  const cards = [
    {
      id: "google-apis",
      icon: Mail,
      title: t("googleApiTitle"),
      badge: t("googleApiBadge"),
      badgeColor: "text-amber-400 border-amber-400/30 bg-amber-400/10",
      paragraphs: [
        t("googleApiP1"),
        t("googleApiP2"),
      ],
      limitedUseHighlight: t("googleApiLimitedUse"),
      encryptionNote: t("googleApiTokens"),
    },
    {
      id: "apify-scraping",
      icon: Globe,
      title: t("apifyTitle"),
      badge: t("apifyBadge"),
      badgeColor: "text-sky-400 border-sky-400/30 bg-sky-400/10",
      paragraphs: [
        t("apifyP1"),
        t("apifyP2"),
      ],
    },
    {
      id: "ai-engines",
      icon: Bot,
      title: t("aiTitle"),
      badge: t("aiBadge"),
      badgeColor: "text-purple-400 border-purple-400/30 bg-purple-400/10",
      paragraphs: [
        t("aiP1"),
        t("aiP2"),
      ],
    },
    {
      id: "telegram-bot",
      icon: Send,
      title: t("telegramTitle"),
      badge: t("telegramBadge"),
      badgeColor: "text-cyan-400 border-cyan-400/30 bg-cyan-400/10",
      paragraphs: [
        t("telegramP1"),
        t("telegramP2"),
      ],
    },
    {
      id: "supabase-database",
      icon: Database,
      title: t("databaseTitle"),
      badge: t("databaseBadge"),
      badgeColor: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
      paragraphs: [
        t("databaseP1"),
        t("databaseP2"),
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="border-b border-[var(--border)] pb-4">
        <h3 className="text-base font-bold text-[var(--text)]">
          {tLegal("thirdPartyCardTitle")}
        </h3>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          {tLegal("thirdPartyCardSubtitle")}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 transition-all hover:border-[var(--accent)]/40"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--surface-2)] text-[var(--accent)] border border-[var(--border)]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[var(--text)]">
                      {card.title}
                    </h4>
                  </div>
                </div>

                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${card.badgeColor}`}
                >
                  <Lock className="h-3 w-3" />
                  {card.badge}
                </span>
              </div>

              <div className="space-y-3 text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
                {card.paragraphs.map((p, idx) => (
                  <p key={idx}>{p}</p>
                ))}

                {card.limitedUseHighlight && (
                  <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-200">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-semibold text-amber-300">
                          Google API Services User Data Policy Compliance:
                        </p>
                        <p className="leading-relaxed">
                          {card.limitedUseHighlight}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {card.encryptionNote && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-[var(--text-muted)] border-t border-[var(--border)] pt-3">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>{card.encryptionNote}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
