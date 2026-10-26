import React from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { ArrowRight, Sparkles } from "lucide-react";
import { EpiFlowLogo } from "@/components/ui/epiflow-logo";

interface HeroSectionProps {
  isSignedIn?: boolean;
}

export function HeroSection({ isSignedIn = false }: HeroSectionProps) {
  const t = useTranslations("landing");
  const locale = useLocale();

  return (
    <section className="relative overflow-hidden pt-10 pb-16 sm:pt-16 sm:pb-20 md:pt-20 md:pb-28">
      {/* Dynamic Ambient Background Glow */}
      <div
        className="absolute top-1/4 start-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-[600px] h-[280px] sm:h-[350px] bg-gradient-to-tr from-teal-500/10 via-sky-500/15 to-purple-600/15 blur-[100px] sm:blur-[120px] rounded-full pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center min-w-0">
        {/* Platform Pill Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-2)]/80 px-3.5 sm:px-4 py-1.5 text-xs font-semibold text-[var(--accent)] shadow-sm backdrop-blur-md hover:border-[var(--accent)]/40 transition-colors">
          <Sparkles className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
          <span className="truncate max-w-[260px] sm:max-w-none">{t("heroEyebrow")}</span>
        </div>

        {/* Brand Display: Official EpiFlow Logo */}
        <div className="mt-6 sm:mt-8 flex justify-center">
          <div className="sm:hidden">
            <EpiFlowLogo height={48} glow priority />
          </div>
          <div className="hidden sm:block">
            <EpiFlowLogo height={64} glow priority />
          </div>
        </div>

        {/* Main Headline */}
        <h1 className="mt-6 sm:mt-8 text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[var(--text)] max-w-4xl mx-auto leading-[1.15] break-words">
          {t("heroTitle")}
        </h1>

        {/* Subtitle */}
        <p className="mt-4 sm:mt-6 text-sm sm:text-base lg:text-lg text-[var(--text-muted)] max-w-2xl mx-auto leading-relaxed">
          {t("heroSubtitle")}
        </p>

        {/* Action Buttons */}
        <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 max-w-xs sm:max-w-none mx-auto w-full sm:w-auto">
          <a
            href="#workflows"
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 via-sky-500 to-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-sky-500/20 hover:shadow-sky-500/35 hover:scale-[1.02] transition-all duration-200"
          >
            <span>{t("exploreWorkflows")}</span>
            <ArrowRight className="h-4 w-4 rtl:-scale-x-100" />
          </a>

          <Link
            href={isSignedIn ? `/${locale}/dashboard` : `/${locale}/sign-in`}
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-6 py-3.5 text-sm font-semibold text-[var(--text)] hover:bg-[var(--surface)] hover:border-[var(--accent)]/50 transition-colors"
          >
            <span>{isSignedIn ? t("openConsole") : t("signIn")}</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
