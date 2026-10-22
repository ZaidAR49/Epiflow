import React from "react";
import { useTranslations } from "next-intl";
import { Layers, Bot, ShieldAlert, Languages, Cpu } from "lucide-react";

export function PlatformPillars() {
  const t = useTranslations("landing");

  const pillars = [
    {
      icon: Layers,
      color: "text-teal-400 bg-teal-500/10 border-teal-500/20",
      title: t("pillar1Title"),
      desc: t("pillar1Desc"),
    },
    {
      icon: Bot,
      color: "text-sky-400 bg-sky-500/10 border-sky-500/20",
      title: t("pillar2Title"),
      desc: t("pillar2Desc"),
    },
    {
      icon: ShieldAlert,
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      title: t("pillar3Title"),
      desc: t("pillar3Desc"),
    },
    {
      icon: Languages,
      color: "text-purple-400 bg-purple-500/10 border-purple-500/20",
      title: t("pillar4Title"),
      desc: t("pillar4Desc"),
    },
  ];

  return (
    <section className="py-16 sm:py-24 border-t border-[var(--border)]/70 bg-[var(--surface)]/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-1 text-xs font-semibold text-sky-400 mb-3">
            <Cpu className="h-3.5 w-3.5" />
            <span>{t("featuresBadge")}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--text)]">
            {t("featuresTitle")}
          </h2>
          <p className="mt-4 text-sm sm:text-base text-[var(--text-muted)] leading-relaxed">
            {t("featuresSubtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 transition-all duration-300 hover:border-[var(--accent)]/40 hover:-translate-y-1"
              >
                <div
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border mb-5 ${pillar.color}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-[var(--text)] mb-2">
                  {pillar.title}
                </h3>
                <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
                  {pillar.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
